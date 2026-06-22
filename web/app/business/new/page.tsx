"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { apiPost } from "@/lib/client";

const CATEGORIES = ["Retail", "Feed & Tack", "Veterinary", "Farrier", "Boarding", "Training", "Hauler", "Photographer", "Service", "Other"];

export default function NewBusinessPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [form, setForm] = useState({ name: "", category: "Feed & Tack", city: "", description: "", url: "", emoji: "🏢", tags: "" });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/signin?next=/business/new");
  }, [loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!form.name || !form.city || !form.description) { setErr("Please fill in name, city, and description."); return; }
    try {
      const payload = { ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) };
      const { business } = await apiPost<{ business: { id: number } }>("/api/businesses", payload);
      router.push(`/business/${business.id}`);
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>List Your Business</h1>
          <p>Reach the Northern Colorado horse community. Free to list — upgrade any time for featured placement.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 0 4rem", maxWidth: 680 }}>
        <form onSubmit={submit}>
          <label className="muted small">Business Name</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Front Range Farrier Co." />
          <div className="form-row">
            <div><label className="muted small">Category</label>
              <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
            <div><label className="muted small">City</label><input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Fort Collins, CO" /></div>
          </div>
          <label className="muted small">Description</label>
          <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What you offer, who you serve…" />
          <div className="form-row">
            <div><label className="muted small">Website (optional)</label><input className="form-input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></div>
            <div><label className="muted small">Emoji</label><input className="form-input" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🏢" /></div>
          </div>
          <label className="muted small">Tags (comma-separated)</label>
          <input className="form-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Horseshoes, Hoof Care, Forge" />
          {err && <div className="form-error" style={{ marginTop: "0.75rem" }}>{err}</div>}
          <div style={{ marginTop: "1rem" }}><button className="btn btn-primary" type="submit">Publish Business</button></div>
        </form>
      </div>
    </>
  );
}
