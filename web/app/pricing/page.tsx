import Link from "next/link";

const feeCard = {
  background: "#fff",
  padding: "1.5rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  textAlign: "center" as const,
};
const feeNum = {
  fontSize: "2rem",
  color: "var(--rust-500)",
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
};

export const metadata = { title: "Pricing — BarnBound" };

export default function PricingPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Simple Pricing, Built for the Barn</h1>
          <p>Free for riders. Fair for small businesses. Powerful for larger operations. All content is free to search — upgrade when you want to do more.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "0 0 4rem" }}>
        <h2 className="section-title" style={{ marginTop: "3rem" }}>For Horse Owners</h2>
        <p className="section-sub">Browse and search the whole platform for free. Upgrade to post, message, and unlock advanced tools.</p>

        <div className="pricing-grid">
          <div className="plan">
            <div className="plan-name">Free</div>
            <div className="plan-audience">For anyone curious about the horse community.</div>
            <div className="plan-price">$0 <span className="period">forever</span></div>
            <ul className="plan-features">
              <li>Search the full platform</li>
              <li>Browse marketplace listings</li>
              <li>View business profiles &amp; reviews</li>
              <li>See events &amp; public forums</li>
              <li>Comment in forums and groups</li>
            </ul>
            <Link href="/signup" className="btn btn-outline">Get Started</Link>
          </div>

          <div className="plan highlight">
            <div className="plan-name">Consumer Premium</div>
            <div className="plan-audience">For active horse owners and riders.</div>
            <div className="plan-price">$4.99 <span className="period">/month</span></div>
            <div className="muted small" style={{ marginTop: "-0.5rem" }}>or $49/year <span className="save-badge">SAVE 18%</span></div>
            <ul className="plan-features">
              <li>Everything in Free</li>
              <li>Direct messaging with businesses</li>
              <li>Post in forums &amp; groups</li>
              <li>Saved searches &amp; price-drop alerts</li>
              <li>Advanced filters</li>
              <li>Ad-free experience</li>
              <li>Priority support</li>
            </ul>
            <Link href="/signup" className="btn btn-primary">Start Premium</Link>
          </div>
        </div>

        <h2 className="section-title" style={{ marginTop: "4rem" }}>For Equine Businesses</h2>
        <p className="section-sub">Reach the Front Range horse community directly. Verified profiles, real reviews, measurable reach.</p>

        <div className="pricing-grid">
          <div className="plan">
            <div className="plan-name">Starter</div>
            <div className="plan-audience">Solo farriers, haulers, photographers, and small operators.</div>
            <div className="plan-price">$29 <span className="period">/month</span></div>
            <div className="muted small" style={{ marginTop: "-0.5rem" }}>or $290/year <span className="save-badge">SAVE 17%</span></div>
            <ul className="plan-features">
              <li>Verified business profile</li>
              <li>Contact form &amp; hours</li>
              <li>Services &amp; pricing display</li>
              <li>Customer reviews</li>
              <li>5 photos</li>
            </ul>
            <Link href="/signup" className="btn btn-outline">Start with Starter</Link>
          </div>

          <div className="plan highlight">
            <div className="plan-name">Pro</div>
            <div className="plan-audience">Boarding facilities, training barns, vet clinics, feed &amp; tack stores.</div>
            <div className="plan-price">$99 <span className="period">/month</span></div>
            <div className="muted small" style={{ marginTop: "-0.5rem" }}>or $990/year <span className="save-badge">SAVE 17%</span></div>
            <ul className="plan-features">
              <li>Everything in Starter</li>
              <li>Unlimited photos &amp; video</li>
              <li>Event calendar</li>
              <li>Basic analytics</li>
              <li>1 featured listing / month</li>
            </ul>
            <Link href="/signup" className="btn btn-primary">Go Pro</Link>
          </div>

          <div className="plan">
            <div className="plan-name">Premier</div>
            <div className="plan-audience">Multi-barn operations, regional vet practices, sponsors.</div>
            <div className="plan-price">$299 <span className="period">/month</span></div>
            <div className="muted small" style={{ marginTop: "-0.5rem" }}>or $2,990/year <span className="save-badge">SAVE 17%</span></div>
            <ul className="plan-features">
              <li>Everything in Pro</li>
              <li>Advanced demographic analytics</li>
              <li>$50/mo geo-targeted ad credit</li>
              <li>Priority placement in local search</li>
              <li>Quarterly content services credit</li>
            </ul>
            <Link href="/signup" className="btn btn-outline">Go Premier</Link>
          </div>
        </div>

        <div style={{ background: "var(--cream-100)", padding: "3rem 2rem", borderRadius: "var(--radius-lg)", margin: "4rem 0 0" }}>
          <h2 className="section-title">Marketplace Fees</h2>
          <p className="section-sub">Fair, transparent fees on sales — refundable listing fee on horses, so there&apos;s no barrier to listing.</p>
          <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", maxWidth: "1000px", margin: "0 auto" }}>
            <div style={feeCard}><div style={feeNum}>5%</div><strong>Horse Sales Commission</strong><p className="small muted" style={{ margin: "0.5rem 0 0" }}>Commission on completed horse sales</p></div>
            <div style={feeCard}><div style={feeNum}>3%</div><strong>Tack &amp; Equipment</strong><p className="small muted" style={{ margin: "0.5rem 0 0" }}>On sales above $100</p></div>
            <div style={feeCard}><div style={feeNum}>$5</div><strong>Horse Listing Fee</strong><p className="small muted" style={{ margin: "0.5rem 0 0" }}>Refundable on completion</p></div>
            <div style={feeCard}><div style={feeNum}>1.5%</div><strong>Optional Escrow</strong><p className="small muted" style={{ margin: "0.5rem 0 0" }}>For sales above $5,000</p></div>
          </div>
        </div>

        <div className="content-services-banner">
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <span className="eyebrow" style={{ background: "var(--rust-500)" }}>Add-On Services</span>
              <h2 className="section-title" style={{ marginTop: "0.75rem" }}>Content Services</h2>
              <p className="section-sub" style={{ marginBottom: 0 }}>À la carte promotion and production — available to every tier. Work with our team to grow your audience beyond BarnBound.</p>
            </div>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon">📣</div>
                <h3>Featured Posts</h3>
                <div className="service-price">$10 – $50 <span>per post</span></div>
                <p>Pin your barn, service, or listing to the top of the local feed. Boosted visibility in your county for 7 days.</p>
                <ul className="service-perks"><li>Pinned placement in local search</li><li>Homepage featured tile</li><li>Priority in category listings</li></ul>
              </div>
              <div className="service-card highlight">
                <div className="service-icon">📸</div>
                <h3>Photo &amp; Video Packages</h3>
                <div className="service-price">$100 – $500 <span>per package</span></div>
                <p>Professional photo and video production for your barn, your horse, or your business — shot by our roster of local equine photographers.</p>
                <ul className="service-perks"><li>Profile photo shoot (½ day)</li><li>Short-form video reel for social</li><li>Sales listing photography</li><li>Event coverage</li></ul>
              </div>
              <div className="service-card">
                <div className="service-icon">🌐</div>
                <h3>Cross-Platform Distribution</h3>
                <div className="service-price">Included in Premier</div>
                <p>We take your content and push it out everywhere — Instagram, Facebook, YouTube, TikTok, X, and Pinterest — with automation built for equine businesses.</p>
                <ul className="service-perks"><li>Auto-post to 6 platforms</li><li>Scheduling &amp; analytics</li><li>Caption &amp; hashtag optimization</li><li>Monthly performance report</li></ul>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: "3rem" }}>
              <Link href="/signup" className="btn btn-primary">Talk to Our Content Team</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
