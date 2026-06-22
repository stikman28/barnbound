"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { apiGet, apiPost } from "@/lib/client";

type Group = { id: string; name: string; description: string; icon: string; members: number; isMember: boolean };
type Thread = { id: string; title: string; category: string; icon: string; body: string; author: string; replies: number; createdAt: string };
type EventItem = { id: string; title: string; startsAt: string; location: string | null; details: string | null; category: string; rsvps: number; isRsvped: boolean };

const TABS = [
  { key: "events", label: "Events" },
  { key: "discussions", label: "Discussions" },
  { key: "groups", label: "Groups" },
  { key: "mine", label: "My Community" },
];

function monthDay(iso: string) {
  const d = new Date(iso);
  return { month: d.toLocaleString(undefined, { month: "short" }), day: d.getDate() };
}
function eventMeta(e: EventItem) {
  const d = new Date(e.startsAt);
  const wd = d.toLocaleString(undefined, { weekday: "short" });
  return [wd, e.location, e.details].filter(Boolean).join(" · ");
}

export default function CommunityPage() {
  const { user } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState("events");
  const [groups, setGroups] = useState<Group[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [modal, setModal] = useState<null | "event" | "thread" | "group">(null);
  const [toast, setToast] = useState("");

  // form state
  const [evForm, setEvForm] = useState({ title: "", startsAt: "", location: "", details: "", category: "Clinic" });
  const [thForm, setThForm] = useState({ title: "", category: "Horse Care", body: "", icon: "💬" });
  const [grForm, setGrForm] = useState({ name: "", description: "", icon: "👥" });

  const showToast = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(""), 4000); }, []);

  const loadGroups = useCallback(() => apiGet<{ groups: Group[] }>("/api/community/groups").then((d) => setGroups(d.groups)).catch(() => {}), []);
  const loadThreads = useCallback(() => apiGet<{ threads: Thread[] }>("/api/community/threads").then((d) => setThreads(d.threads)).catch(() => {}), []);
  const loadEvents = useCallback(() => apiGet<{ events: EventItem[] }>("/api/community/events").then((d) => setEvents(d.events)).catch(() => {}), []);

  useEffect(() => { loadGroups(); loadThreads(); loadEvents(); }, [loadGroups, loadThreads, loadEvents, user]);

  function requireAuth(): boolean {
    if (user) return true;
    router.push("/signin?next=/community");
    return false;
  }
  function openModal(m: "event" | "thread" | "group") { if (requireAuth()) setModal(m); }

  async function toggleJoin(g: Group) {
    if (!requireAuth()) return;
    try {
      const { isMember, members } = await apiPost<{ isMember: boolean; members: number }>(`/api/community/groups/${g.id}/membership`);
      setGroups((gs) => gs.map((x) => (x.id === g.id ? { ...x, isMember, members } : x)));
    } catch (e) { showToast((e as Error).message); }
  }
  async function toggleRsvp(ev: EventItem) {
    if (!requireAuth()) return;
    try {
      const { isRsvped, rsvps } = await apiPost<{ isRsvped: boolean; rsvps: number }>(`/api/community/events/${ev.id}/rsvp`);
      setEvents((es) => es.map((x) => (x.id === ev.id ? { ...x, isRsvped, rsvps } : x)));
    } catch (e) { showToast((e as Error).message); }
  }

  async function submitEvent() {
    if (!evForm.title || !evForm.startsAt) { showToast("Please add a title and date."); return; }
    try {
      await apiPost("/api/community/events", evForm);
      setModal(null); setEvForm({ title: "", startsAt: "", location: "", details: "", category: "Clinic" });
      await loadEvents(); showToast("Event posted.");
    } catch (e) { showToast((e as Error).message); }
  }
  async function submitThread() {
    if (!thForm.title) { showToast("Please add a title."); return; }
    try {
      await apiPost("/api/community/threads", thForm);
      setModal(null); setThForm({ title: "", category: "Horse Care", body: "", icon: "💬" });
      await loadThreads(); showToast("Discussion started.");
    } catch (e) { showToast((e as Error).message); }
  }
  async function submitGroup() {
    if (!grForm.name || !grForm.description) { showToast("Please add a name and description."); return; }
    try {
      await apiPost("/api/community/groups", grForm);
      setModal(null); setGrForm({ name: "", description: "", icon: "👥" });
      await loadGroups(); showToast("Group created — you're the first member.");
    } catch (e) { showToast((e as Error).message); }
  }

  const myGroups = groups.filter((g) => g.isMember);
  const myEvents = events.filter((e) => e.isRsvped);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Community</h1>
          <p>Local events, discipline groups, and a Q&amp;A forum for Northern Colorado horse people.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 0 4rem" }}>
        <div className="dash-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {/* Events */}
        {tab === "events" && (
          <section>
            <div className="dash-section-head"><h2>Upcoming Events</h2><button className="btn btn-primary btn-sm" onClick={() => openModal("event")}>+ Post Event</button></div>
            <div className="event-list">
              {events.map((e) => {
                const md = monthDay(e.startsAt);
                return (
                  <div className="event-item" key={e.id}>
                    <div className="date-box"><div className="month">{md.month}</div><div className="day">{md.day}</div></div>
                    <div className="event-info"><h4>{e.title}</h4><div className="meta">{eventMeta(e)}</div></div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span className="stat-pill">{e.category}</span>
                      <button className={`join-btn ${e.isRsvped ? "joined" : ""}`} onClick={() => toggleRsvp(e)}>
                        {e.isRsvped ? `Going (${e.rsvps})` : `RSVP${e.rsvps ? ` (${e.rsvps})` : ""}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Discussions */}
        {tab === "discussions" && (
          <section>
            <div className="dash-section-head"><h2>Q&amp;A Discussions</h2><button className="btn btn-primary btn-sm" onClick={() => openModal("thread")}>+ Start a Thread</button></div>
            <div className="forum-list">
              {threads.map((t) => (
                <Link className="forum-item" key={t.id} href={`/community/thread/${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="forum-icon">{t.icon}</div>
                  <div className="forum-info"><h4>{t.title}</h4><div className="meta">Posted in {t.category} · {t.replies} {t.replies === 1 ? "reply" : "replies"} · {t.author}</div></div>
                  <span className="link-arrow small">Open →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Groups */}
        {tab === "groups" && (
          <section>
            <div className="dash-section-head"><h2>Groups</h2><button className="btn btn-primary btn-sm" onClick={() => openModal("group")}>+ Create Group</button></div>
            <div className="group-list">
              {groups.map((g) => (
                <div className="group-item" key={g.id}>
                  <div className="group-icon">{g.icon}</div>
                  <div className="group-info"><h4>{g.name}</h4><div className="meta">{g.members} {g.members === 1 ? "member" : "members"} · {g.description}</div></div>
                  <button className={`join-btn ${g.isMember ? "joined" : ""}`} onClick={() => toggleJoin(g)}>{g.isMember ? "Joined" : "Join"}</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My Community */}
        {tab === "mine" && (
          <section>
            {myGroups.length + myEvents.length === 0 ? (
              <div className="empty-state">
                <div className="emoji">⭐</div>
                <h3>You haven&apos;t joined anything yet</h3>
                <p>Join groups and RSVP to events from the other tabs — they collect here.</p>
              </div>
            ) : (
              <>
                {myGroups.length > 0 && (<>
                  <h3 style={{ marginTop: "1rem" }}>My Groups ({myGroups.length})</h3>
                  <div className="group-list">{myGroups.map((g) => (
                    <div className="group-item" key={g.id}>
                      <div className="group-icon">{g.icon}</div>
                      <div className="group-info"><h4>{g.name}</h4><div className="meta">{g.members} members · {g.description}</div></div>
                      <button className="join-btn joined" onClick={() => toggleJoin(g)}>Joined</button>
                    </div>
                  ))}</div>
                </>)}
                {myEvents.length > 0 && (<>
                  <h3 style={{ marginTop: "2rem" }}>I&apos;m Going ({myEvents.length})</h3>
                  <div className="event-list">{myEvents.map((e) => {
                    const md = monthDay(e.startsAt);
                    return (
                      <div className="event-item" key={e.id}>
                        <div className="date-box"><div className="month">{md.month}</div><div className="day">{md.day}</div></div>
                        <div className="event-info"><h4>{e.title}</h4><div className="meta">{eventMeta(e)}</div></div>
                        <button className="join-btn joined" onClick={() => toggleRsvp(e)}>Going ({e.rsvps})</button>
                      </div>
                    );
                  })}</div>
                </>)}
              </>
            )}
          </section>
        )}
      </div>

      {/* Modals */}
      {modal === "event" && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" role="dialog">
            <h2>Post an Event</h2>
            <p className="muted">Share a clinic, show, meet-up, or any equine event.</p>
            <label className="muted small">Title</label>
            <input className="form-input" value={evForm.title} onChange={(e) => setEvForm({ ...evForm, title: e.target.value })} placeholder="e.g. Larimer Barrel Race Fundraiser" />
            <div className="form-row">
              <div><label className="muted small">Date</label><input className="form-input" type="date" value={evForm.startsAt} onChange={(e) => setEvForm({ ...evForm, startsAt: e.target.value })} /></div>
              <div><label className="muted small">Category</label>
                <select className="form-input" value={evForm.category} onChange={(e) => setEvForm({ ...evForm, category: e.target.value })}>
                  <option>Clinic</option><option>Show</option><option>Community</option><option>Education</option><option>Trail Ride</option><option>Fundraiser</option>
                </select>
              </div>
            </div>
            <label className="muted small">Location</label>
            <input className="form-input" value={evForm.location} onChange={(e) => setEvForm({ ...evForm, location: e.target.value })} placeholder="Poudre River Stables" />
            <label className="muted small">Details (time, cost…)</label>
            <input className="form-input" value={evForm.details} onChange={(e) => setEvForm({ ...evForm, details: e.target.value })} placeholder="10am · $50" />
            <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={submitEvent}>Post Event</button></div>
          </div>
        </div>
      )}

      {modal === "thread" && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" role="dialog">
            <h2>Start a Thread</h2>
            <p className="muted">Ask the community a question or start a discussion.</p>
            <label className="muted small">Title</label>
            <input className="form-input" value={thForm.title} onChange={(e) => setThForm({ ...thForm, title: e.target.value })} placeholder="e.g. Best winter blanket for a hard keeper?" />
            <div className="form-row">
              <div><label className="muted small">Category</label>
                <select className="form-input" value={thForm.category} onChange={(e) => setThForm({ ...thForm, category: e.target.value })}>
                  <option>Horse Care</option><option>Health</option><option>Tack</option><option>Transport</option><option>Competition</option><option>Nutrition</option><option>General</option>
                </select>
              </div>
              <div><label className="muted small">Icon</label>
                <select className="form-input" value={thForm.icon} onChange={(e) => setThForm({ ...thForm, icon: e.target.value })}>
                  <option>💬</option><option>❓</option><option>🐴</option><option>🩺</option><option>🎠</option><option>🏆</option><option>🌾</option>
                </select>
              </div>
            </div>
            <label className="muted small">Your question / post</label>
            <textarea className="form-input" rows={3} value={thForm.body} onChange={(e) => setThForm({ ...thForm, body: e.target.value })} placeholder="Give some context…" />
            <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={submitThread}>Post</button></div>
          </div>
        </div>
      )}

      {modal === "group" && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" role="dialog">
            <h2>Create a Group</h2>
            <p className="muted">Gather your discipline, region, or interest. You&apos;ll be the first member.</p>
            <label className="muted small">Group Name</label>
            <input className="form-input" value={grForm.name} onChange={(e) => setGrForm({ ...grForm, name: e.target.value })} placeholder="e.g. Fort Collins Dressage Riders" />
            <label className="muted small">Description</label>
            <input className="form-input" value={grForm.description} onChange={(e) => setGrForm({ ...grForm, description: e.target.value })} placeholder="Local dressage riders meeting monthly" />
            <label className="muted small">Icon</label>
            <select className="form-input" value={grForm.icon} onChange={(e) => setGrForm({ ...grForm, icon: e.target.value })}>
              <option>👥</option><option>🤠</option><option>🎠</option><option>🏇</option><option>🐎</option><option>🏃</option><option>🌄</option><option>🏆</option>
            </select>
            <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={submitGroup}>Create Group</button></div>
          </div>
        </div>
      )}

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}
