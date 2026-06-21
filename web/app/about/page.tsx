import Link from "next/link";

export const metadata = { title: "About — BarnBound" };

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Our Story</h1>
          <p>BarnBound is being built by the community, for the community.</p>
        </div>
      </section>

      <div className="container">
        <section className="about-grid">
          <div>
            <h2>Built for Horse People, by Horse People</h2>
            <p>Today, local equine business happens in Facebook groups, on flyers tacked to feed store bulletin boards, and in text chains passed between friends. That&apos;s inefficient, hard to trust, and misses the 80% of the community that isn&apos;t already in the right group.</p>
            <p>BarnBound replaces that with one centralized, identity-verified platform — built specifically for the equine industry. You can search local services, join discipline-specific groups, plan and find events, and buy or sell horses and equipment with real buyer protections.</p>
            <p>We&apos;re starting in Fort Collins and Northern Colorado — home to 50,000+ horses within an hour&apos;s drive and the CSU Equine Sciences program — with plans to grow across the Front Range and beyond.</p>
          </div>
          <aside className="mission-card">
            <h3>Our Mission</h3>
            <p>&ldquo;Connecting the Horse Community in One Place.&rdquo;</p>
            <p style={{ marginTop: "1rem" }}>To connect and strengthen the equine community by providing a centralized platform for marketing, communication, and commerce — becoming the leading digital marketplace for the equine industry across the United States.</p>
          </aside>
        </section>

        <section>
          <h2 className="section-title" style={{ marginTop: "3rem" }}>What We Believe</h2>
          <div className="value-grid">
            <div className="value"><h3>🛡️ Trust First</h3><p>Every business is verified. Sellers on the marketplace are identity-verified. Messaging stays on-platform. Optional escrow on high-value sales.</p></div>
            <div className="value"><h3>📍 Local Matters</h3><p>The horse industry is local. Who shoes your horse, who hauls, who boards — these are hyper-local relationships. BarnBound is built for that reality.</p></div>
            <div className="value"><h3>🤝 Small Business Friendly</h3><p>Solo farriers and small boarding barns don&apos;t need enterprise software. They need an affordable way to be found. Starter plans start at $29/month.</p></div>
            <div className="value"><h3>⭐ Professional, Not Performative</h3><p>Real reviews. Verified profiles. No algorithmic drama. A professional space for a professional industry.</p></div>
            <div className="value"><h3>🌱 Community-First Growth</h3><p>We grow by onboarding anchor barns, partnering with CSU, and showing up at horse shows — not by chasing empty signups.</p></div>
            <div className="value"><h3>🐴 Built by Riders</h3><p>Everything we build has to pass one test: would a horse person actually use this? If not, it doesn&apos;t ship.</p></div>
          </div>
        </section>

        <section>
          <div className="founder-card">
            <div className="founder-avatar" aria-hidden="true">👩‍🌾</div>
            <div className="founder-info">
              <h3>Rachel Bird</h3>
              <div className="role">Founder &amp; CEO · BarnBound, LLC</div>
              <p>Rachel is a student at Colorado State University in the Equine Sciences program (ANEQ). She grew up around horses and saw firsthand how fragmented the equine industry&apos;s online presence is. BarnBound started as her answer to that problem — and is being built with support from the CSU Animal Sciences faculty.</p>
              <p className="muted small">✉️ BarnBound@gmail.com</p>
            </div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 4rem" }}>
          <h2 className="section-title">Why Fort Collins First?</h2>
          <div className="value-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div className="value"><h3>30,000+ horses</h3><p>in Weld County alone — the highest equine concentration in Colorado.</p></div>
            <div className="value"><h3>50,000+ horses</h3><p>within one hour (Larimer + Weld + Boulder counties).</p></div>
            <div className="value"><h3>30+ boarding facilities</h3><p>in Larimer County, plus 6+ equine vet clinics and many farriers.</p></div>
            <div className="value"><h3>CSU Equine Sciences</h3><p>brings a continuous pipeline of horse owners and industry pros.</p></div>
          </div>
        </section>

        <section style={{ padding: "1rem 0 3rem" }}>
          <h2 className="section-title">Customer Support</h2>
          <p className="section-sub">Friendly, responsive help when you need it — most questions answered in under 24 hours.</p>
          <div className="support-grid">
            <div className="support-card"><div className="support-icon">✉️</div><h3>Email Us</h3><p>General questions, feedback, and account help.</p><div className="support-value">BarnBound@gmail.com</div></div>
            <div className="support-card"><div className="support-icon">💬</div><h3>In-App Messaging</h3><p>Sign in and chat with support from any page.</p><div className="support-value">Members only</div></div>
            <div className="support-card"><div className="support-icon">📚</div><h3>Help Center</h3><p>How-to guides, FAQs, and troubleshooting.</p><div className="support-value">help.barnbound.com <span className="muted small">(coming soon)</span></div></div>
            <div className="support-card"><div className="support-icon">🚩</div><h3>Report an Issue</h3><p>Report a listing, a review, or a safety concern.</p><div className="support-value">Report in-app or email us</div></div>
          </div>
        </section>

        <section className="cta-banner" style={{ borderRadius: "var(--radius-lg)", marginBottom: "4rem" }}>
          <div className="container cta-inner" style={{ padding: "0 2rem" }}>
            <div>
              <h2>Be Part of the First Wave</h2>
              <p>Early users and businesses help shape what BarnBound becomes. Join free today.</p>
            </div>
            <div className="cta-actions">
              <Link href="/pricing" className="btn btn-light">See Pricing</Link>
              <Link href="/signup" className="btn btn-primary">Join Free</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
