"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { apiGet, apiPost, apiPatch, priceLabel } from "@/lib/client";

type WantedAd = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number | null;
  city: string | null;
  status: string;
  createdAt: string;
  buyerId: string;
  buyer: string;
  responseCount: number;
};

type WantedResponse = {
  id: string;
  message: string;
  createdAt: string;
  responderId: string;
  responder: string;
  responderVerified: boolean;
};

const CATEGORIES = ["Horses", "Tack & Saddles", "Trailers", "Barn & Farm Equipment", "Apparel & Boots", "Hay & Feed", "Services", "Other"];

export default function WantedPage() {
  const { user } = useUser();
  const router = useRouter();

  const [ads, setAds] = useState<WantedAd[]>([]);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");

  // post modal
  const [postOpen, setPostOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: CATEGORIES[0], budget: "", city: "", desc: "" });

  // my-ad responses drawer
  const [openAd, setOpenAd] = useState<string | null>(null);
  const [responses, setResponses] = useState<WantedResponse[]>([]);

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 4500);
  }, []);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q.trim()) params.set("q", q.trim());
    const { ads } = await apiGet<{ ads: WantedAd[] }>(`/api/wanted?${params}`);
    setAds(ads);
  }, [category, q]);

  useEffect(() => { load(); }, [load]);

  function requireAuth(): boolean {
    if (user) return true;
    router.push("/signin?next=/wanted");
    return false;
  }

  async function submitPost() {
    if (!form.title) { showToast("Give your wanted ad a title."); return; }
    try {
      await apiPost("/api/wanted", {
        title: form.title,
        category: form.category,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        city: form.city || undefined,
        description: form.desc,
      });
      setPostOpen(false);
      setForm({ title: "", category: CATEGORIES[0], budget: "", city: "", desc: "" });
      await load();
      showToast("Your wanted ad is live — sellers can now respond.");
    } catch (e) { showToast((e as Error).message); }
  }

  async function respond(ad: WantedAd) {
    if (!requireAuth()) return;
    const message = window.prompt(`Respond to "${ad.title}" — what do you have for ${ad.buyer}?`);
    if (!message) return;
    try {
      await apiPost(`/api/wanted/${ad.id}/responses`, { message });
      await load();
      showToast("Response sent — the buyer will see it on their ad.");
    } catch (e) { showToast((e as Error).message); }
  }

  async function report(ad: WantedAd) {
    if (!requireAuth()) return;
    const reason = window.prompt(`Report "${ad.title}" — what's wrong?`);
    if (!reason) return;
    try {
      await apiPost("/api/reports", { targetType: "WANTED", targetId: ad.id, reason });
      showToast("Thanks — our team will review this ad.");
    } catch (e) { showToast((e as Error).message); }
  }

  async function viewResponses(ad: WantedAd) {
    try {
      const { ad: full } = await apiGet<{ ad: WantedAd & { responses: WantedResponse[] } }>(`/api/wanted/${ad.id}`);
      setResponses(full.responses);
      setOpenAd(ad.id);
    } catch (e) { showToast((e as Error).message); }
  }

  async function closeAd(ad: WantedAd, status: "FULFILLED" | "CLOSED") {
    try {
      await apiPatch(`/api/wanted/${ad.id}`, { status });
      setOpenAd(null);
      await load();
      showToast(status === "FULFILLED" ? "Marked found — congrats! 🎉" : "Wanted ad closed.");
    } catch (e) { showToast((e as Error).message); }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Wanted Ads</h1>
          <p>Looking for something specific? Post it and let sellers come to you — horses, tack, equipment, hay, or a service you need.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 1rem 3rem" }}>
        <div className="results-bar">
          <div className="results-count"><strong>{ads.length}</strong> open wanted ads</div>
          <div className="results-actions">
            <input className="form-input" style={{ maxWidth: 220 }} placeholder="Search wanted ads…"
              value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="sort-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => { if (requireAuth()) setPostOpen(true); }}>+ Post a Wanted Ad</button>
          </div>
        </div>

        <div className="card-grid" style={{ marginTop: "1rem" }}>
          {ads.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1/-1" }}>
              <div className="emoji">🔍</div>
              <h3>No open wanted ads</h3>
              <p>Be the first — post what you&apos;re looking for.</p>
            </div>
          ) : (
            ads.map((ad) => {
              const mine = user && ad.buyerId === user.id;
              return (
                <article className="card" key={ad.id} style={{ padding: "1.25rem 1.5rem" }}>
                  <h3 style={{ margin: "0 0 0.25rem" }}>{ad.title}</h3>
                  <div className="card-meta">
                    {ad.category}{ad.city ? ` · ${ad.city}` : ""}
                    {ad.budget != null ? ` · up to ${priceLabel(ad.budget)}` : ""}
                  </div>
                  {ad.description ? <p className="small muted" style={{ margin: "0.5rem 0" }}>{ad.description}</p> : null}
                  <div className="card-footer" style={{ marginTop: "0.5rem" }}>
                    <Link href={`/seller/${ad.buyerId}`} className="muted small" title="View member profile">{ad.buyer}</Link>
                    <span className="chip">{ad.responseCount} {ad.responseCount === 1 ? "response" : "responses"}</span>
                  </div>
                  <div className="card-actions" style={{ marginTop: "0.75rem" }}>
                    {mine ? (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => viewResponses(ad)}>View Responses</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => closeAd(ad, "FULFILLED")}>Found It</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => respond(ad)}>I Have This</button>
                        <button className="btn btn-ghost btn-sm" title="Report this ad" onClick={() => report(ad)}>⚑</button>
                      </>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Post modal */}
      {postOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setPostOpen(false); }}>
          <div className="modal" role="dialog" aria-label="Post a wanted ad">
            <h2>Post a Wanted Ad</h2>
            <p className="muted">Describe what you&apos;re after and sellers with a match will respond directly.</p>
            <label className="muted small">What are you looking for?</label>
            <input className="form-input" placeholder="e.g. Kid-safe pony under 13hh"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="form-row">
              <div>
                <label className="muted small">Category</label>
                <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="muted small">Budget up to ($, optional)</label>
                <input className="form-input" type="number" min={1} placeholder="5000"
                  value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
              </div>
            </div>
            <label className="muted small">Your area (optional)</label>
            <input className="form-input" placeholder="Fort Collins, CO"
              value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <label className="muted small">Details</label>
            <textarea className="form-input" rows={3} placeholder="Size, temperament, condition, timeline…"
              value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setPostOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitPost}>Post Wanted Ad</button>
            </div>
          </div>
        </div>
      )}

      {/* Responses modal (ad owner) */}
      {openAd && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setOpenAd(null); }}>
          <div className="modal" role="dialog" aria-label="Responses to your wanted ad">
            <h2>Responses</h2>
            {responses.length === 0 ? (
              <p className="muted">No responses yet — sellers will show up here.</p>
            ) : (
              responses.map((r) => (
                <div key={r.id} className="deal-summary" style={{ marginBottom: "0.5rem" }}>
                  <strong>
                    <Link href={`/seller/${r.responderId}`}>{r.responder}</Link>{" "}
                    {r.responderVerified ? <span className="chip">✓ verified</span> : null}
                  </strong>
                  <span className="small">{r.message}</span>
                  <span className="muted small">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setOpenAd(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}
