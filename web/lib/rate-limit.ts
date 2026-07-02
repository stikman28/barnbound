// In-memory fixed-window rate limiter + login lockout with exponential backoff.
// Good for a single container; swap the Map for Redis when we scale out on Azure.

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

// Periodically drop expired windows so the map can't grow unbounded.
const SWEEP_EVERY = 60_000;
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_EVERY) return;
  lastSweep = now;
  for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
}

/** Returns true if the action is allowed; false if the key is over its limit. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  sweep();
  const now = Date.now();
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  w.count += 1;
  return w.count <= max;
}

/** Best-effort client IP (Cloudflare/Azure set forwarding headers in prod). */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

// ---- Login lockout: 5 failures locks the account, backoff doubles each time. ----

type Lock = { failures: number; lockedUntil: number };
const locks = new Map<string, Lock>();

const LOCK_THRESHOLD = 5;
const BASE_LOCK_MS = 15 * 60_000; // 15 min, doubling per extra failure (cap 2h)

export function lockStatus(account: string): { locked: boolean; minutes: number } {
  const l = locks.get(account);
  if (!l || l.lockedUntil <= Date.now()) return { locked: false, minutes: 0 };
  return { locked: true, minutes: Math.ceil((l.lockedUntil - Date.now()) / 60_000) };
}

export function recordLoginFailure(account: string) {
  const l = locks.get(account) ?? { failures: 0, lockedUntil: 0 };
  l.failures += 1;
  if (l.failures >= LOCK_THRESHOLD) {
    const over = l.failures - LOCK_THRESHOLD;
    l.lockedUntil = Date.now() + Math.min(BASE_LOCK_MS * 2 ** over, 2 * 60 * 60_000);
  }
  locks.set(account, l);
}

export function recordLoginSuccess(account: string) {
  locks.delete(account);
}
