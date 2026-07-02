"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { apiGet, apiPatch, priceLabel } from "@/lib/client";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  fulfillmentStatus: "NEW" | "SHIPPED" | "DELIVERED";
  seller: string | null;
};

type ShopOrder = {
  id: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  paymentRef: string | null;
  shipName: string;
  shipAddress: string;
  shipCity: string;
  shipState: string;
  shipZip: string;
  createdAt: string;
  items: OrderItem[];
};

type Fulfillment = {
  id: string;
  orderId: string;
  name: string;
  price: number;
  qty: number;
  commission: number;
  sellerNet: number;
  fulfillmentStatus: "NEW" | "SHIPPED" | "DELIVERED";
  createdAt: string;
  buyer: string;
  shipTo: string;
};

const FULFILLMENT_LABEL: Record<string, string> = {
  NEW: "🕐 Awaiting shipment",
  SHIPPED: "📦 Shipped",
  DELIVERED: "✅ Delivered",
};

export default function OrdersPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [toast, setToast] = useState("");

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 4500);
  }, []);

  const load = useCallback(async () => {
    try {
      const d = await apiGet<{ orders: ShopOrder[]; fulfillments: Fulfillment[] }>("/api/shop-orders");
      setOrders(d.orders);
      setFulfillments(d.fulfillments);
    } catch { /* redirect handles signed-out */ }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/signin?next=/orders"); return; }
    load();
  }, [user, loading, router, load]);

  async function updateFulfillment(f: Fulfillment, status: "SHIPPED" | "DELIVERED") {
    try {
      await apiPatch(`/api/shop-orders/items/${f.id}`, { fulfillmentStatus: status });
      await load();
      showToast(status === "SHIPPED" ? "Marked shipped — the buyer can see it." : "Marked delivered.");
    } catch (e) { showToast((e as Error).message); }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Shop Orders</h1>
          <p>Orders you&apos;ve placed in the shop{fulfillments.length ? " — and items routed to you to fulfill" : ""}.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 1rem 3rem" }}>
        {fulfillments.length > 0 && (
          <>
            <h2 style={{ margin: "0 0 0.75rem" }}>📬 To Fulfill</h2>
            {fulfillments.map((f) => (
              <article className="card" key={f.id} style={{ padding: "1rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{f.name} × {f.qty}</h3>
                    <div className="muted small">Ordered by {f.buyer} · {new Date(f.createdAt).toLocaleDateString()}</div>
                    <div className="small" style={{ marginTop: "0.25rem" }}>Ship to: {f.shipTo}</div>
                    <div className="muted small" style={{ marginTop: "0.25rem" }}>
                      Sale {priceLabel(f.price * f.qty)} · commission ${f.commission.toFixed(2)} · your payout ${f.sellerNet.toFixed(2)} (paid out once PayPal is live)
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="chip">{FULFILLMENT_LABEL[f.fulfillmentStatus]}</span>
                    {f.fulfillmentStatus === "NEW" && (
                      <button className="btn btn-primary btn-sm" onClick={() => updateFulfillment(f, "SHIPPED")}>Mark Shipped</button>
                    )}
                    {f.fulfillmentStatus === "SHIPPED" && (
                      <button className="btn btn-ghost btn-sm" onClick={() => updateFulfillment(f, "DELIVERED")}>Mark Delivered</button>
                    )}
                  </div>
                </div>
              </article>
            ))}
            <h2 style={{ margin: "2rem 0 0.75rem" }}>🛍️ My Orders</h2>
          </>
        )}

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🧾</div>
            <h3>No shop orders yet</h3>
            <p>When you check out in the shop, your orders show up here.</p>
            <Link href="/shop" className="btn btn-primary" style={{ marginTop: "0.75rem" }}>Browse the Shop</Link>
          </div>
        ) : (
          orders.map((o) => (
            <article className="card" key={o.id} style={{ padding: "1rem", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h3 style={{ margin: 0 }}>Order {o.paymentRef ?? o.id.slice(-8).toUpperCase()}</h3>
                  <div className="muted small">
                    {new Date(o.createdAt).toLocaleDateString()} · ships to {o.shipName}, {o.shipCity}, {o.shipState}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="card-price">{priceLabel(o.total)}</div>
                  <span className="chip">{o.status === "PAID" ? "✓ Paid (test mode)" : o.status}</span>
                </div>
              </div>
              <div style={{ marginTop: "0.75rem", borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "0.5rem" }}>
                {o.items.map((i) => (
                  <div key={i.id} className="small" style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0" }}>
                    <span>{i.name} × {i.qty}{i.seller ? <span className="muted"> — ships from {i.seller}</span> : null}</span>
                    <span>
                      <span className="muted" style={{ marginRight: "0.75rem" }}>{FULFILLMENT_LABEL[i.fulfillmentStatus]}</span>
                      {priceLabel(i.price * i.qty)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}
