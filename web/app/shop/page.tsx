"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { apiGet, apiPost, apiPatch, priceLabel } from "@/lib/client";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  shipping: number;
  emoji: string;
  category: string;
  brand: string | null;
  inventory: number;
  pick: boolean;
  sellerId: string;
  seller: string | null;
};

type Cart = { items: { id: string; qty: number; product: Product }[]; total: number };

const CATEGORIES = [
  "Tack & Saddles", "Horse Care", "Apparel & Boots", "Barn & Stable", "Feed & Supplements", "Gifts & Lifestyle",
];

export default function ShopPage() {
  const { user } = useUser();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState("");

  // filters
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("picks");

  // add-product modal (merchants)
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", shipping: "", category: CATEGORIES[0], brand: "", inventory: "", desc: "" });

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 4500);
  }, []);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q.trim()) params.set("q", q.trim());
    params.set("sort", sort);
    const { products } = await apiGet<{ products: Product[] }>(`/api/products?${params}`);
    setProducts(products);
  }, [category, q, sort]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const loadCart = useCallback(async () => {
    if (!user) { setCartCount(0); return; }
    try {
      const { cart } = await apiGet<{ cart: Cart }>("/api/cart");
      setCartCount(cart.items.reduce((s, i) => s + i.qty, 0));
    } catch { /* signed out */ }
  }, [user]);

  useEffect(() => { loadCart(); }, [loadCart]);

  function requireAuth(): boolean {
    if (user) return true;
    router.push("/signin?next=/shop");
    return false;
  }

  async function addToCart(p: Product) {
    if (!requireAuth()) return;
    try {
      const { cart } = await apiGet<{ cart: Cart }>("/api/cart");
      const existing = cart.items.find((i) => i.product.id === p.id);
      const { cart: updated } = await apiPost<{ cart: Cart }>("/api/cart", { productId: p.id, qty: (existing?.qty ?? 0) + 1 });
      setCartCount(updated.items.reduce((s, i) => s + i.qty, 0));
      showToast(`Added "${p.name}" to your cart.`);
    } catch (e) { showToast((e as Error).message); }
  }

  async function togglePick(p: Product) {
    try {
      await apiPatch(`/api/products/${p.id}`, { pick: !p.pick });
      await loadProducts();
      showToast(p.pick ? "Removed from BarnBound Picks." : "Added to BarnBound Picks. ⭐");
    } catch (e) { showToast((e as Error).message); }
  }

  async function submitProduct() {
    const price = parseFloat(form.price);
    if (!form.name || !price) { showToast("Please add a name and price."); return; }
    try {
      await apiPost("/api/products", {
        name: form.name,
        price,
        shipping: form.shipping ? parseFloat(form.shipping) : 0,
        category: form.category,
        brand: form.brand || undefined,
        inventory: form.inventory ? parseInt(form.inventory, 10) : 0,
        description: form.desc,
      });
      setAddOpen(false);
      setForm({ name: "", price: "", shipping: "", category: CATEGORIES[0], brand: "", inventory: "", desc: "" });
      await loadProducts();
      showToast("Product added to the shop.");
    } catch (e) { showToast((e as Error).message); }
  }

  const picks = products.filter((p) => p.pick);
  const isMerchant = user && (user.role === "MERCHANT" || user.role === "ADMIN");
  const isAdmin = user?.role === "ADMIN";

  function productCard(p: Product) {
    const out = p.inventory <= 0;
    return (
      <article className="card listing-card" key={p.id}>
        <div className="card-image" aria-hidden="true">
          <span style={{ fontSize: "5rem" }}>{p.emoji || "🛍️"}</span>
          {p.pick ? <span className="badge featured">⭐ BarnBound Pick</span> : null}
        </div>
        <div className="card-body">
          <h3>{p.name}</h3>
          <div className="card-meta">{[p.brand, p.category].filter(Boolean).join(" · ")}</div>
          <p className="small muted" style={{ margin: "0 0 0.5rem" }}>{p.description}</p>
          <div className="card-price">
            {priceLabel(p.price)}
            {p.shipping > 0 ? <span className="muted small"> + ${p.shipping} shipping</span> : <span className="muted small"> · free shipping</span>}
          </div>
          <div className="card-footer">
            <span className="chip">{out ? "Out of stock" : `${p.inventory} in stock`}</span>
            {p.seller ? <span className="muted small">Ships from {p.seller}</span> : null}
          </div>
          <div className="card-actions">
            {isAdmin ? (
              <button className="btn btn-ghost btn-sm" onClick={() => togglePick(p)}>
                {p.pick ? "★ Unpick" : "☆ Pick"}
              </button>
            ) : null}
            <button className="btn btn-primary btn-sm" disabled={out} onClick={() => addToCart(p)}>
              {out ? "Sold Out" : "Add to Cart"}
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Shop</h1>
          <p>New gear from trusted equestrian brands, shipped straight from our partner merchants. Look for ⭐ BarnBound Picks — products we&apos;ve tried and endorse.</p>
        </div>
      </section>

      <div className="container" style={{ padding: "1.5rem 1rem 3rem" }}>
        <div className="results-bar">
          <div className="results-count"><strong>{products.length}</strong> products</div>
          <div className="results-actions">
            {isMerchant ? <button className="btn btn-ghost" onClick={() => setAddOpen(true)}>+ Add Product</button> : null}
            <Link href="/cart" className="btn btn-primary">🛒 Cart{cartCount ? ` (${cartCount})` : ""}</Link>
          </div>
        </div>

        <div className="results-bar" style={{ marginTop: "0.5rem" }}>
          <input className="form-input" style={{ maxWidth: 280 }} placeholder="Search the shop…"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="results-actions">
            <select className="sort-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="picks">Sort: BarnBound Picks</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {picks.length > 0 && !category && !q.trim() ? (
          <>
            <h2 style={{ margin: "1.5rem 0 0.75rem" }}>⭐ BarnBound Picks</h2>
            <div className="card-grid">{picks.map(productCard)}</div>
            <h2 style={{ margin: "2rem 0 0.75rem" }}>All Products</h2>
          </>
        ) : null}

        <div className="card-grid" style={{ marginTop: picks.length && !category && !q.trim() ? 0 : "1.5rem" }}>
          {products.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1/-1" }}>
              <div className="emoji">🛍️</div>
              <h3>No products match</h3>
              <p>Try a different search or category.</p>
            </div>
          ) : (
            products.map(productCard)
          )}
        </div>
      </div>

      {/* Add product modal (merchants) */}
      {addOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setAddOpen(false); }}>
          <div className="modal" role="dialog" aria-label="Add a product">
            <h2>Add a Product</h2>
            <p className="muted">New goods only — used items belong in the Marketplace. Orders route to you for drop-ship fulfillment.</p>
            <label className="muted small">Product Name</label>
            <input className="form-input" placeholder="e.g. Leather Halter — Cob Size"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="form-row">
              <div>
                <label className="muted small">Price ($)</label>
                <input className="form-input" type="number" min={0.01} step="0.01" placeholder="49.99"
                  value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className="muted small">Shipping ($, 0 = free)</label>
                <input className="form-input" type="number" min={0} step="0.01" placeholder="0"
                  value={form.shipping} onChange={(e) => setForm({ ...form, shipping: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label className="muted small">Category</label>
                <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="muted small">Inventory (units)</label>
                <input className="form-input" type="number" min={0} placeholder="10"
                  value={form.inventory} onChange={(e) => setForm({ ...form, inventory: e.target.value })} />
              </div>
            </div>
            <label className="muted small">Brand (optional)</label>
            <input className="form-input" placeholder="e.g. Weaver Leather"
              value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <label className="muted small">Description</label>
            <textarea className="form-input" rows={2} placeholder="Materials, sizing, what's in the box…"
              value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitProduct}>Add to Shop</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="bb-toast show">{toast}</div>}
    </>
  );
}
