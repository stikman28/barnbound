// Cloudflare Turnstile server-side verification.
// Enabled whenever TURNSTILE_SECRET_KEY is set; skipped otherwise (local dev
// without keys). docker-compose ships Cloudflare's always-pass test keys so
// the widget renders in dev; real keys come from the Cloudflare dashboard.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured — dev only
  if (!token) return false;
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false; // fail closed — bots don't get a pass on network errors
  }
}
