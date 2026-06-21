"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/components/user-context";
import { apiPost } from "@/lib/client";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/directory", label: "Directory" },
  { href: "/community", label: "Community" },
  { href: "/map", label: "Map" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function UserMenu() {
  const { user, loading, setUser } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  if (loading) return <div className="header-cta" />;

  if (!user) {
    return (
      <div className="header-cta">
        <Link href="/signin" className="btn btn-ghost">Sign In</Link>
        <Link href="/signup" className="btn btn-primary">Join Free</Link>
      </div>
    );
  }

  const initial = (user.name[0] || "U").toUpperCase();
  async function signOut() {
    await apiPost("/api/auth/logout").catch(() => {});
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="header-cta">
      <div className="user-menu">
        <button
          className="user-chip"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          <span className="user-avatar">{initial}</span>
          <span className="user-name">{user.name.split(" ")[0]}</span>
          <span className="caret">▾</span>
        </button>
        <div
          className={`user-dropdown ${open ? "" : "hidden"}`}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="user-dropdown-head">
            <div className="user-avatar big">{initial}</div>
            <div>
              <strong>{user.name}</strong>
              <span className="muted small">{user.email}</span>
            </div>
          </div>
          <div className="user-dropdown-body">
            <span className="chip">{user.role}</span>
            {user.location ? <span className="chip">📍 {user.location}</span> : null}
          </div>
          <Link href="/dashboard" className="user-dropdown-item">My Dashboard</Link>
          <Link href="/marketplace" className="user-dropdown-item">Buy &amp; Sell</Link>
          <button type="button" className="user-dropdown-item danger" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="BarnBound — Connecting the Horse Community in One Place" />
        </Link>
        <nav className="main-nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={isActive(pathname, n.href) ? "active" : ""}>
              {n.label}
            </Link>
          ))}
        </nav>
        <UserMenu />
      </div>
    </header>
  );
}
