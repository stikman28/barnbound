"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { apiGet, apiPatch } from "@/lib/client";

type Claim = {
  id: string;
  proof: string;
  createdAt: string;
  business: { id: number; name: string; city: string; category: string };
  claimant: { name: string; email: string; emailVerified: boolean };
};

type Report = {
  id: string;
  targetType: string;
  targetId: string;
  target: string;
  reason: string;
  createdAt: string;
  reporter: { name: string; email: string };
};

type AuditEntry = {
  id: string;
  action: string;
  detail: string;
  ip: string | null;
  createdAt: string;
  actor: string;
};

const TABS = ["Claims", "Reports", "Audit"] as const;

export default function AdminPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Claims");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [toast, setToast] = useState("");

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 4500);
  }, []);

  const load = useCallback(async () => {
    try {
      const [c, r, a] = await Promise.all([
        apiGet<{ claims: Claim[] }>("/api/admin/claims"),
        apiGet<{ reports: Report[] }>("/api/admin/reports"),
        apiGet<{ entries: AuditEntry[] }>("/api/admin/audit"),
      ]);
      setClaims(c.claims);
      setReports(r.reports);
      setAudit(a.entries);
    } catch { /* non-admin — redirected below */ }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN") { router.replace("/"); return; }
    load();
  }, [user, loading, router, load]);

  async function decideClaim(c: Claim, action: "APPROVE" | "REJECT") {
    try {
      await apiPatch(`/api/admin/claims/${c.id}`, { action });
      await load();
      showToast(action === "APPROVE" ? `${c.business.name} → ${c.claimant.name}.` : "Claim rejected.");
    } catch (e) { showToast((e as Error).message); }
  }

  async function decideReport(r: Report, action: "RESOLVE" | "DISMISS", removeContent = false) {
    try {
      await apiPatch(`/api/admin/reports/${r.id}`, { action, removeContent });
      await load();
      showToast(removeContent ? "Content removed and report resolved." : `Report ${action.toLowerCase()}d.`);
    } catch (e) { showToast((e as Error).message); }
  }

  const canRemove = (t: string) => t === "LISTING" || t === "PRODUCT";

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Admin — Trust &amp; Safety</h1>
          <p>Business claims, community reports, and the audit trail.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 1rem 3rem" }}>
        <div className="results-bar">
          <div className="results-actions">
            {TABS.map((t) => (
              <button key={t} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab(t)}>
                {t}
                {t === "Claims" && claims.length ? ` (${claims.length})` : ""}
                {t === "Reports" && reports.length ? ` (${reports.length})` : ""}
              </button>
            ))}
          </div>
        </div>

        {tab === "Claims" && (
          claims.length === 0 ? (
            <div className="empty-state"><div className="emoji">✅</div><h3>No pending claims</h3><p>New claim requests will appear here for review.</p></div>
          ) : (
            claims.map((c) => (
              <article className="card" key={c.id} style={{ padding: "1rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>
                      <Link href={`/business/${c.business.id}`}>{c.business.name}</Link>
                      <span className="muted small"> · {c.business.category} · {c.business.city}</span>
                    </h3>
                    <div className="small" style={{ marginTop: "0.25rem" }}>
                      Claimed by <strong>{c.claimant.name}</strong> ({c.claimant.email}){" "}
                      <span className="chip">{c.claimant.emailVerified ? "✓ email verified" : "email unverified"}</span>
                    </div>
                    <p className="small" style={{ margin: "0.5rem 0 0" }}><strong>Proof:</strong> {c.proof}</p>
                    <div className="muted small">{new Date(c.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button className="btn btn-primary btn-sm" onClick={() => decideClaim(c, "APPROVE")}>Approve</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => decideClaim(c, "REJECT")}>Reject</button>
                  </div>
                </div>
              </article>
            ))
          )
        )}

        {tab === "Reports" && (
          reports.length === 0 ? (
            <div className="empty-state"><div className="emoji">🕊️</div><h3>No open reports</h3><p>Community flags land here for moderation.</p></div>
          ) : (
            reports.map((r) => (
              <article className="card" key={r.id} style={{ padding: "1rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>
                      <span className="chip">{r.targetType}</span> {r.target}
                    </h3>
                    <p className="small" style={{ margin: "0.5rem 0 0" }}><strong>Reason:</strong> {r.reason}</p>
                    <div className="muted small">
                      Reported by {r.reporter.name} ({r.reporter.email}) · {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    {canRemove(r.targetType) && (
                      <button className="btn btn-primary btn-sm" onClick={() => decideReport(r, "RESOLVE", true)}>Remove Content</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => decideReport(r, "RESOLVE")}>Resolve</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => decideReport(r, "DISMISS")}>Dismiss</button>
                  </div>
                </div>
              </article>
            ))
          )
        )}

        {tab === "Audit" && (
          audit.length === 0 ? (
            <div className="empty-state"><div className="emoji">📜</div><h3>No audit entries yet</h3><p>Sensitive actions are recorded here.</p></div>
          ) : (
            <article className="card" style={{ padding: "0.5rem 1rem" }}>
              {audit.map((e) => (
                <div key={e.id} className="small" style={{ display: "flex", gap: "0.75rem", padding: "0.4rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", flexWrap: "wrap" }}>
                  <span className="muted" style={{ whiteSpace: "nowrap" }}>{new Date(e.createdAt).toLocaleString()}</span>
                  <span className="chip">{e.action}</span>
                  <span style={{ flex: 1 }}>{e.detail}</span>
                  <span className="muted">{e.actor}{e.ip ? ` · ${e.ip}` : ""}</span>
                </div>
              ))}
            </article>
          )
        )}
      </div>

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}
