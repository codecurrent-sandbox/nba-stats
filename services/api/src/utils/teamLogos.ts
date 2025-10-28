/**
 * Maps NBA team abbreviations to ESPN's CDN logo URLs
 * ESPN uses lowercase abbreviations with special cases for some teams
 */
export function getTeamLogoUrl(abbreviation: string): string {
  const abbrevMap: Record<string, string> = {
    'ATL': 'atl',
    'BKN': 'bkn',
    'BOS': 'bos',
    'CHA': 'cha',
    'CHI': 'chi',
    'CLE': 'cle',
    'DAL': 'dal',
    'DEN': 'den',
    'DET': 'det',
    'GSW': 'gs',     // Golden State Warriors uses 'gs' not 'gsw'
    'HOU': 'hou',
    'IND': 'ind',
    'LAC': 'lac',
    'LAL': 'lal',
    'MEM': 'mem',
    'MIA': 'mia',
    'MIL': 'mil',
    'MIN': 'min',
    'NOP': 'no',     // New Orleans Pelicans uses 'no' not 'nop'
    'NYK': 'ny',     // New York Knicks uses 'ny' not 'nyk'
    'OKC': 'okc',
    'ORL': 'orl',
    'PHI': 'phi',
    'PHX': 'phx',
    'POR': 'por',
    'SAC': 'sac',
    'SAS': 'sa',     // San Antonio Spurs uses 'sa' not 'sas'
    'TOR': 'tor',
    'UTA': 'utah',   // Utah Jazz uses 'utah' not 'uta'
    'WSH': 'wsh',
  };

  const espnAbbrev = abbrevMap[abbreviation.toUpperCase()];
  if (!espnAbbrev) {
    console.warn(`No logo mapping found for team abbreviation: ${abbreviation}`);
    return '';
  }

  return `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbrev}.png`;
}
