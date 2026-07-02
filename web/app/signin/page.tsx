"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/user-context";
import { apiPost } from "@/lib/client";
import type { User } from "@/components/user-context";
import Turnstile from "@/components/turnstile";

export default function SignInPage() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [next, setNext] = useState("/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && n.startsWith("/")) setNext(n);
  }, []);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const { user } = await apiPost<{ user: User }>("/api/auth/login", { email, password, turnstileToken });
      setUser(user);
      router.push(next);
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }

  return (
    <main className="auth-layout">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Sign in to your BarnBound account.</p>
        <form className="auth-form" onSubmit={submit} noValidate>
          <label>
            Email
            <input type="email" autoComplete="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" autoComplete="current-password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <Turnstile onToken={setTurnstileToken} />
          {err && <div className="form-error">{err}</div>}
          <button type="submit" className="btn btn-primary auth-submit">Sign In</button>
        </form>
        <div className="auth-switch">
          New to BarnBound? <Link href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
        </div>
        <div className="auth-fineprint">
          <strong>Demo accounts:</strong> sage@barnbound.test · cody@barnbound.test · dana@barnbound.test — all use password <code>password123</code>.
        </div>
      </div>

      <aside className="auth-side">
        <div className="auth-side-inner">
          <h2>Connecting the Horse Community in One Place</h2>
          <ul className="auth-side-list">
            <li>✓ Browse verified local businesses</li>
            <li>✓ Join groups &amp; community forums</li>
            <li>✓ Buy &amp; sell horses, tack, and trailers</li>
            <li>✓ Find trail rides near you</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
