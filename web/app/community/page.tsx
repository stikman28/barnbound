"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/user-context";

const EVENTS = [
  { id: 1, month: "Nov", day: 8, title: "Front Range Ranch Horse Clinic", meta: "Sat · Poudre River Stables · $150", category: "Clinic" },
  { id: 2, month: "Nov", day: 15, title: "Larimer County Saddle Club Show", meta: "Sat · All day · Loveland Fairgrounds", category: "Show" },
  { id: 3, month: "Nov", day: 22, title: "BarnBound Meet & Greet — Fort Collins", meta: "Sat · 2pm · Happy Horse Tack Shop", category: "Community" },
  { id: 4, month: "Dec", day: 6, title: "CSU Equine Sciences Open House", meta: "Sat · 10am · CSU Equine Center", category: "Education" },
  { id: 5, month: "Dec", day: 13, title: "Winter Dressage Schooling Show", meta: "Sat · All day · Mountain View Arena", category: "Show" },
  { id: 6, month: "Jan", day: 10, title: "Beginner Barrel Racing Clinic", meta: "Sat · Soukup Stables · $125", category: "Clinic" },
];
const FORUMS = [
  { icon: "❓", title: "Best winter blanket for a hard keeper?", meta: "Posted in Horse Care · 14 replies · 2h ago" },
  { icon: "🐴", title: "Recommendations for reliable hauler to Texas?", meta: "Posted in Transport · 9 replies · 5h ago" },
  { icon: "🩺", title: "Anyone tried Equioxx long-term for an older horse?", meta: "Posted in Health · 23 replies · yesterday" },
  { icon: "🎠", title: "Saddle fitting in Northern Colorado — who do you use?", meta: "Posted in Tack · 17 replies · 2 days ago" },
  { icon: "🏆", title: "First barrel race — what should I bring?", meta: "Posted in Competition · 28 replies · 3 days ago" },
  { icon: "🌾", title: "Cutting back on alfalfa — what are you feeding?", meta: "Posted in Nutrition · 11 replies · 4 days ago" },
];
const GROUPS = [
  { icon: "🤠", title: "Front Range Western Riders", meta: "2,847 members · Active daily" },
  { icon: "🎠", title: "Larimer County Hunter/Jumper", meta: "1,423 members · Active daily" },
  { icon: "🏇", title: "CSU Equestrian & Alumni", meta: "892 members · Active weekly" },
  { icon: "🐎", title: "Northern Colorado Dressage", meta: "1,104 members · Active daily" },
  { icon: "🏃", title: "Barrel Racers of NoCo", meta: "2,112 members · Active daily" },
  { icon: "🌄", title: "Colorado Trail Riders", meta: "4,237 members · Active daily" },
];

const TABS = [
  { key: "events", label: "Events" },
  { key: "forums", label: "Q&A Forums" },
  { key: "groups", label: "Groups" },
];

export default function CommunityPage() {
  const { user } = useUser();
  const [tab, setTab] = useState("events");

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Community</h1>
          <p>Local events, discipline groups, and a Q&amp;A forum for Northern Colorado horse people.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 0 4rem" }}>
        {!user && (
          <div className="deal-summary" style={{ marginBottom: "1.5rem" }}>
            <strong>Join the conversation</strong>
            <span className="muted small">
              <Link href="/signup?next=/community">Create a free account</Link> or{" "}
              <Link href="/signin?next=/community">sign in</Link> to post events, start threads, and join groups.
            </span>
          </div>
        )}

        <div className="dash-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "events" && (
          <div className="event-list">
            {EVENTS.map((e) => (
              <div className="event-item" key={e.id}>
                <div className="date-box"><div className="month">{e.month}</div><div className="day">{e.day}</div></div>
                <div className="event-info"><h4>{e.title}</h4><div className="meta">{e.meta}</div></div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span className="stat-pill">{e.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "forums" && (
          <div className="forum-list">
            {FORUMS.map((f, i) => (
              <div className="forum-item" key={i}>
                <div className="forum-icon">{f.icon}</div>
                <div className="forum-info"><h4>{f.title}</h4><div className="meta">{f.meta}</div></div>
              </div>
            ))}
          </div>
        )}

        {tab === "groups" && (
          <div className="group-list">
            {GROUPS.map((g, i) => (
              <div className="group-item" key={i}>
                <div className="group-icon">{g.icon}</div>
                <div className="group-info"><h4>{g.title}</h4><div className="meta">{g.meta}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
