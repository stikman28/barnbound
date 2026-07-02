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

export default function AdminPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [toast, setToast] = useState("");

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 4500);
  }, []);

  const load = useCallback(async () => {
    try {
      const { claims } = await apiGet<{ claims: Claim[] }>("/api/admin/claims");
      setClaims(claims);
    } catch { /* non-admin — redirected below */ }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN") { router.replace("/"); return; }
    load();
  }, [user, loading, router, load]);

  async function decide(c: Claim, action: "APPROVE" | "REJECT") {
    try {
      await apiPatch(`/api/admin/claims/${c.id}`, { action });
      await load();
      showToast(action === "APPROVE" ? `${c.business.name} → ${c.claimant.name}.` : "Claim rejected.");
    } catch (e) { showToast((e as Error).message); }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Admin — Business Claims</h1>
          <p>Approve claims only when the proof genuinely ties the claimant to the business.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 1rem 3rem" }}>
        {claims.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">✅</div>
            <h3>No pending claims</h3>
            <p>New claim requests will appear here for review.</p>
          </div>
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
                  <button className="btn btn-primary btn-sm" onClick={() => decide(c, "APPROVE")}>Approve</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => decide(c, "REJECT")}>Reject</button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}
