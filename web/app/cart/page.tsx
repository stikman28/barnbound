"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { apiGet, apiPost, priceLabel } from "@/lib/client";

type Product = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  brand: string | null;
  price: number;
  shipping: number;
  inventory: number;
  seller: string | null;
};

type Cart = {
  items: { id: string; qty: number; product: Product }[];
  subtotal: number;
  shipping: number;
  total: number;
};

type ShopOrder = { id: string; total: number; paymentRef: string | null };

export default function CartPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [toast, setToast] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<ShopOrder | null>(null);
  const [ship, setShip] = useState({ shipName: "", shipAddress: "", shipCity: "", shipState: "CO", shipZip: "" });

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 4500);
  }, []);

  const loadCart = useCallback(async () => {
    try {
      const { cart } = await apiGet<{ cart: Cart }>("/api/cart");
      setCart(cart);
    } catch { /* handled by redirect below */ }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/signin?next=/cart"); return; }
    setShip((s) => ({ ...s, shipName: s.shipName || user.name }));
    loadCart();
  }, [user, loading, router, loadCart]);

  async function setQty(productId: string, qty: number) {
    try {
      const { cart } = await apiPost<{ cart: Cart }>("/api/cart", { productId, qty });
      setCart(cart);
    } catch (e) { showToast((e as Error).message); }
  }

  async function checkout() {
    if (!ship.shipName || !ship.shipAddress || !ship.shipCity || !ship.shipState || !ship.shipZip) {
      showToast("Please fill in the full shipping address.");
      return;
    }
    setPlacing(true);
    try {
      const { order } = await apiPost<{ order: ShopOrder }>("/api/checkout", ship);
      setPlaced(order);
      setCart(null);
    } catch (e) { showToast((e as Error).message); }
    finally { setPlacing(false); }
  }

  if (placed) {
    return (
      <div className="container" style={{ padding: "3rem 1rem" }}>
        <div className="empty-state">
          <div className="emoji">✅</div>
          <h3>Order placed!</h3>
          <p>
            Test order <strong>{placed.paymentRef}</strong> for <strong>{priceLabel(placed.total)}</strong> confirmed.
            Our partner merchants will ship your items directly to you.
          </p>
          <p className="muted small">Payments are in test mode — no card or PayPal account was charged.</p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1rem" }}>
            <Link href="/orders" className="btn btn-primary">View My Orders</Link>
            <Link href="/shop" className="btn btn-ghost">Keep Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Your Cart</h1>
          <p>Review your items and check out. Each item ships directly from its merchant.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 1rem 3rem" }}>
        {!cart || cart.items.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Browse the shop to find gear you&apos;ll love.</p>
            <Link href="/shop" className="btn btn-primary" style={{ marginTop: "0.75rem" }}>Go to the Shop</Link>
          </div>
        ) : (
          <div className="page-layout" style={{ alignItems: "start" }}>
            <main>
              {cart.items.map((i) => (
                <article className="card" key={i.id} style={{ display: "flex", gap: "1rem", padding: "1rem", marginBottom: "0.75rem", alignItems: "center" }}>
                  <span style={{ fontSize: "2.5rem" }} aria-hidden="true">{i.product.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>{i.product.name}</h3>
                    <div className="muted small">
                      {[i.product.brand, i.product.category].filter(Boolean).join(" · ")}
                      {i.product.seller ? ` · Ships from ${i.product.seller}` : ""}
                    </div>
                    <div className="card-price" style={{ marginTop: "0.25rem" }}>
                      {priceLabel(i.product.price)}
                      {i.product.shipping > 0 ? <span className="muted small"> + ${i.product.shipping} shipping</span> : null}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button className="btn btn-ghost btn-sm" aria-label="Decrease quantity" onClick={() => setQty(i.product.id, i.qty - 1)}>−</button>
                    <strong>{i.qty}</strong>
                    <button className="btn btn-ghost btn-sm" aria-label="Increase quantity" onClick={() => setQty(i.product.id, i.qty + 1)}>+</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setQty(i.product.id, 0)}>Remove</button>
                  </div>
                </article>
              ))}
            </main>

            <aside className="filters" aria-label="Checkout">
              <h3>Shipping Address</h3>
              <div className="filter-group">
                <input className="form-input" placeholder="Full name"
                  value={ship.shipName} onChange={(e) => setShip({ ...ship, shipName: e.target.value })} />
                <input className="form-input" placeholder="Street address"
                  value={ship.shipAddress} onChange={(e) => setShip({ ...ship, shipAddress: e.target.value })} />
                <input className="form-input" placeholder="City"
                  value={ship.shipCity} onChange={(e) => setShip({ ...ship, shipCity: e.target.value })} />
                <div className="form-row">
                  <input className="form-input" placeholder="State"
                    value={ship.shipState} onChange={(e) => setShip({ ...ship, shipState: e.target.value })} />
                  <input className="form-input" placeholder="ZIP"
                    value={ship.shipZip} onChange={(e) => setShip({ ...ship, shipZip: e.target.value })} />
                </div>
              </div>

              <h3>Order Summary</h3>
              <div className="filter-group small">
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{priceLabel(cart.subtotal)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Shipping</span><span>{cart.shipping ? priceLabel(cart.shipping) : "Free"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>Total</span><span>{priceLabel(cart.total)}</span></div>
              </div>

              <button className="btn btn-primary" style={{ width: "100%" }} disabled={placing} onClick={checkout}>
                {placing ? "Placing order…" : "Place Order (Test Mode)"}
              </button>
              <p className="muted small" style={{ marginTop: "0.5rem" }}>
                💳 PayPal checkout is coming soon — orders placed now are test orders and nothing is charged.
              </p>
            </aside>
          </div>
        )}
      </div>

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}
