import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="foot-col">
          <div className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="BarnBound" />
          </div>
          <p className="muted">Connecting the Horse Community in One Place</p>
        </div>
        <div className="foot-col">
          <h4>Explore</h4>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/directory">Directory</Link>
          <Link href="/community">Community</Link>
          <Link href="/map">Map</Link>
        </div>
        <div className="foot-col">
          <h4>Business</h4>
          <Link href="/pricing">Pricing</Link>
          <Link href="/directory">List Your Business</Link>
        </div>
        <div className="foot-col">
          <h4>About</h4>
          <Link href="/about">Our Story</Link>
          <Link href="/about">Contact</Link>
          <Link href="/trust">Trust &amp; Safety</Link>
        </div>
        <div className="foot-col qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qr-barnbound.png" alt="QR code to BarnBound site" />
          <div className="qr-caption">Scan to visit</div>
        </div>
      </div>
      <div className="container foot-bottom">
        <small>© 2026 BarnBound, LLC · ANEQ 204 Business Plan</small>
      </div>
    </footer>
  );
}
