-- Add logo_url column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- Update teams with NBA logo URLs from official sources
-- Using ESPN's CDN for consistent, high-quality team logos

UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png' WHERE abbreviation = 'ATL';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png' WHERE abbreviation = 'BKN';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png' WHERE abbreviation = 'BOS';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png' WHERE abbreviation = 'CHA';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png' WHERE abbreviation = 'CHI';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png' WHERE abbreviation = 'CLE';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png' WHERE abbreviation = 'DAL';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/den.png' WHERE abbreviation = 'DEN';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/det.png' WHERE abbreviation = 'DET';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png' WHERE abbreviation = 'GSW';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png' WHERE abbreviation = 'HOU';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png' WHERE abbreviation = 'IND';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png' WHERE abbreviation = 'LAC';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png' WHERE abbreviation = 'LAL';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png' WHERE abbreviation = 'MEM';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png' WHERE abbreviation = 'MIA';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png' WHERE abbreviation = 'MIL';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/min.png' WHERE abbreviation = 'MIN';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/no.png' WHERE abbreviation = 'NOP';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png' WHERE abbreviation = 'NYK';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png' WHERE abbreviation = 'OKC';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png' WHERE abbreviation = 'ORL';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png' WHERE abbreviation = 'PHI';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png' WHERE abbreviation = 'PHX';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/por.png' WHERE abbreviation = 'POR';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png' WHERE abbreviation = 'SAC';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png' WHERE abbreviation = 'SAS';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png' WHERE abbreviation = 'TOR';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png' WHERE abbreviation = 'UTA';
UPDATE teams SET logo_url = 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png' WHERE abbreviation = 'WSH';
