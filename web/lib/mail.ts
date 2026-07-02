// Outbound email via Resend (https://resend.com) when RESEND_API_KEY is set;
// falls back to console logging in dev so verification codes stay usable
// without a provider. Same shape can carry SMS later.

const FROM = () => process.env.MAIL_FROM || "BarnBound <verify@barn-bound.com>";

export async function sendMail(to: string, subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Dev fallback — visible in `docker compose logs web`.
    console.log(`\n=== MAIL to ${to} ===\n${subject}\n${body}\n=== END MAIL ===\n`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM(), to: [to], subject, text: body }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error(`mail send failed (${res.status}) to ${to}: ${err.slice(0, 300)}`);
    }
  } catch (e) {
    console.error(`mail send failed to ${to}:`, e);
  }
}

export function makeVerifyCode(): string {
  // 6 digits, crypto-random, never starts with 0 padding issues (pad instead).
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return String(n[0] % 1_000_000).padStart(6, "0");
}

export async function sendVerifyCode(to: string, code: string) {
  await sendMail(
    to,
    "Your BarnBound verification code",
    `Your BarnBound verification code is ${code}. It expires in 15 minutes.\n\nIf you didn't create a BarnBound account, you can ignore this email.`,
  );
}
