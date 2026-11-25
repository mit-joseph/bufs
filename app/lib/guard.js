const hits = new Map();
export function limited(key, max, win) {
  const now = Date.now(), a = (hits.get(key) || []).filter((t) => now - t < win); a.push(now); hits.set(key, a);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < win)) hits.delete(k);
  return a.length > max;
}
export const ip = (req) => (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
