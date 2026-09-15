// Player dataset (220KB) loads on demand — never in first paint.
// All callers share one cached chunk; static imports remain only in
// lazy-loaded routes (AuctionRoom, Summary, Fantasy), which reuse it.
let cache = null;

export const getPlayers = async () => {
  if (!cache) {
    cache = (await import('../data/players')).IPL_PLAYERS;
  }
  return cache;
};
