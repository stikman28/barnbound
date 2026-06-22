"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/user-context";
import { apiGet, apiPost, apiPatch } from "@/lib/client";

type Business = {
  id: number; name: string; url: string | null; category: string; city: string;
  image: string | null; emoji: string | null; rating: number; reviews: number;
  tags: string[]; verified: boolean; featured: boolean; description: string;
  plan: string; claimed: boolean;
};

const CATEGORIES = ["Retail", "Feed & Tack", "Veterinary", "Farrier", "Boarding", "Training", "Hauler", "Photographer", "Service", "Other"];
const PLANS = [
  { value: "FREE", label: "Free", note: "Basic listing" },
  { value: "STARTER", label: "Starter · $29/mo", note: "Verified profile, reviews, 5 photos" },
  { value: "PRO", label: "Pro · $99/mo", note: "Featured placement + analytics" },
  { value: "PREMIER", label: "Premier · $299/mo", note: "Top placement + ad credit" },
];

export default function BusinessProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useUser();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "", category: "Retail", city: "", description: "", url: "", emoji: "", tags: "" });

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 4000); };

  const load = useCallback(() => {
    if (!id) return;
    apiGet<{ business: Business; isOwner: boolean }>(`/api/businesses/${id}`)
      .then((d) => { setBusiness(d.business); setIsOwner(d.isOwner); })
      .catch(() => setMissing(true));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  function startEdit() {
    if (!business) return;
    setForm({
      name: business.name, category: business.category, city: business.city,
      description: business.description, url: business.url ?? "", emoji: business.emoji ?? "",
      tags: business.tags.join(", "),
    });
    setEditing(true);
  }

  async function saveEdit() {
    try {
      const payload = { ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) };
      const { business: updated } = await apiPatch<{ business: Business }>(`/api/businesses/${id}`, payload);
      setBusiness(updated); setEditing(false); showToast("Profile updated.");
    } catch (e) { showToast((e as Error).message); }
  }

  async function claim() {
    if (!user) { router.push(`/signin?next=/business/${id}`); return; }
    try { await apiPost(`/api/businesses/${id}/claim`); load(); showToast("You now manage this business."); }
    catch (e) { showToast((e as Error).message); }
  }

  async function setPlan(plan: string) {
    try {
      const { business: updated } = await apiPost<{ business: Business }>(`/api/businesses/${id}/plan`, { plan });
      setBusiness(updated);
      showToast(plan === "FREE" ? "Set to Free plan." : `Upgraded to ${plan} — billing is set up in a later phase.`);
    } catch (e) { showToast((e as Error).message); }
  }

  if (missing) return <section className="page-hero"><div className="container"><h1>Business not found</h1><p><Link href="/directory">← Back to Directory</Link></p></div></section>;
  if (!business) return <section className="page-hero"><div className="container"><h1>Loading…</h1></div></section>;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="small"><Link href="/directory">← Directory</Link></p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "3rem" }}>{business.emoji || "🏢"}</span>
            <div>
              <h1 style={{ marginBottom: "0.25rem" }}>{business.name}</h1>
              <p style={{ margin: 0 }}>
                {business.category} · {business.city} · ★ {business.rating} ({business.reviews})
                {business.verified ? "  ·  ✓ Verified" : ""}{business.featured ? "  ·  ⭐ Featured" : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 0 4rem", maxWidth: 820 }}>
        <p style={{ fontSize: "1.05rem" }}>{business.description}</p>
        {business.tags.length > 0 && <div className="card-tags" style={{ margin: "0 0 1rem" }}>{business.tags.map((t) => <span className="chip" key={t}>{t}</span>)}</div>}
        {business.url && <p><a className="btn btn-outline" href={business.url} target="_blank" rel="noopener">Visit website ↗</a></p>}

        {/* Claim prompt */}
        {!business.claimed && !isOwner && (
          <div className="deal-summary" style={{ marginTop: "1.5rem" }}>
            <strong>Is this your business?</strong>
            <span className="muted small">Claim it to manage the profile, choose a plan, and get featured.</span>
            <div style={{ marginTop: "0.5rem" }}><button className="btn btn-primary btn-sm" onClick={claim}>Claim this business</button></div>
          </div>
        )}

        {/* Owner management */}
        {isOwner && (
          <div style={{ marginTop: "2rem", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem", background: "#fff" }}>
            <div className="dash-section-head"><h2 style={{ margin: 0 }}>Manage your business</h2>
              {!editing && <button className="btn btn-ghost btn-sm" onClick={startEdit}>Edit profile</button>}
            </div>

            {editing ? (
              <>
                <label className="muted small">Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="form-row">
                  <div><label className="muted small">Category</label>
                    <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
                  </div>
                  <div><label className="muted small">City</label><input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                </div>
                <label className="muted small">Description</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div className="form-row">
                  <div><label className="muted small">Website</label><input className="form-input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></div>
                  <div><label className="muted small">Emoji</label><input className="form-input" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🏢" /></div>
                </div>
                <label className="muted small">Tags (comma-separated)</label>
                <input className="form-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Western Tack, Saddles, Consignment" />
                <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button><button className="btn btn-primary" onClick={saveEdit}>Save</button></div>
              </>
            ) : (
              <>
                <p className="muted small" style={{ marginTop: 0 }}>Current plan: <strong>{business.plan}</strong>{business.featured ? " · ⭐ Featured placement active" : ""}</p>
                <div style={{ display: "grid", gap: "0.6rem" }}>
                  {PLANS.map((p) => (
                    <div key={p.value} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.6rem 0.8rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: business.plan === p.value ? "var(--cream-100)" : "#fff" }}>
                      <div><strong>{p.label}</strong><div className="muted small">{p.note}</div></div>
                      {business.plan === p.value ? <span className="status-pill">Current</span> : <button className="btn btn-ghost btn-sm" onClick={() => setPlan(p.value)}>Choose</button>}
                    </div>
                  ))}
                </div>
                <p className="muted small" style={{ marginTop: "0.75rem" }}>Pro &amp; Premier unlock ⭐ featured placement. Billing (PayPal) arrives in a later phase — selecting a plan is free for now.</p>
              </>
            )}
          </div>
        )}
      </div>

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}
