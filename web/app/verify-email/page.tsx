"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { apiPost } from "@/lib/client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading, refresh } = useUser();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/signin?next=/verify-email"); return; }
    if (user.emailVerified) router.replace("/");
  }, [user, loading, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setMsg(""); setBusy(true);
    try {
      await apiPost("/api/auth/verify-email", { code });
      await refresh();
      router.push("/");
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setErr(""); setMsg("");
    try {
      await apiPost("/api/auth/verify-email/resend");
      setMsg("A new code is on its way to your inbox.");
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }

  return (
    <main className="auth-layout">
      <div className="auth-card">
        <h1>Check your email</h1>
        <p className="muted">
          We sent a 6-digit code to <strong>{user?.email}</strong>. Enter it below to verify your
          account — until then you can browse, but not list, buy, or message.
        </p>
        <form className="auth-form" onSubmit={submit} noValidate>
          <label>
            Verification code
            <input
              type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              placeholder="123456" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required
            />
          </label>
          {err && <div className="form-error">{err}</div>}
          {msg && <p className="small" style={{ color: "var(--green-600, #2e7d32)" }}>{msg}</p>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={busy || code.length !== 6}>
            {busy ? "Verifying…" : "Verify Email"}
          </button>
        </form>
        <div className="auth-switch">
          Didn&apos;t get it? <button type="button" className="btn btn-ghost btn-sm" onClick={resend}>Resend code</button>
        </div>
      </div>

      <aside className="auth-side">
        <div className="auth-side-inner">
          <h2>Why we verify</h2>
          <ul className="auth-side-list">
            <li>✓ Every seller badge is earned, not given</li>
            <li>✓ Keeps bots and fake accounts out</li>
            <li>✓ Protects buyers, sellers, and businesses</li>
            <li>✓ Security is a BarnBound design principle</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
