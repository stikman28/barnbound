"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/user-context";
import { apiGet, apiPost } from "@/lib/client";

type ConvSummary = {
  id: string; listingId: string; listingTitle: string; emoji: string;
  role: "buyer" | "seller"; other: { name: string };
  lastMessage: { body: string; createdAt: string; fromMe: boolean } | null;
};
type Msg = { id: string; body: string; createdAt: string; fromMe: boolean };
type Thread = {
  id: string; listingId: string; listingTitle: string; emoji: string;
  role: "buyer" | "seller"; other: { name: string }; messages: Msg[];
};

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return ""; }
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [convs, setConvs] = useState<ConvSummary[]>([]);
  const [thread, setThread] = useState<Thread | null>(null);
  const [reply, setReply] = useState("");
  const [ready, setReady] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const loadConvs = useCallback(async () => {
    const { conversations } = await apiGet<{ conversations: ConvSummary[] }>("/api/conversations");
    setConvs(conversations);
    return conversations;
  }, []);

  const openThread = useCallback(async (id: string) => {
    const { conversation } = await apiGet<{ conversation: Thread }>(`/api/conversations/${id}`);
    setThread(conversation);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/signin?next=/messages"); return; }
    loadConvs()
      .then((list) => {
        const pre = new URLSearchParams(window.location.search).get("c");
        const first = pre && list.some((c) => c.id === pre) ? pre : list[0]?.id;
        if (first) return openThread(first);
      })
      .finally(() => setReady(true));
  }, [user, loading, loadConvs, openThread, router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!thread || !reply.trim()) return;
    const text = reply.trim();
    setReply("");
    try {
      const { message } = await apiPost<{ message: Msg }>(`/api/conversations/${thread.id}/messages`, { body: text });
      setThread((t) => (t ? { ...t, messages: [...t.messages, message] } : t));
      loadConvs();
    } catch {
      setReply(text);
    }
  }

  if (!ready) {
    return <section className="page-hero"><div className="container"><h1>Messages</h1><p>Loading…</p></div></section>;
  }

  return (
    <>
      <section className="page-hero">
        <div className="container"><h1>Messages</h1><p>Your conversations with buyers and sellers.</p></div>
      </section>

      <div className="container" style={{ padding: "1.5rem 0 4rem" }}>
        {convs.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">💬</div>
            <h3>No conversations yet</h3>
            <p>Use “Contact” on any marketplace listing to message a seller — your threads collect here.</p>
            <Link href="/marketplace" className="btn btn-primary btn-sm">Browse Marketplace</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.25rem", alignItems: "start" }}>
            {/* Inbox */}
            <aside style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {convs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openThread(c.id)}
                  style={{
                    textAlign: "left", padding: "0.75rem 0.9rem", borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)", cursor: "pointer",
                    background: thread?.id === c.id ? "var(--cream-100)" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontSize: "1.4rem" }}>{c.emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: "0.92rem" }}>{c.other.name}</strong>
                      <span className="muted small" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.listingTitle}</span>
                    </div>
                    <span className="chip" style={{ marginLeft: "auto" }}>{c.role === "seller" ? "Selling" : "Buying"}</span>
                  </div>
                  {c.lastMessage ? (
                    <div className="muted small" style={{ marginTop: "0.35rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.lastMessage.fromMe ? "You: " : ""}{c.lastMessage.body}
                    </div>
                  ) : null}
                </button>
              ))}
            </aside>

            {/* Thread */}
            <main style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "#fff", display: "flex", flexDirection: "column", minHeight: 480, maxHeight: "72vh" }}>
              {!thread ? (
                <div className="muted" style={{ margin: "auto" }}>Select a conversation</div>
              ) : (
                <>
                  <div style={{ padding: "0.9rem 1.1rem", borderBottom: "1px solid var(--border)" }}>
                    <strong>{thread.other.name}</strong>
                    <div className="muted small">
                      <Link href="/marketplace">{thread.emoji} {thread.listingTitle}</Link> · You&apos;re the {thread.role}
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {thread.messages.map((m) => (
                      <div key={m.id} style={{ alignSelf: m.fromMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                        <div style={{
                          padding: "0.55rem 0.8rem", borderRadius: "var(--radius-md)",
                          background: m.fromMe ? "var(--green-700)" : "var(--cream-100)",
                          color: m.fromMe ? "var(--cream-50)" : "var(--ink-900)",
                        }}>{m.body}</div>
                        <div className="muted" style={{ fontSize: "0.7rem", textAlign: m.fromMe ? "right" : "left", marginTop: "0.15rem" }}>{fmtTime(m.createdAt)}</div>
                      </div>
                    ))}
                    <div ref={endRef} />
                  </div>

                  <form onSubmit={send} style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 1.1rem", borderTop: "1px solid var(--border)" }}>
                    <input className="form-input" style={{ flex: 1, margin: 0 }} placeholder="Type a message…" value={reply} onChange={(e) => setReply(e.target.value)} />
                    <button type="submit" className="btn btn-primary">Send</button>
                  </form>
                </>
              )}
            </main>
          </div>
        )}
      </div>
    </>
  );
}
