"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { apiGet, apiPost, priceLabel } from "@/lib/client";

type Listing = {
  id: string;
  type: string;
  title: string;
  price: number;
  city: string;
  description: string;
  emoji: string;
  breed: string | null;
  discipline: string | null;
  age: number | null;
  category: string | null;
  verified: boolean;
  featured: boolean;
  sellerId: string;
  seller: string | null;
};

const TYPES = [
  { value: "HORSE", label: "Horses" },
  { value: "TACK", label: "Tack & Saddles" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "TRAILER", label: "Trailers" },
  { value: "CLOTHING", label: "Clothing & Boots" },
  { value: "OTHER", label: "Other" },
];
const DISCIPLINES = ["Western / Ranch", "Hunter/Jumper", "Dressage", "Trail", "Trail / Lesson"];
const ALL_TYPES = TYPES.map((t) => t.value);
const MAX = 40000;

function metaLine(l: Listing) {
  if (l.type === "HORSE") {
    return [l.breed, l.discipline, l.age ? `${l.age}yr` : null, l.city].filter(Boolean).join(" · ");
  }
  return `${l.category || l.type} · ${l.city}`;
}

export default function MarketplacePage() {
  const { user } = useUser();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");

  // filters
  const [types, setTypes] = useState<string[]>(ALL_TYPES);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(MAX);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState("featured");

  // sell modal
  const [sellOpen, setSellOpen] = useState(false);
  const [sellType, setSellType] = useState("HORSE");
  const [sellForm, setSellForm] = useState({ title: "", price: "", city: "", desc: "", breed: "", age: "", discipline: DISCIPLINES[0] });

  // deal modal
  const [deal, setDeal] = useState<{ listing: Listing; mode: "buy" | "contact" } | null>(null);
  const [offer, setOffer] = useState("");
  const [message, setMessage] = useState("");

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 4500);
  }, []);

  const loadListings = useCallback(async () => {
    const params = new URLSearchParams();
    if (types.length && types.length < ALL_TYPES.length) params.set("types", types.join(","));
    if (disciplines.length) params.set("discipline", disciplines[0]);
    if (maxPrice < MAX) params.set("maxPrice", String(maxPrice));
    if (verifiedOnly) params.set("verified", "1");
    params.set("sort", sort);
    const { listings } = await apiGet<{ listings: Listing[] }>(`/api/listings?${params}`);
    // discipline filter supports multi-select client-side when more than one chosen
    const filtered = disciplines.length > 1 ? listings.filter((l) => l.discipline && disciplines.includes(l.discipline)) : listings;
    setListings(filtered);
  }, [types, disciplines, maxPrice, verifiedOnly, sort]);

  useEffect(() => { loadListings(); }, [loadListings]);

  useEffect(() => {
    if (!user) { setFavoriteIds(new Set()); return; }
    apiGet<{ favoriteIds: string[] }>("/api/favorites")
      .then((d) => setFavoriteIds(new Set(d.favoriteIds)))
      .catch(() => {});
  }, [user]);

  function requireAuth(): boolean {
    if (user) return true;
    router.push("/signin?next=/marketplace");
    return false;
  }

  async function toggleFav(l: Listing) {
    if (!requireAuth()) return;
    try {
      const { favorite } = await apiPost<{ favorite: boolean }>("/api/favorites", { listingId: l.id });
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (favorite) next.add(l.id); else next.delete(l.id);
        return next;
      });
    } catch (e) { showToast((e as Error).message); }
  }

  function openSell() {
    if (!requireAuth()) return;
    setSellOpen(true);
  }

  async function submitSell() {
    const price = parseInt(sellForm.price, 10);
    if (!sellForm.title || !price || !sellForm.city) { showToast("Please fill in a title, price, and city."); return; }
    const payload: Record<string, unknown> = {
      type: sellType, title: sellForm.title, price, city: sellForm.city, description: sellForm.desc,
    };
    if (sellType === "HORSE") { payload.breed = sellForm.breed; payload.discipline = sellForm.discipline; if (sellForm.age) payload.age = parseInt(sellForm.age, 10); }
    try {
      await apiPost("/api/listings", payload);
      setSellOpen(false);
      setSellForm({ title: "", price: "", city: "", desc: "", breed: "", age: "", discipline: DISCIPLINES[0] });
      await loadListings();
      showToast("Your listing is live. Manage it any time from your dashboard.");
    } catch (e) { showToast((e as Error).message); }
  }

  function openDeal(listing: Listing, mode: "buy" | "contact") {
    if (!requireAuth()) return;
    setDeal({ listing, mode });
    setOffer(String(listing.price));
    setMessage("");
  }

  async function submitDeal() {
    if (!deal) return;
    try {
      if (deal.mode === "buy") {
        const o = parseInt(offer, 10) || deal.listing.price;
        await apiPost("/api/orders", { listingId: deal.listing.id, offer: o, message });
        showToast(`Offer of ${priceLabel(o)} sent to ${deal.listing.seller || "the seller"}. Track it in your dashboard.`);
      } else {
        if (!message.trim()) { showToast("Please write a short message to the seller."); return; }
        await apiPost("/api/inquiries", { listingId: deal.listing.id, message });
        showToast("Message sent. You can follow up from your dashboard.");
      }
      setDeal(null);
    } catch (e) { showToast((e as Error).message); }
  }

  function resetFilters() {
    setTypes(ALL_TYPES); setDisciplines([]); setMaxPrice(MAX); setVerifiedOnly(false); setSort("featured");
  }

  function toggleArr(arr: string[], v: string, on: boolean) {
    return on ? [...arr, v] : arr.filter((x) => x !== v);
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Marketplace</h1>
          <p>Horses, tack, trailers and equipment from identity-verified sellers in your area. Optional escrow on sales over $5,000.</p>
        </div>
      </section>

      <div className="container page-layout">
        <aside className="filters" aria-label="Filters">
          <h3>Listing Type</h3>
          <div className="filter-group">
            {TYPES.map((t) => (
              <label key={t.value}>
                <input type="checkbox" checked={types.includes(t.value)}
                  onChange={(e) => setTypes((a) => toggleArr(a, t.value, e.target.checked))} /> {t.label}
              </label>
            ))}
          </div>

          <h3>Discipline</h3>
          <div className="filter-group">
            {DISCIPLINES.map((d) => (
              <label key={d}>
                <input type="checkbox" checked={disciplines.includes(d)}
                  onChange={(e) => setDisciplines((a) => toggleArr(a, d, e.target.checked))} /> {d}
              </label>
            ))}
          </div>

          <h3>Max Price</h3>
          <div className="filter-group">
            <input type="range" min={500} max={MAX} step={500} value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))} />
            <div className="price-range-labels">
              <span>$500</span>
              <span>{maxPrice >= MAX ? "$40,000+" : `$${maxPrice.toLocaleString()}`}</span>
            </div>
          </div>

          <h3>Seller</h3>
          <div className="filter-group">
            <label><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /> Verified sellers only</label>
          </div>

          <button className="filter-reset" onClick={resetFilters}>Reset Filters</button>
        </aside>

        <main>
          <div className="results-bar">
            <div className="results-count"><strong>{listings.length}</strong> listings</div>
            <div className="results-actions">
              <button className="btn btn-primary" onClick={openSell}>+ List an Item to Sell</button>
              <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="card-grid">
            {listings.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                <div className="emoji">🔎</div>
                <h3>No listings match your filters</h3>
                <p>Try loosening your filters or resetting.</p>
              </div>
            ) : (
              listings.map((l) => {
                const fav = favoriteIds.has(l.id);
                const mine = user && l.sellerId === user.id;
                return (
                  <article className="card listing-card" key={l.id}>
                    <div className="card-image" aria-hidden="true">
                      <span style={{ fontSize: "5rem" }}>{l.emoji || "📦"}</span>
                      {l.featured ? <span className="badge featured">Featured</span> : null}
                      {mine ? <span className="badge mine">Your listing</span> : null}
                      <button className={`fav-btn ${fav ? "on" : ""}`} onClick={() => toggleFav(l)}
                        title={fav ? "Saved — click to remove" : "Save to your watchlist"} aria-label="Save listing">
                        {fav ? "♥" : "♡"}
                      </button>
                    </div>
                    <div className="card-body">
                      <h3>{l.title}</h3>
                      <div className="card-meta">{metaLine(l)}</div>
                      <p className="small muted" style={{ margin: "0 0 0.5rem" }}>{l.description}</p>
                      <div className="card-price">{priceLabel(l.price)}</div>
                      <div className="card-footer">
                        <span className="chip">{l.verified ? "✓ Verified Seller" : "Unverified"}</span>
                        {l.seller ? <span className="muted small">{l.seller}</span> : null}
                      </div>
                      <div className="card-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openDeal(l, "contact")}>Contact</button>
                        <button className="btn btn-primary btn-sm" onClick={() => openDeal(l, "buy")}>Buy / Offer</button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* Sell modal */}
      {sellOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSellOpen(false); }}>
          <div className="modal" role="dialog" aria-label="List an item">
            <h2>List an Item to Sell</h2>
            <p className="muted">Reach verified equine and farm buyers across Northern Colorado. Your listing appears instantly.</p>
            <label className="muted small">Listing Type</label>
            <select className="form-input" value={sellType} onChange={(e) => setSellType(e.target.value)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <label className="muted small">Title</label>
            <input className="form-input" placeholder="e.g. 10yr Quarter Horse Gelding — Trail Ready"
              value={sellForm.title} onChange={(e) => setSellForm({ ...sellForm, title: e.target.value })} />
            <div className="form-row">
              <div>
                <label className="muted small">Price ($)</label>
                <input className="form-input" type="number" min={1} placeholder="2500"
                  value={sellForm.price} onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })} />
              </div>
              <div>
                <label className="muted small">City</label>
                <input className="form-input" placeholder="Fort Collins, CO"
                  value={sellForm.city} onChange={(e) => setSellForm({ ...sellForm, city: e.target.value })} />
              </div>
            </div>
            {sellType === "HORSE" && (
              <>
                <div className="form-row">
                  <div>
                    <label className="muted small">Breed</label>
                    <input className="form-input" placeholder="Quarter Horse"
                      value={sellForm.breed} onChange={(e) => setSellForm({ ...sellForm, breed: e.target.value })} />
                  </div>
                  <div>
                    <label className="muted small">Age (yrs)</label>
                    <input className="form-input" type="number" min={0} max={40} placeholder="10"
                      value={sellForm.age} onChange={(e) => setSellForm({ ...sellForm, age: e.target.value })} />
                  </div>
                </div>
                <label className="muted small">Discipline</label>
                <select className="form-input" value={sellForm.discipline} onChange={(e) => setSellForm({ ...sellForm, discipline: e.target.value })}>
                  {DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </>
            )}
            <label className="muted small">Description</label>
            <textarea className="form-input" rows={2} placeholder="Condition, temperament, what's included…"
              value={sellForm.desc} onChange={(e) => setSellForm({ ...sellForm, desc: e.target.value })} />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setSellOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitSell}>Publish Listing</button>
            </div>
          </div>
        </div>
      )}

      {/* Deal modal */}
      {deal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setDeal(null); }}>
          <div className="modal" role="dialog" aria-label="Contact or offer">
            <h2>{deal.mode === "buy" ? "Request to Buy / Make an Offer" : "Contact Seller"}</h2>
            <div className="deal-summary">
              <strong>{deal.listing.title}</strong>
              <span className="muted small">{deal.listing.city} · {priceLabel(deal.listing.price)}</span>
            </div>
            {deal.mode === "buy" && (
              <div>
                <label className="muted small">Your Offer ($)</label>
                <input className="form-input" type="number" min={1} value={offer} onChange={(e) => setOffer(e.target.value)} />
              </div>
            )}
            <label className="muted small">Message to Seller</label>
            <textarea className="form-input" rows={3}
              placeholder={deal.mode === "buy" ? "Add a note for the seller (optional)…" : "Ask about availability, condition, location…"}
              value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitDeal}>{deal.mode === "buy" ? "Send Offer" : "Send Message"}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}
