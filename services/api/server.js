import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ballDontLieAdapter } from './src/adapters/balldontlie.js';
import { InMemoryCache } from './src/cache/InMemoryCache.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    const cacheKey = `players:${req.query.search || 'all'}:${req.query.cursor || 0}`;
    
    // Check cache first
    let cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Fetch from external API
    const result = await ballDontLieAdapter.getPlayers({
      cursor: req.query.cursor ? parseInt(req.query.cursor) : undefined,
      per_page: req.query.limit ? parseInt(req.query.limit) : 25,
      search: req.query.search
    });

    const response = {
      data: result.data,
      meta: {
        next_cursor: result.meta.next_cursor,
        per_page: result.meta.per_page
      }
    };

    // Cache the response
    cache.set(cacheKey, response);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/players/:id', async (req, res, next) => {
  try {
    const playerId = req.params.id;
    const cacheKey = `player:${playerId}`;
    
    // Check cache first
    let cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({ data: cachedData });
    }

    // Fetch from external API
    const player = await ballDontLieAdapter.getPlayer(playerId);

    // Cache the response
    cache.set(cacheKey, player);

    res.json({ data: player });
  } catch (error) {
    next(error);
  }
});

// Teams endpoints
app.get('/api/v1/teams', async (req, res, next) => {
  try {
    const cacheKey = 'teams:all';
    
    // Check cache first
    let cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Fetch from external API
    const teams = await ballDontLieAdapter.getTeams();

    const response = {
      data: teams,
      meta: {
        total: teams.length
      }
    };

    // Cache the response
    cache.set(cacheKey, response);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/teams/:id', async (req, res, next) => {
  try {
    const teamId = req.params.id;
    const cacheKey = `team:${teamId}`;
    
    // Check cache first
    let cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({ data: cachedData });
    }

    // Fetch from external API
    const team = await ballDontLieAdapter.getTeam(teamId);

    // Cache the response
    cache.set(cacheKey, team);

    res.json({ data: team });
  } catch (error) {
    next(error);
  }
});

// Games endpoints
app.get('/api/v1/games', async (req, res, next) => {
  try {
    const dates = req.query.dates ? [req.query.dates] : undefined;
    const seasons = req.query.seasons ? [parseInt(req.query.seasons)] : [new Date().getFullYear()];
    const team_ids = req.query.team_ids ? [parseInt(req.query.team_ids)] : undefined;
    
    const cacheKey = `games:${dates || 'all'}:${seasons}:${team_ids || 'all'}:${req.query.cursor || 0}`;
    
    // Check cache first
    let cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Fetch from external API
    const result = await ballDontLieAdapter.getGames({
      dates,
      seasons,
      team_ids,
      cursor: req.query.cursor ? parseInt(req.query.cursor) : undefined,
      per_page: req.query.limit ? parseInt(req.query.limit) : 25
    });

    const response = {
      data: result.data,
      meta: {
        next_cursor: result.meta.next_cursor,
        per_page: result.meta.per_page
      }
    };

    // Cache the response
    cache.set(cacheKey, response);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/games/:id', async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const cacheKey = `game:${gameId}`;
    
    // Check cache first
    let cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({ data: cachedData });
    }

    // Fetch from external API
    const game = await ballDontLieAdapter.getGame(gameId);

    // Cache the response
    cache.set(cacheKey, game);

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
