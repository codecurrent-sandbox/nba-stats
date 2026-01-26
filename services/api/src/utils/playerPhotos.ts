/**
 * Generates NBA player photo URLs using the NBA CDN
 * NBA.com uses player IDs to reference headshot photos
 */
export function getPlayerPhotoUrl(playerId: number): string {
  if (!playerId) {
    console.warn('No player ID provided for photo URL');
    return '';
  }

  // NBA.com CDN pattern for player headshots
  // Using cdn.nba.com which provides reliable player headshots
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`;
}
