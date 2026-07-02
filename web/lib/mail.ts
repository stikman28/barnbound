// Outbound email. No provider is wired up yet, so this logs to the server
// console in dev; when we pick a provider (Resend/SES/etc.) only sendMail
// changes. Verification codes also work over SMS later via the same shape.

export async function sendMail(to: string, subject: string, body: string) {
  // TODO: real provider. For now, visible in `docker compose logs web`.
  console.log(`\n=== MAIL to ${to} ===\n${subject}\n${body}\n=== END MAIL ===\n`);
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
