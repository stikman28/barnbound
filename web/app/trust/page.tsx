import Link from "next/link";

export const metadata = { title: "Trust & Safety — BarnBound" };

const SECTIONS = [
  {
    icon: "🪪",
    title: "Every member is verified",
    body: "New accounts confirm their email before they can list, sell, buy, or message — and a human-verification check at signup keeps bots out. The \"✓ Verified Seller\" badge is earned, never given: it means the seller behind a listing completed verification. ID-verified seller credentials are coming next.",
  },
  {
    icon: "🛡️",
    title: "Businesses are protected from impersonation",
    body: "Claiming a business profile requires proof of connection — a work email, the business phone, or your name on their website — and every claim is reviewed by our team before ownership changes hands. No one can take over a barn, shop, or clinic's presence just by clicking first.",
  },
  {
    icon: "⚑",
    title: "The community can flag anything",
    body: "Every listing, product, and business profile has a report button. Reports go straight to our moderation queue, where our team can pull content from the site. Filing a false report is itself a violation — reports are logged and reviewed by humans.",
  },
  {
    icon: "💳",
    title: "Payments never touch our servers",
    body: "Shop checkout runs through PayPal (launching soon — orders are in test mode until then), so card numbers never pass through or get stored on BarnBound. Sale records are snapshotted at purchase time and can't be altered afterward, and new accounts have daily activity limits that slow down scaled fraud.",
  },
  {
    icon: "📜",
    title: "Sensitive actions leave a trail",
    body: "Registrations, verifications, checkouts, business claims, and every moderation decision are recorded in an append-only audit log with who did it and from where. If something goes wrong, we can reconstruct exactly what happened.",
  },
  {
    icon: "🔒",
    title: "Security is a design principle",
    body: "Passwords are strongly hashed (bcrypt) and sessions are short-lived and revocable — \"Sign Out Everywhere\" kills every session on every device instantly. The site ships strict security headers, all input is validated server-side, and every new feature is designed with its abuse case in mind: who could fake it, flood it, or deface it.",
  },
];

export default function TrustPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Trust &amp; Safety</h1>
          <p>
            BarnBound is built on the same handshake trust as the barn aisle. Here&apos;s how we
            protect the people, businesses, and horses behind every profile.
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 1rem 3rem", maxWidth: 900 }}>
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
          {SECTIONS.map((s) => (
            <article className="card" key={s.title} style={{ padding: "1.25rem 1.5rem" }}>
              <h3 style={{ marginTop: 0 }}>
                <span aria-hidden="true" style={{ marginRight: "0.5rem" }}>{s.icon}</span>
                {s.title}
              </h3>
              <p className="small" style={{ margin: 0 }}>{s.body}</p>
            </article>
          ))}
        </div>

        <div className="deal-summary" style={{ marginTop: "2rem" }}>
          <strong>See something wrong? Tell us.</strong>
          <span className="muted small">
            Use the ⚑ report button on any listing, product, or profile — or email{" "}
            <a href="mailto:security@barn-bound.com">security@barn-bound.com</a> for security issues.
            Researchers: please see our responsible disclosure policy in{" "}
            <a href="https://github.com/stikman28/barnbound/blob/main/SECURITY.md" target="_blank" rel="noopener">SECURITY.md</a>.
          </span>
        </div>

        <p className="muted small" style={{ marginTop: "1.5rem" }}>
          Questions about how we handle trust and safety? <Link href="/about">Get in touch</Link>.
        </p>
      </div>
    </>
  );
}
