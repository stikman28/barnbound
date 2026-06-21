"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/user-context";
import { apiGet, apiPost, apiDelete, priceLabel } from "@/lib/client";

type Listing = { id: string; type: string; title: string; price: number; city: string; emoji: string; breed: string | null; discipline: string | null; age: number | null; category: string | null; verified: boolean; featured: boolean; seller: string | null };
type Order = { id: string; title: string; offer: number; price?: number; message: string | null; status: string; createdAt: string };
type Inquiry = { id: string; title: string; message: string; createdAt: string };
type Dash = { listings: Listing[]; orders: Order[]; favorites: Listing[]; inquiries: Inquiry[] };

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return ""; }
}
function metaLine(l: Listing) {
  if (l.type === "HORSE") return [l.breed, l.discipline, l.age ? `${l.age}yr` : null, l.city].filter(Boolean).join(" · ");
  return `${l.category || l.type} · ${l.city}`;
}

const TABS = [
  { key: "listings", label: "My Listings" },
  { key: "offers", label: "My Offers" },
  { key: "saved", label: "Saved" },
  { key: "messages", label: "Messages" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [data, setData] = useState<Dash | null>(null);
  const [tab, setTab] = useState("listings");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await apiGet<Dash>("/api/dashboard");
      setData(d);
    } catch {
      router.replace("/signin?next=/dashboard");
    }
  }, [router]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/signin?next=/dashboard"); return; }
    load();
  }, [user, loading, load, router]);

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(""), 4000); }

  async function removeListing(id: string) {
    if (!confirm("Remove this listing? This cannot be undone.")) return;
    await apiDelete(`/api/listings/${id}`).catch((e) => showToast((e as Error).message));
    load();
  }
  async function unsave(id: string) {
    await apiPost("/api/favorites", { listingId: id }).catch(() => {});
    load();
  }

  if (!data) {
    return <section className="page-hero"><div className="container"><h1>My Dashboard</h1><p>Loading…</p></div></section>;
  }

  const counts: Record<string, number> = {
    listings: data.listings.length, offers: data.orders.length, saved: data.favorites.length, messages: data.inquiries.length,
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>My Dashboard</h1>
          <p>Welcome back, {user?.name.split(" ")[0]} — here&apos;s your marketplace activity.</p>
        </div>
      </section>

      <div className="container dash-wrap">
        <div className="dash-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.label} <span className="tab-count">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        {tab === "listings" && (
          <section>
            <div className="dash-section-head">
              <h2>Listings You&apos;re Selling</h2>
              <Link href="/marketplace" className="btn btn-primary btn-sm">+ List an Item</Link>
            </div>
            {data.listings.length === 0 ? (
              <Empty emoji="🏷️" title="You're not selling anything yet" body="List a horse, tack, trailer, or gear to reach verified local buyers." />
            ) : (
              <div className="card-grid">
                {data.listings.map((l) => (
                  <article className="card listing-card" key={l.id}>
                    <div className="card-image" aria-hidden="true">
                      <span style={{ fontSize: "5rem" }}>{l.emoji}</span>
                      {l.featured ? <span className="badge featured">Featured</span> : null}
                    </div>
                    <div className="card-body">
                      <h3>{l.title}</h3>
                      <div className="card-meta">{metaLine(l)}</div>
                      <div className="card-price">{priceLabel(l.price)}</div>
                      <div className="card-actions">
                        <span className="chip">{l.verified ? "✓ Verified Seller" : "Unverified"}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => removeListing(l.id)}>Remove</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "offers" && (
          <section>
            <h2>Offers &amp; Purchase Requests You&apos;ve Sent</h2>
            {data.orders.length === 0 ? (
              <Empty emoji="🤝" title="No offers sent yet" body="When you request to buy or make an offer on a listing, it shows up here." />
            ) : (
              <div className="dash-list">
                {data.orders.map((o) => (
                  <div className="dash-row" key={o.id}>
                    <div className="dash-row-main">
                      <strong>{o.title}</strong>
                      <div className="meta muted small">Offered {priceLabel(o.offer)} · {fmtDate(o.createdAt)}</div>
                      {o.message ? <div className="dash-row-note">“{o.message}”</div> : null}
                    </div>
                    <span className="status-pill">{o.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "saved" && (
          <section>
            <h2>Saved Listings</h2>
            {data.favorites.length === 0 ? (
              <Empty emoji="🤍" title="No saved listings yet" body="Tap the heart on any listing to keep an eye on it here." />
            ) : (
              <div className="card-grid">
                {data.favorites.map((l) => (
                  <article className="card listing-card" key={l.id}>
                    <div className="card-image" aria-hidden="true"><span style={{ fontSize: "5rem" }}>{l.emoji}</span></div>
                    <div className="card-body">
                      <h3>{l.title}</h3>
                      <div className="card-meta">{metaLine(l)}</div>
                      <div className="card-price">{priceLabel(l.price)}</div>
                      <div className="card-actions">
                        <span className="muted small">{l.seller || l.city}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => unsave(l.id)}>Remove</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "messages" && (
          <section>
            <h2>Messages to Sellers</h2>
            {data.inquiries.length === 0 ? (
              <Empty emoji="✉️" title="No messages yet" body="Use “Contact” on a listing to ask a seller a question — your messages collect here." />
            ) : (
              <div className="dash-list">
                {data.inquiries.map((m) => (
                  <div className="dash-row" key={m.id}>
                    <div className="dash-row-main">
                      <strong>Re: {m.title}</strong>
                      <div className="dash-row-note">“{m.message}”</div>
                      <div className="meta muted small">Sent {fmtDate(m.createdAt)}</div>
                    </div>
                    <span className="status-pill">Sent</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}

function Empty({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="empty-state" style={{ gridColumn: "1/-1" }}>
      <div className="emoji">{emoji}</div>
      <h3>{title}</h3>
      <p>{body}</p>
      <Link href="/marketplace" className="btn btn-primary btn-sm">Browse Marketplace</Link>
    </div>
  );
}
