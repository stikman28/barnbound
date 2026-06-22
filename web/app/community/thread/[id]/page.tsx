"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/user-context";
import { apiGet, apiPost } from "@/lib/client";

type Reply = { id: string; body: string; author: string; createdAt: string };
type Thread = { id: string; title: string; category: string; icon: string; body: string; author: string; createdAt: string; replies: Reply[] };

function fmt(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return ""; }
}

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useUser();
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(null);
  const [missing, setMissing] = useState(false);
  const [reply, setReply] = useState("");

  const load = useCallback(() => {
    if (!id) return;
    apiGet<{ thread: Thread }>(`/api/community/threads/${id}`).then((d) => setThread(d.thread)).catch(() => setMissing(true));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push(`/signin?next=/community/thread/${id}`); return; }
    if (!reply.trim()) return;
    const text = reply.trim();
    setReply("");
    try {
      const { reply: r } = await apiPost<{ reply: Reply }>(`/api/community/threads/${id}/replies`, { body: text });
      setThread((t) => (t ? { ...t, replies: [...t.replies, r] } : t));
    } catch { setReply(text); }
  }

  if (missing) {
    return <section className="page-hero"><div className="container"><h1>Thread not found</h1><p><Link href="/community">← Back to Community</Link></p></div></section>;
  }
  if (!thread) {
    return <section className="page-hero"><div className="container"><h1>Loading…</h1></div></section>;
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="small"><Link href="/community">← Community</Link></p>
          <h1>{thread.icon} {thread.title}</h1>
          <p>Posted in {thread.category} · by {thread.author} · {fmt(thread.createdAt)}</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 0 4rem", maxWidth: 760 }}>
        {thread.body ? <p style={{ fontSize: "1.05rem", marginTop: 0 }}>{thread.body}</p> : null}

        <h3 style={{ marginTop: "2rem" }}>{thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}</h3>
        <div className="dash-list">
          {thread.replies.map((r) => (
            <div className="dash-row" key={r.id}>
              <div className="dash-row-main">
                <strong>{r.author}</strong>
                <div className="dash-row-note">{r.body}</div>
                <div className="meta muted small">{fmt(r.createdAt)}</div>
              </div>
            </div>
          ))}
          {thread.replies.length === 0 && <p className="muted">No replies yet — be the first.</p>}
        </div>

        <form onSubmit={send} style={{ marginTop: "1.5rem" }}>
          <label className="muted small">{user ? "Add a reply" : "Sign in to reply"}</label>
          <textarea className="form-input" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Share your thoughts…" />
          <button className="btn btn-primary" type="submit" style={{ marginTop: "0.5rem" }}>Post Reply</button>
        </form>
      </div>
    </>
  );
}
