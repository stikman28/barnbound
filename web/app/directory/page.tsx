"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/client";

type Business = {
  id: number; name: string; url: string | null; category: string; city: string;
  image: string | null; emoji: string | null; rating: number; reviews: number;
  tags: string[]; verified: boolean; featured: boolean; description: string;
};

export default function DirectoryPage() {
  const [all, setAll] = useState<Business[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    apiGet<{ businesses: Business[] }>("/api/businesses").then((d) => setAll(d.businesses)).catch(() => {});
    // Seed search/location from the home hero (?q=, ?loc=)
    const p = new URLSearchParams(window.location.search);
    if (p.get("q")) setQ(p.get("q") as string);
    if (p.get("loc")) setCity("All"); // location handled via free-text q below
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(all.map((b) => b.category))).sort()], [all]);
  const cities = useMemo(() => ["All", ...Array.from(new Set(all.map((b) => b.city))).sort()], [all]);

  const filtered = all.filter((b) => {
    if (category !== "All" && b.category !== category) return false;
    if (city !== "All" && b.city !== city) return false;
    if (b.rating < minRating) return false;
    if (q.trim()) {
      const hay = `${b.name} ${b.category} ${b.city} ${b.tags.join(" ")} ${b.description}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Business Directory</h1>
          <p>Verified equine and farm businesses across Northern Colorado — tack shops, trainers, vets, farriers, feed stores, and boarding facilities.</p>
        </div>
      </section>

      <div className="container page-layout">
        <aside className="filters" aria-label="Filters">
          <h3>Search</h3>
          <div className="filter-group">
            <input className="form-input" placeholder="Name, service, tag…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <h3>Category</h3>
          <div className="filter-group">
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <h3>City</h3>
          <div className="filter-group">
            <select className="form-input" value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <h3>Minimum Rating</h3>
          <div className="filter-group">
            <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMinRating(parseFloat(e.target.value))} />
            <div className="price-range-labels"><span>Any</span><span>{minRating ? `${minRating}★+` : "Any"}</span></div>
          </div>
          <button className="filter-reset" onClick={() => { setQ(""); setCategory("All"); setCity("All"); setMinRating(0); }}>Reset Filters</button>
        </aside>

        <main>
          <div className="results-bar">
            <div className="results-count"><strong>{filtered.length}</strong> businesses</div>
            <Link href="/business/new" className="btn btn-primary btn-sm">+ List Your Business</Link>
          </div>
          <div className="card-grid">
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                <div className="emoji">🔎</div>
                <h3>No businesses match your filters</h3>
                <p>Try a different category or reset.</p>
              </div>
            ) : (
              filtered.map((b) => (
                <Link href={`/business/${b.id}`} className="card card-link" key={b.id}>
                  <div className="card-image">
                    {b.image
                      /* eslint-disable-next-line @next/next/no-img-element */
                      ? <img src={b.image} alt={b.name} loading="lazy" />
                      : <span style={{ fontSize: "5rem" }}>{b.emoji}</span>}
                    {b.featured ? <span className="badge featured">Featured</span> : b.verified ? <span className="badge verified">Verified</span> : null}
                  </div>
                  <div className="card-body">
                    <h3>{b.name}</h3>
                    <div className="card-meta">{b.category} · {b.city}</div>
                    <div className="rating">★ {b.rating} <span className="count">({b.reviews})</span></div>
                    <p className="small muted" style={{ margin: "0.4rem 0 0.6rem" }}>{b.description}</p>
                    <div className="card-tags">{b.tags.slice(0, 4).map((t) => <span className="chip" key={t}>{t}</span>)}</div>
                    <div className="card-footer">
                      <span className="link-arrow small">View profile →</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
}
