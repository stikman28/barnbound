"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { apiGet } from "@/lib/client";

// Leaflet is loaded from CDN; it attaches itself to window.L.
type LeafletMap = { setView: (c: [number, number], z: number) => LeafletMap; remove: () => void };
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
  }
}

type Business = {
  id: number; name: string; category: string; city: string;
  coords: [number, number] | null; emoji: string | null; rating: number; reviews: number;
};

export default function MapPage() {
  const [ready, setReady] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    apiGet<{ businesses: Business[] }>("/api/businesses").then((d) => setBusinesses(d.businesses)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready || !elRef.current || mapRef.current || !window.L) return;
    const L = window.L;
    const map = L.map(elRef.current).setView([40.45, -105.05], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
  }, [ready]);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    businesses.forEach((b) => {
      if (!b.coords) return;
      const icon = L.divIcon({
        html: `<div style="font-size:1.7rem;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))">${b.emoji || "📍"}</div>`,
        className: "bb-map-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 30],
      });
      L.marker(b.coords, { icon })
        .addTo(mapRef.current)
        .bindPopup(`<strong>${b.name}</strong><br>${b.category} · ${b.city}<br>★ ${b.rating} (${b.reviews})`);
    });
  }, [ready, businesses]);

  return (
    <>
      {/* React 19 hoists these to <head> */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onLoad={() => setReady(true)} />

      <section className="page-hero">
        <div className="container">
          <h1>Front Range Map</h1>
          <p>Explore BarnBound&apos;s launch partners across Northern Colorado. Click a pin for details.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 0 4rem" }}>
        <div
          ref={elRef}
          style={{
            height: "70vh",
            minHeight: 520,
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
            background: "var(--cream-100)",
          }}
        />
        {!ready && <p className="muted small" style={{ marginTop: "1rem" }}>Loading map…</p>}
      </div>
    </>
  );
}
