import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ballDontLieAdapter } from './src/adapters/balldontlie.js';
import { InMemoryCache } from './src/cache/InMemoryCache.js';
import { initializeDatabase } from './src/database/init.js';
import { repository } from './src/database/repository.js';
import { getTeamLogoUrl } from './src/utils/teamLogos.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
await initializeDatabase();

// Initialize cache
const cache = new InMemoryCache(300000); // 5 minutes TTL

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  const uptime = process.uptime();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: uptime
  });
});

// Players endpoints
app.get('/api/v1/players', async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    
    // Try to get from database first
    const dbPlayers = await repository.getAllPlayers(limit);
    
    // If we have data in DB, use it (with in-memory cache)
    if (dbPlayers && dbPlayers.length > 0) {
      const cacheKey = `players:db:${limit}`;
      let cachedData = cache.get(cacheKey);
      
      if (!cachedData) {
        // Transform DB format to API format
        const players = dbPlayers.map(p => ({
          id: p.id.toString(),
          firstName: p.first_name,
          lastName: p.last_name,
          position: p.position || 'N/A',
          height: p.height,
          weight: p.weight,
          jerseyNumber: p.jersey_number,
          college: p.college,
          country: p.country,
          draftYear: p.draft_year,
          draftRound: p.draft_round,
          draftNumber: p.draft_number,
          teamId: p.team_id ? p.team_id.toString() : null
        }));
        
        cachedData = {
          data: players,
          meta: { per_page: limit, total: players.length }
        };
        cache.set(cacheKey, cachedData);
      }
      
      return res.json(cachedData);
    }

    // If no data in DB, fetch from external API and store
    console.log('📡 Fetching players from external API...');
    const result = await ballDontLieAdapter.getPlayers({
      cursor: req.query.cursor ? parseInt(req.query.cursor) : undefined,
      per_page: limit,
      search: req.query.search
    });

    // Store in database
    const playersToStore = result.data.map(p => ({
      id: parseInt(p.id),
      first_name: p.firstName,
      last_name: p.lastName,
      position: p.position,
      height: p.height,
      weight: p.weight,
      jersey_number: p.jerseyNumber,
      college: p.college,
      country: p.country,
      draft_year: p.draftYear,
      draft_round: p.draftRound,
      draft_number: p.draftNumber,
      team_id: p.teamId ? parseInt(p.teamId) : null
    }));
    
    await repository.upsertPlayers(playersToStore);
    console.log(`✓ Stored ${playersToStore.length} players in database`);

    const response = {
      data: result.data,
      meta: {
        next_cursor: result.meta.next_cursor,
        per_page: result.meta.per_page
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/players/:id', async (req, res, next) => {
  try {
    const playerId = parseInt(req.params.id);
    
    // Try database first
    const dbPlayer = await repository.getPlayerById(playerId);
    
    if (dbPlayer) {
      const player = {
        id: dbPlayer.id.toString(),
        firstName: dbPlayer.first_name,
        lastName: dbPlayer.last_name,
        position: dbPlayer.position || 'N/A',
        height: dbPlayer.height,
        weight: dbPlayer.weight,
        jerseyNumber: dbPlayer.jersey_number,
        college: dbPlayer.college,
        country: dbPlayer.country,
        draftYear: dbPlayer.draft_year,
        draftRound: dbPlayer.draft_round,
        draftNumber: dbPlayer.draft_number,
        teamId: dbPlayer.team_id ? dbPlayer.team_id.toString() : null
      };
      return res.json({ data: player });
    }

    // Fetch from external API if not in DB
    console.log(`📡 Fetching player ${playerId} from external API...`);
    const player = await ballDontLieAdapter.getPlayer(req.params.id);

    // Store in database
    await repository.upsertPlayer({
      id: parseInt(player.id),
      first_name: player.firstName,
      last_name: player.lastName,
      position: player.position,
      height: player.height,
      weight: player.weight,
      jersey_number: player.jerseyNumber,
      college: player.college,
      country: player.country,
      draft_year: player.draftYear,
      draft_round: player.draftRound,
      draft_number: player.draftNumber,
      team_id: player.teamId ? parseInt(player.teamId) : null
    });

    res.json({ data: player });
  } catch (error) {
    next(error);
  }
});

// Teams endpoints
app.get('/api/v1/teams', async (req, res, next) => {
  try {
    // Try database first
    let dbTeams = await repository.getAllTeams();
    
    if (dbTeams && dbTeams.length > 0) {
      const needsEnrichment = dbTeams.some(team => !team.conference || !team.logo_url || !team.full_name);

      if (needsEnrichment) {
        try {
          const externalTeams = await ballDontLieAdapter.getTeams();
          const externalById = new Map(externalTeams.map(team => [parseInt(team.id), team]));

          const teamsToUpdate = dbTeams
            .map(existing => {
              const match = externalById.get(existing.id);
              if (!match) {
                return null;
              }

              const shouldUpdate = !existing.conference || !existing.full_name || !existing.logo_url;
              if (!shouldUpdate) {
                return null;
              }

              return {
                id: parseInt(match.id),
                name: match.name,
                full_name: match.fullName,
                abbreviation: match.abbreviation,
                city: match.city,
                conference: match.conference,
                division: match.division,
                logo_url: getTeamLogoUrl(match.abbreviation)
              };
            })
            .filter((team) => team !== null);

          if (teamsToUpdate.length > 0) {
            await repository.upsertTeams(teamsToUpdate);
            dbTeams = await repository.getAllTeams();
          }
        } catch (error) {
          console.warn('Failed to enrich team metadata:', error);
        }
      }

      const teams = dbTeams.map(t => ({
        id: t.id.toString(),
        name: t.name,
        fullName: t.full_name,
        abbreviation: t.abbreviation,
        city: t.city,
        conference: t.conference,
        division: t.division,
        logoUrl: t.logo_url || getTeamLogoUrl(t.abbreviation)
      }));
      
      return res.json({
        data: teams,
        meta: { total: teams.length }
      });
    }

    // Fetch from external API if not in DB
    console.log('📡 Fetching teams from external API...');
    const teams = await ballDontLieAdapter.getTeams();

    // Store in database
    const teamsToStore = teams.map(t => ({
      id: parseInt(t.id),
      name: t.name,
      full_name: t.fullName,
      abbreviation: t.abbreviation,
      city: t.city,
      conference: t.conference,
      division: t.division,
      logo_url: getTeamLogoUrl(t.abbreviation)
    }));
    
    await repository.upsertTeams(teamsToStore);
    console.log(`✓ Stored ${teamsToStore.length} teams in database`);

    const response = {
      data: teams,
      meta: { total: teams.length }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/teams/:id', async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id);
    
    // Try database first
    const dbTeam = await repository.getTeamById(teamId);
    
    if (dbTeam) {
      const team = {
        id: dbTeam.id.toString(),
        name: dbTeam.name,
        fullName: dbTeam.full_name,
        abbreviation: dbTeam.abbreviation,
        city: dbTeam.city,
        conference: dbTeam.conference,
        division: dbTeam.division,
        logoUrl: dbTeam.logo_url || getTeamLogoUrl(dbTeam.abbreviation)
      };
      return res.json({ data: team });
    }

    // Fetch from external API if not in DB
    console.log(`📡 Fetching team ${teamId} from external API...`);
    const team = await ballDontLieAdapter.getTeam(req.params.id);

    // Store in database
    await repository.upsertTeam({
      id: parseInt(team.id),
      name: team.name,
      full_name: team.fullName,
      abbreviation: team.abbreviation,
      city: team.city,
      conference: team.conference,
      division: team.division,
      logo_url: getTeamLogoUrl(team.abbreviation)
    });

    res.json({ data: team });
  } catch (error) {
    next(error);
  }
});

// Games endpoints
app.get('/api/v1/games', async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const season = req.query.seasons ? parseInt(req.query.seasons) : new Date().getFullYear();
    
    // Try database first
    const dbGames = await repository.getAllGames(limit, season);
    
    if (dbGames && dbGames.length > 0) {
      // Get team info for each game
      const gamesWithTeams = await Promise.all(dbGames.map(async (g) => {
        const homeTeam = await repository.getTeamById(g.home_team_id);
        const awayTeam = await repository.getTeamById(g.visitor_team_id);
        
        return {
          id: g.id.toString(),
          date: g.date,
          season: g.season,
          status: g.status,
          period: g.period,
          time: g.time,
          postseason: g.postseason,
          homeTeam: homeTeam ? {
            id: homeTeam.id.toString(),
            name: homeTeam.name,
            abbreviation: homeTeam.abbreviation,
            city: homeTeam.city,
            logoUrl: homeTeam.logo_url || getTeamLogoUrl(homeTeam.abbreviation)
          } : null,
          awayTeam: awayTeam ? {
            id: awayTeam.id.toString(),
            name: awayTeam.name,
            abbreviation: awayTeam.abbreviation,
            city: awayTeam.city,
            logoUrl: awayTeam.logo_url || getTeamLogoUrl(awayTeam.abbreviation)
          } : null,
          homeScore: g.home_team_score,
          awayScore: g.visitor_team_score
        };
      }));
      
      return res.json({
        data: gamesWithTeams,
        meta: { per_page: limit, total: gamesWithTeams.length }
      });
    }

    // Fetch from external API if not in DB
    console.log('📡 Fetching games from external API...');
    const result = await ballDontLieAdapter.getGames({
      dates: req.query.dates ? [req.query.dates] : undefined,
      seasons: [season],
      team_ids: req.query.team_ids ? [parseInt(req.query.team_ids)] : undefined,
      cursor: req.query.cursor ? parseInt(req.query.cursor) : undefined,
      per_page: limit
    });

    // Store games and teams in database
    for (const game of result.data) {
      // Store teams first
      if (game.homeTeam) {
        await repository.upsertTeam({
          id: parseInt(game.homeTeam.id),
          name: game.homeTeam.name,
          abbreviation: game.homeTeam.abbreviation,
          city: game.homeTeam.city,
          conference: game.homeTeam.conference,
          division: game.homeTeam.division,
          logo_url: getTeamLogoUrl(game.homeTeam.abbreviation)
        });
      }
      if (game.awayTeam) {
        await repository.upsertTeam({
          id: parseInt(game.awayTeam.id),
          name: game.awayTeam.name,
          abbreviation: game.awayTeam.abbreviation,
          city: game.awayTeam.city,
          conference: game.awayTeam.conference,
          division: game.awayTeam.division,
          logo_url: getTeamLogoUrl(game.awayTeam.abbreviation)
        });
      }
      
      // Store game
      await repository.upsertGame({
        id: parseInt(game.id),
        date: game.date,
        season: game.season,
        status: game.status,
        period: game.period,
        time: game.time,
        postseason: game.postseason,
        home_team_id: parseInt(game.homeTeam.id),
        visitor_team_id: parseInt(game.awayTeam.id),
        home_team_score: game.homeScore,
        visitor_team_score: game.awayScore
      });
    }
    console.log(`✓ Stored ${result.data.length} games in database`);

    const response = {
      data: result.data,
      meta: {
        next_cursor: result.meta.next_cursor,
        per_page: result.meta.per_page
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/games/:id', async (req, res, next) => {
  try {
    const gameId = parseInt(req.params.id);
    
    // Try database first
    const dbGame = await repository.getGameById(gameId);
    
    if (dbGame) {
      // Get team info
      const homeTeam = await repository.getTeamById(dbGame.home_team_id);
      const awayTeam = await repository.getTeamById(dbGame.visitor_team_id);
      
      const game = {
        id: dbGame.id.toString(),
        date: dbGame.date,
        season: dbGame.season,
        status: dbGame.status,
        period: dbGame.period,
        time: dbGame.time,
        postseason: dbGame.postseason,
        homeTeam: homeTeam ? {
          id: homeTeam.id.toString(),
          name: homeTeam.name,
          abbreviation: homeTeam.abbreviation,
          city: homeTeam.city,
          logoUrl: homeTeam.logo_url || getTeamLogoUrl(homeTeam.abbreviation)
        } : null,
        awayTeam: awayTeam ? {
          id: awayTeam.id.toString(),
          name: awayTeam.name,
          abbreviation: awayTeam.abbreviation,
          city: awayTeam.city,
          logoUrl: awayTeam.logo_url || getTeamLogoUrl(awayTeam.abbreviation)
        } : null,
        homeScore: dbGame.home_team_score,
        awayScore: dbGame.visitor_team_score
      };
      
      return res.json({ data: game });
    }

    // Fetch from external API if not in DB
    console.log(`📡 Fetching game ${gameId} from external API...`);
    const game = await ballDontLieAdapter.getGame(req.params.id);

    // Store teams and game in database
    if (game.homeTeam) {
      await repository.upsertTeam({
        id: parseInt(game.homeTeam.id),
        name: game.homeTeam.name,
        abbreviation: game.homeTeam.abbreviation,
        city: game.homeTeam.city,
        conference: game.homeTeam.conference,
        division: game.homeTeam.division,
        logo_url: getTeamLogoUrl(game.homeTeam.abbreviation)
      });
    }
    if (game.awayTeam) {
      await repository.upsertTeam({
        id: parseInt(game.awayTeam.id),
        name: game.awayTeam.name,
        abbreviation: game.awayTeam.abbreviation,
        city: game.awayTeam.city,
        conference: game.awayTeam.conference,
        division: game.awayTeam.division,
        logo_url: getTeamLogoUrl(game.awayTeam.abbreviation)
      });
    }
    
    await repository.upsertGame({
      id: parseInt(game.id),
      date: game.date,
      season: game.season,
      status: game.status,
      period: game.period,
      time: game.time,
      postseason: game.postseason,
      home_team_id: parseInt(game.homeTeam.id),
      visitor_team_id: parseInt(game.awayTeam.id),
      home_team_score: game.homeScore,
      visitor_team_score: game.awayScore
    });

    res.json({ data: game });
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if (err.message && err.message.includes('External API')) {
    return res.status(502).json({
      error: 'Bad Gateway',
      message: 'Unable to fetch data from external NBA stats provider',
      details: err.message
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NBA Stats API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
