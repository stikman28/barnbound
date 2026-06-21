/* My Dashboard — the signed-in member's marketplace activity:
   listings they're selling, offers they've sent, saved items, and messages.
   All data comes from localStorage via store.js. */

// Require sign-in; bounce to sign-in and return to the dashboard afterward.
if (!Store.currentUser()) {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = 'signin.html?next=' + next;
}

function priceLabel(price) {
  return price >= 1000 ? `$${price.toLocaleString()}` : `$${price}`;
}

function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ''; }
}

function allListings() { return [...Store.userListings(), ...LISTINGS]; }
function findListing(id) { return allListings().find(l => String(l.id) === String(id)); }

/* ---------- Card markup ---------- */

function miniCard(l, footerHtml) {
  const metaLine = l.type === 'Horse'
    ? [l.breed, l.discipline, l.age ? `${l.age}yr` : null, l.city].filter(Boolean).join(' · ')
    : `${l.category || l.type} · ${l.city}`;
  return `
    <article class="card listing-card">
      <div class="card-image" aria-hidden="true">
        <span style="font-size:5rem">${l.emoji || '📦'}</span>
        ${l.featured ? '<span class="badge featured">Featured</span>' : ''}
      </div>
      <div class="card-body">
        <h3>${l.title}</h3>
        <div class="card-meta">${metaLine}</div>
        <div class="card-price">${priceLabel(l.price)}</div>
        ${footerHtml || ''}
      </div>
    </article>
  `;
}

function emptyState(emoji, title, body, cta) {
  return `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="emoji">${emoji}</div>
      <h3>${title}</h3>
      <p>${body}</p>
      ${cta || ''}
    </div>`;
}

/* ---------- Renderers ---------- */

function renderListings() {
  const mine = Store.myListings();
  document.getElementById('count-listings').textContent = mine.length;
  const grid = document.getElementById('my-listings');
  if (mine.length === 0) {
    grid.innerHTML = emptyState('🏷️', "You're not selling anything yet",
      'List a horse, tack, trailer, or gear to reach verified local buyers.',
      '<a href="marketplace.html" class="btn btn-primary btn-sm">List an Item</a>');
    return;
  }
  grid.innerHTML = mine.map(l => miniCard(l, `
    <div class="card-actions">
      <span class="chip">${l.verified ? '✓ Verified Seller' : 'Unverified'}</span>
      <button class="btn btn-ghost btn-sm" data-remove="${l.id}">Remove</button>
    </div>`)).join('');
  grid.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Remove this listing? This cannot be undone.')) {
        Store.removeListing(btn.dataset.remove);
        renderAll();
      }
    });
  });
}

function renderSaved() {
  const favs = Store.favorites();
  document.getElementById('count-saved').textContent = favs.length;
  const grid = document.getElementById('my-saved');
  const items = favs.map(findListing).filter(Boolean);
  if (items.length === 0) {
    grid.innerHTML = emptyState('🤍', 'No saved listings yet',
      'Tap the heart on any listing to keep an eye on it here.',
      '<a href="marketplace.html" class="btn btn-primary btn-sm">Browse Marketplace</a>');
    return;
  }
  grid.innerHTML = items.map(l => miniCard(l, `
    <div class="card-actions">
      <span class="muted small">${l.seller || l.city}</span>
      <button class="btn btn-ghost btn-sm" data-unsave="${l.id}">Remove</button>
    </div>`)).join('');
  grid.querySelectorAll('[data-unsave]').forEach(btn => {
    btn.addEventListener('click', () => { Store.toggleFavorite(btn.dataset.unsave); renderAll(); });
  });
}

function renderOffers() {
  const orders = Store.myOrders();
  document.getElementById('count-offers').textContent = orders.length;
  const wrap = document.getElementById('my-offers');
  if (orders.length === 0) {
    wrap.innerHTML = emptyState('🤝', 'No offers sent yet',
      'When you request to buy or make an offer on a listing, it shows up here.',
      '<a href="marketplace.html" class="btn btn-primary btn-sm">Browse Marketplace</a>');
    return;
  }
  wrap.innerHTML = `<div class="dash-list">${orders.map(o => `
    <div class="dash-row">
      <div class="dash-row-main">
        <strong>${o.title}</strong>
        <div class="meta muted small">Offered ${priceLabel(o.offer)}${o.price && o.offer !== o.price ? ` · asking ${priceLabel(o.price)}` : ''} · ${fmtDate(o.date)}</div>
        ${o.message ? `<div class="dash-row-note">“${o.message}”</div>` : ''}
      </div>
      <span class="status-pill">${o.status}</span>
    </div>`).join('')}</div>`;
}

function renderMessages() {
  const msgs = Store.myInquiries();
  document.getElementById('count-messages').textContent = msgs.length;
  const wrap = document.getElementById('my-messages');
  if (msgs.length === 0) {
    wrap.innerHTML = emptyState('✉️', 'No messages yet',
      'Use “Contact” on a listing to ask a seller a question — your messages collect here.',
      '<a href="marketplace.html" class="btn btn-primary btn-sm">Browse Marketplace</a>');
    return;
  }
  wrap.innerHTML = `<div class="dash-list">${msgs.map(m => `
    <div class="dash-row">
      <div class="dash-row-main">
        <strong>Re: ${m.title}</strong>
        <div class="dash-row-note">“${m.message}”</div>
        <div class="meta muted small">Sent ${fmtDate(m.date)}</div>
      </div>
      <span class="status-pill">Sent</span>
    </div>`).join('')}</div>`;
}

function renderAll() {
  renderListings();
  renderOffers();
  renderSaved();
  renderMessages();
}

/* ---------- Tabs ---------- */

function wireTabs() {
  document.querySelectorAll('.dash-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.dash-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.dash-wrap .tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const user = Store.currentUser();
  if (user) {
    document.getElementById('dash-greeting').textContent =
      `Welcome back, ${user.name.split(' ')[0]} — here's your marketplace activity.`;
  }
  renderAll();
  wireTabs();
});
