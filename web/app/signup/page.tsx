"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/user-context";
import { apiPost } from "@/lib/client";
import type { User } from "@/components/user-context";
import Turnstile from "@/components/turnstile";

const ROLES = [
  { value: "RIDER", label: "Rider / Owner" },
  { value: "TRAINER", label: "Trainer / Instructor" },
  { value: "BARN_OWNER", label: "Barn / Facility Owner" },
  { value: "MERCHANT", label: "Merchant / Seller" },
];

export default function SignUpPage() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [next, setNext] = useState("/");
  const [form, setForm] = useState({ name: "", email: "", password: "", location: "", role: "RIDER" });
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && n.startsWith("/")) setNext(n);
  }, []);

  useEffect(() => {
    if (!user) return;
    router.replace(user.emailVerified ? next : "/verify-email");
  }, [user, next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!terms) { setErr("Please agree to the Terms to continue."); return; }
    if (form.password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    try {
      const { user } = await apiPost<{ user: User }>("/api/auth/register", { ...form, turnstileToken });
      setUser(user);
      router.push("/verify-email");
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <main className="auth-layout">
      <div className="auth-card">
        <h1>Join BarnBound</h1>
        <p className="muted">Create your free account to buy, sell, and connect.</p>
        <form className="auth-form" onSubmit={submit} noValidate>
          <label>
            Full Name
            <input type="text" placeholder="Jane Rider" value={form.name} onChange={set("name")} required />
          </label>
          <label>
            Email
            <input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
          </label>
          <label>
            Password
            <input type="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={set("password")} required />
          </label>
          <label>
            Location (optional)
            <input type="text" placeholder="Fort Collins, CO" value={form.location} onChange={set("location")} />
          </label>
          <label>
            I am a…
            <select value={form.role} onChange={set("role")}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
          <label className="auth-terms">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> I agree to the Terms &amp; Privacy Policy.
          </label>
          <Turnstile onToken={setTurnstileToken} />
          {err && <div className="form-error">{err}</div>}
          <button type="submit" className="btn btn-primary auth-submit">Create Account</button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link href={`/signin?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </div>
      </div>

      <aside className="auth-side">
        <div className="auth-side-inner">
          <h2>Connecting the Horse Community in One Place</h2>
          <ul className="auth-side-list">
            <li>✓ List horses, tack, and trailers in minutes</li>
            <li>✓ Reach verified local buyers</li>
            <li>✓ Track your offers and messages</li>
            <li>✓ Discover trusted equine businesses</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
