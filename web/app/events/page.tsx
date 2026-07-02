"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { apiGet, apiPost } from "@/lib/client";

type EventItem = {
  id: string;
  title: string;
  startsAt: string;
  location: string | null;
  details: string | null;
  category: string;
  rsvps: number;
  isRsvped: boolean;
};

const CATEGORIES = ["Show", "Rodeo", "Clinic", "Education", "Community"];
const CATEGORY_ICON: Record<string, string> = {
  Show: "🏆", Rodeo: "🤠", Clinic: "🎓", Education: "📚", Community: "🐴",
};
const CATEGORY_CHIP: Record<string, string> = {
  Show: "Shows", Rodeo: "Rodeos", Clinic: "Clinics", Education: "Education", Community: "Community",
};

function monthKey(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function EventsPage() {
  const { user } = useUser();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");

  const [postOpen, setPostOpen] = useState(false);
  const [form, setForm] = useState({ title: "", startsAt: "", location: "", details: "", category: CATEGORIES[0] });

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 4500);
  }, []);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ upcoming: "1" });
    if (category) params.set("category", category);
    if (q.trim()) params.set("q", q.trim());
    const { events } = await apiGet<{ events: EventItem[] }>(`/api/community/events?${params}`);
    setEvents(events);
  }, [category, q]);

  useEffect(() => { load(); }, [load, user]);

  function requireAuth(): boolean {
    if (user) return true;
    router.push("/signin?next=/events");
    return false;
  }

  async function toggleRsvp(ev: EventItem) {
    if (!requireAuth()) return;
    try {
      const { isRsvped, rsvps } = await apiPost<{ isRsvped: boolean; rsvps: number }>(`/api/community/events/${ev.id}/rsvp`);
      setEvents((es) => es.map((x) => (x.id === ev.id ? { ...x, isRsvped, rsvps } : x)));
    } catch (e) { showToast((e as Error).message); }
  }

  async function submitEvent() {
    if (!form.title || !form.startsAt) { showToast("Add a title and date."); return; }
    try {
      await apiPost("/api/community/events", form);
      setPostOpen(false);
      setForm({ title: "", startsAt: "", location: "", details: "", category: CATEGORIES[0] });
      await load();
      showToast("Event posted — see you there!");
    } catch (e) { showToast((e as Error).message); }
  }

  // Group by month for a calendar feel.
  const byMonth = new Map<string, EventItem[]>();
  for (const e of events) {
    const k = monthKey(new Date(e.startsAt));
    byMonth.set(k, [...(byMonth.get(k) ?? []), e]);
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Events</h1>
          <p>Horse shows, rodeos, clinics, and get-togethers across Northern Colorado. RSVP so organizers know you&apos;re coming.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 1rem 3rem", maxWidth: 900 }}>
        <div className="results-bar">
          <div className="results-actions" style={{ flexWrap: "wrap" }}>
            <button className={`btn btn-sm ${category === "" ? "btn-primary" : "btn-ghost"}`} onClick={() => setCategory("")}>All</button>
            {CATEGORIES.map((c) => (
              <button key={c} className={`btn btn-sm ${category === c ? "btn-primary" : "btn-ghost"}`} onClick={() => setCategory(c)}>
                {CATEGORY_ICON[c]} {CATEGORY_CHIP[c]}
              </button>
            ))}
          </div>
          <div className="results-actions">
            <input className="form-input" style={{ maxWidth: 200 }} placeholder="Search events…"
              value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn-primary" onClick={() => { if (requireAuth()) setPostOpen(true); }}>+ Post Event</button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="empty-state" style={{ marginTop: "1rem" }}>
            <div className="emoji">📅</div>
            <h3>No upcoming events match</h3>
            <p>Try another category — or post the first one.</p>
          </div>
        ) : (
          [...byMonth.entries()].map(([month, list]) => (
            <div key={month}>
              <h2 style={{ margin: "1.5rem 0 0.75rem" }}>{month}</h2>
              {list.map((e) => {
                const d = new Date(e.startsAt);
                return (
                  <article className="card" key={e.id} style={{ display: "flex", gap: "1rem", padding: "1rem", marginBottom: "0.75rem", alignItems: "center" }}>
                    <div style={{ textAlign: "center", minWidth: 56 }} aria-hidden="true">
                      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{d.getDate()}</div>
                      <div className="muted small">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0 }}>{CATEGORY_ICON[e.category] ?? "📅"} {e.title}</h3>
                      <div className="muted small">
                        {e.category}{e.location ? ` · ${e.location}` : ""}{e.details ? ` · ${e.details}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="chip">{e.rsvps} going</span>
                      <button className={`btn btn-sm ${e.isRsvped ? "btn-ghost" : "btn-primary"}`} onClick={() => toggleRsvp(e)}>
                        {e.isRsvped ? "✓ Going — cancel" : "RSVP"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Post event modal */}
      {postOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setPostOpen(false); }}>
          <div className="modal" role="dialog" aria-label="Post an event">
            <h2>Post an Event</h2>
            <label className="muted small">Title</label>
            <input className="form-input" placeholder="e.g. Spring Barrel Racing Jackpot"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="form-row">
              <div>
                <label className="muted small">Date</label>
                <input className="form-input" type="date" value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div>
                <label className="muted small">Category</label>
                <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <label className="muted small">Location</label>
            <input className="form-input" placeholder="Larimer County Fairgrounds"
              value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <label className="muted small">Details</label>
            <textarea className="form-input" rows={2} placeholder="Entry fees, times, who it's for…"
              value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setPostOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitEvent}>Post Event</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}
