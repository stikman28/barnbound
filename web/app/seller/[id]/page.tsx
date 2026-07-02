"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { apiGet, apiPost, priceLabel } from "@/lib/client";

type Listing = {
  id: string; type: string; title: string; price: number; city: string;
  description: string; emoji: string; breed: string | null; discipline: string | null;
  age: number | null; category: string | null; verified: boolean; featured: boolean;
};

type Product = {
  id: string; name: string; description: string; price: number; shipping: number;
  emoji: string; category: string; brand: string | null; inventory: number; pick: boolean;
};

type Seller = {
  id: string;
  name: string;
  location: string | null;
  role: string;
  memberSince: string;
  verified: boolean;
  salesCompleted: number;
  listings: Listing[];
  products: Product[];
};

const ROLE_LABEL: Record<string, string> = {
  RIDER: "Rider / Owner",
  TRAINER: "Trainer / Instructor",
  BARN_OWNER: "Barn / Facility Owner",
  MERCHANT: "Merchant / Seller",
  ADMIN: "BarnBound Team",
};

function metaLine(l: Listing) {
  if (l.type === "HORSE") {
    return [l.breed, l.discipline, l.age ? `${l.age}yr` : null, l.city].filter(Boolean).join(" · ");
  }
  return `${l.category || l.type} · ${l.city}`;
}

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const router = useRouter();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [missing, setMissing] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 4500);
  }, []);

  useEffect(() => {
    apiGet<{ seller: Seller }>(`/api/sellers/${id}`)
      .then((d) => setSeller(d.seller))
      .catch(() => setMissing(true));
  }, [id]);

  async function report() {
    if (!user) { router.push(`/signin?next=/seller/${id}`); return; }
    const reason = window.prompt("Report this member — what's wrong? (scam, impersonation, harassment…)");
    if (!reason) return;
    try {
      await apiPost("/api/reports", { targetType: "USER", targetId: id, reason });
      showToast("Thanks — our team will review this member.");
    } catch (e) { showToast((e as Error).message); }
  }

  if (missing) {
    return (
      <section className="page-hero"><div className="container">
        <h1>Member not found</h1>
        <p><Link href="/marketplace">← Back to Marketplace</Link></p>
      </div></section>
    );
  }
  if (!seller) return <section className="page-hero"><div className="container"><h1>Loading…</h1></div></section>;

  const initial = (seller.name[0] || "U").toUpperCase();
  const isMe = user?.id === seller.id;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <span className="user-avatar big" style={{ width: 64, height: 64, fontSize: "1.75rem" }}>{initial}</span>
            <div>
              <h1 style={{ marginBottom: "0.25rem" }}>{seller.name}</h1>
              <p style={{ margin: 0 }}>
                {ROLE_LABEL[seller.role] ?? seller.role}
                {seller.location ? ` · ${seller.location}` : ""}
                {" · "}Member since {new Date(seller.memberSince).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
              <p style={{ margin: "0.4rem 0 0", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span className="chip">{seller.verified ? "✓ Verified member" : "Unverified"}</span>
                {seller.salesCompleted > 0 ? <span className="chip">🤝 {seller.salesCompleted} completed {seller.salesCompleted === 1 ? "sale" : "sales"}</span> : null}
                {!isMe ? <button className="btn btn-ghost btn-sm" onClick={report}>⚑ Report</button> : null}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 1rem 3rem" }}>
        <h2 style={{ margin: "0 0 0.75rem" }}>Marketplace Listings ({seller.listings.length})</h2>
        {seller.listings.length === 0 ? (
          <p className="muted">No active listings right now.</p>
        ) : (
          <div className="card-grid">
            {seller.listings.map((l) => (
              <article className="card listing-card" key={l.id}>
                <div className="card-image" aria-hidden="true">
                  <span style={{ fontSize: "5rem" }}>{l.emoji || "📦"}</span>
                  {l.featured ? <span className="badge featured">Featured</span> : null}
                </div>
                <div className="card-body">
                  <h3>{l.title}</h3>
                  <div className="card-meta">{metaLine(l)}</div>
                  <p className="small muted" style={{ margin: "0 0 0.5rem" }}>{l.description}</p>
                  <div className="card-price">{priceLabel(l.price)}</div>
                  <div className="card-actions">
                    <Link href="/marketplace" className="btn btn-primary btn-sm">View in Marketplace</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {seller.products.length > 0 && (
          <>
            <h2 style={{ margin: "2rem 0 0.75rem" }}>Shop Products ({seller.products.length})</h2>
            <div className="card-grid">
              {seller.products.map((p) => (
                <article className="card listing-card" key={p.id}>
                  <div className="card-image" aria-hidden="true">
                    <span style={{ fontSize: "5rem" }}>{p.emoji || "🛍️"}</span>
                    {p.pick ? <span className="badge featured">⭐ BarnBound Pick</span> : null}
                  </div>
                  <div className="card-body">
                    <h3>{p.name}</h3>
                    <div className="card-meta">{[p.brand, p.category].filter(Boolean).join(" · ")}</div>
                    <div className="card-price">{priceLabel(p.price)}</div>
                    <div className="card-actions">
                      <Link href="/shop" className="btn btn-primary btn-sm">View in Shop</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}
