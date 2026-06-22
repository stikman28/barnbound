"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, priceLabel } from "@/lib/client";

type Listing = { id: string; title: string; type: string; price: number; city: string; emoji: string; breed: string | null; discipline: string | null; age: number | null; category: string | null; featured: boolean };
type Business = { id: number; name: string; city: string; image: string | null; emoji: string | null; rating: number; reviews: number; tags: string[]; category: string };

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    apiGet<{ listings: Listing[] }>("/api/listings?sort=featured").then((d) => setListings(d.listings.slice(0, 4))).catch(() => {});
    apiGet<{ businesses: Business[] }>("/api/businesses").then((d) => setBusinesses(d.businesses.slice(0, 6))).catch(() => {});
  }, []);

  function search(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (loc.trim()) params.set("loc", loc.trim());
    const qs = params.toString();
    router.push("/directory" + (qs ? `?${qs}` : ""));
  }

  return (
    <main>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Built for the Equine Community</span>
            <h1>Connecting the Horse Community in One Place</h1>
            <p className="lede">
              One trusted platform for horse owners, trainers, veterinarians, farriers, feed stores,
              and everyone who makes the equine world go round. Starting in Fort Collins, built for real horse people.
            </p>
            <form className="hero-search" onSubmit={search}>
              <input type="text" placeholder="Search trainers, vets, feed stores, tack…" aria-label="Search BarnBound" value={q} onChange={(e) => setQ(e.target.value)} />
              <input type="text" placeholder="Fort Collins, CO" aria-label="Location" className="loc" value={loc} onChange={(e) => setLoc(e.target.value)} />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>
            <div className="hero-stats">
              <div><strong>30,000+</strong><span>Horses in Weld County</span></div>
              <div><strong>50,000+</strong><span>Horses within 1hr drive</span></div>
              <div><strong>$1.6B</strong><span>Colorado equine economy</span></div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-card card-1"><div className="avatar">🐎</div><div><strong>Poudre River Stables</strong><span className="muted">Boarding · Fort Collins</span><span className="stars">★★★★★ <small>(48)</small></span></div></div>
            <div className="hero-card card-2"><div className="avatar">🩺</div><div><strong>Dr. Mitchell, DVM</strong><span className="muted">Equine Vet · Larimer County</span><span className="stars">★★★★★ <small>(32)</small></span></div></div>
            <div className="hero-card card-3"><div className="avatar">🐴</div><div><strong>Quarter Horse Gelding, 8yr</strong><span className="muted">$12,500 · Verified Seller</span><span className="tag">For Sale</span></div></div>
          </div>
        </div>
      </section>

      <section className="section how-it-works">
        <div className="container">
          <h2 className="section-title">How BarnBound Works</h2>
          <p className="section-sub">A single, identity-verified home for the local horse community.</p>
          <div className="steps">
            <div className="step"><div className="step-num">1</div><h3>Discover Local Services</h3><p>Search trainers, vets, farriers, boarding facilities, feed stores and tack shops — filtered by location, discipline and ratings.</p></div>
            <div className="step"><div className="step-num">2</div><h3>Connect with Confidence</h3><p>Every business is verified. Message directly in-app, read real reviews, and join community groups for your discipline.</p></div>
            <div className="step"><div className="step-num">3</div><h3>Buy, Sell &amp; Grow</h3><p>Shop the marketplace for horses and tack from identity-verified sellers. Optional escrow on sales over $5,000.</p></div>
          </div>
        </div>
      </section>

      <section className="section alt-bg">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="eyebrow">Launch Partners</span>
            <h2 className="section-title" style={{ marginTop: "0.75rem" }}>Our Founding Partners</h2>
            <p className="section-sub" style={{ marginBottom: 0 }}>Real Northern Colorado businesses joining BarnBound at launch — tack shops, trainers, vets, farriers, and ranch retailers trusted by local riders.</p>
          </div>
          <div className="card-grid">
            {businesses.map((b) => (
              <Link href={`/business/${b.id}`} className="card card-link" key={b.id}>
                <div className="card-image">
                  {b.image
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={b.image} alt={b.name} loading="lazy" />
                    : <span style={{ fontSize: "5rem" }}>{b.emoji}</span>}
                </div>
                <div className="card-body">
                  <h3>{b.name}</h3>
                  <div className="card-meta">{b.category} · {b.city}</div>
                  <div className="rating">★ {b.rating} <span className="count">({b.reviews})</span></div>
                  <div className="card-tags">{b.tags.slice(0, 3).map((t) => <span className="chip" key={t}>{t}</span>)}</div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link href="/directory" className="btn btn-outline">Browse the full directory →</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="split-head">
            <h2 className="section-title">Featured on the Marketplace</h2>
            <Link href="/marketplace" className="link-arrow">Shop all listings →</Link>
          </div>
          <div className="card-grid">
            {listings.map((l) => (
              <article className="card" key={l.id}>
                <div className="card-image" aria-hidden="true">
                  <span style={{ fontSize: "5rem" }}>{l.emoji}</span>
                  {l.featured ? <span className="badge featured">Featured</span> : null}
                </div>
                <div className="card-body">
                  <h3>{l.title}</h3>
                  <div className="card-meta">{l.type === "HORSE" ? [l.breed, l.discipline, l.city].filter(Boolean).join(" · ") : `${l.category || l.type} · ${l.city}`}</div>
                  <div className="card-price">{priceLabel(l.price)}</div>
                  <div className="card-footer"><Link href="/marketplace" className="link-arrow small">View →</Link></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <div className="container cta-inner">
          <div>
            <h2>Join the Horse Community, the Way It Should Be</h2>
            <p>Free to browse. Free to join. Professional tools when you need them.</p>
          </div>
          <div className="cta-actions">
            <Link href="/pricing" className="btn btn-light">See Pricing</Link>
            <Link href="/signup" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
