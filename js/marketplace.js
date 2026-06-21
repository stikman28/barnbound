/* Marketplace — browse, sell, contact, make offers, and save listings.
   User-created listings + orders + inquiries persist in localStorage (store.js). */

const TYPE_EMOJI = {
  Horse: '🐎', Tack: '🤠', Equipment: '🛠️', Trailer: '🚛', Clothing: '🧥', Other: '📦',
};

/* ---------- Helpers ---------- */

function priceLabel(price) {
  return price >= 1000 ? `$${price.toLocaleString()}` : `$${price}`;
}

// All listings = the member-posted ones first, then the launch seed data.
function allListings() { return [...Store.userListings(), ...LISTINGS]; }

function findListing(id) { return allListings().find(l => String(l.id) === String(id)); }

function isMine(l) {
  const u = Store.currentUser();
  return !!(l.userCreated && u && l.sellerEmail === u.email);
}

// Gate an action behind sign-in; bounce to sign-in and return here afterward.
function requireAuth() {
  if (Store.currentUser()) return true;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = 'signin.html?next=' + next;
  return false;
}

function toast(msg) {
  let t = document.getElementById('bb-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'bb-toast';
    t.className = 'bb-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 4500);
}

/* ---------- Card ---------- */

function listingCard(l) {
  const metaLine = l.type === 'Horse'
    ? [l.breed, l.discipline, l.age ? `${l.age}yr` : null, l.city].filter(Boolean).join(' · ')
    : `${l.category || l.type} · ${l.city}`;
  const fav = Store.isFavorite(l.id);
  const mine = isMine(l);
  return `
    <article class="card listing-card" data-id="${l.id}">
      <div class="card-image" aria-hidden="true">
        <span style="font-size:5rem">${l.emoji || '📦'}</span>
        ${l.featured ? '<span class="badge featured">Featured</span>' : ''}
        ${mine ? '<span class="badge mine">Your listing</span>' : ''}
        <button class="fav-btn ${fav ? 'on' : ''}" data-action="fav" data-id="${l.id}"
                title="${fav ? 'Saved — click to remove' : 'Save to your watchlist'}"
                aria-label="${fav ? 'Remove from saved' : 'Save listing'}">${fav ? '♥' : '♡'}</button>
      </div>
      <div class="card-body">
        <h3>${l.title}</h3>
        <div class="card-meta">${metaLine}</div>
        <p class="small muted" style="margin:0 0 0.5rem;">${l.description || ''}</p>
        <div class="card-price">${priceLabel(l.price)}</div>
        <div class="card-footer">
          <span class="chip">${l.verified ? '✓ Verified Seller' : 'Unverified'}</span>
          ${l.seller ? `<span class="muted small">${l.seller}</span>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn btn-ghost btn-sm" data-action="contact" data-id="${l.id}">Contact</button>
          <button class="btn btn-primary btn-sm" data-action="buy" data-id="${l.id}">Buy / Offer</button>
        </div>
      </div>
    </article>
  `;
}

/* ---------- Filter / sort state ---------- */

const state = {
  types: ['Horse', 'Tack', 'Equipment', 'Trailer', 'Clothing', 'Other'],
  disciplines: [],
  maxPrice: 30000,
  verifiedOnly: false,
  sort: 'featured',
};

function apply() {
  let filtered = allListings().filter(l => state.types.includes(l.type));

  if (state.disciplines.length > 0) {
    filtered = filtered.filter(l => state.disciplines.includes(l.discipline));
  }
  filtered = filtered.filter(l => l.price <= state.maxPrice);
  if (state.verifiedOnly) filtered = filtered.filter(l => l.verified);

  if (state.sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
  else if (state.sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
  else filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  document.getElementById('result-count').textContent = filtered.length;
  const grid = document.getElementById('listing-grid');
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="emoji">🔎</div>
        <h3>No listings match your filters</h3>
        <p>Try loosening your filters or resetting.</p>
      </div>`;
  } else {
    grid.innerHTML = filtered.map(listingCard).join('');
  }
}

/* ---------- Modal helpers ---------- */

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(el) { el.closest('.modal-backdrop').classList.add('hidden'); }
function val(id) { return document.getElementById(id).value.trim(); }

/* ---------- Sell flow ---------- */

function wireSell() {
  document.getElementById('btn-sell').addEventListener('click', () => {
    if (!requireAuth()) return;
    openModal('modal-sell');
  });

  // Show horse-only fields when type is Horse
  const typeSel = document.getElementById('listing-type');
  const horseFields = document.getElementById('listing-horse-fields');
  const syncHorseFields = () => {
    horseFields.classList.toggle('hidden', typeSel.value !== 'Horse');
  };
  typeSel.addEventListener('change', syncHorseFields);
  syncHorseFields();

  document.getElementById('save-listing').addEventListener('click', () => {
    const type = typeSel.value;
    const title = val('listing-title');
    const price = parseInt(document.getElementById('listing-price').value, 10);
    const city = val('listing-city');
    const description = val('listing-desc');
    if (!title || !price || !city) {
      alert('Please fill in a title, price, and city.');
      return;
    }
    const listing = { type, title, price, city, description, emoji: TYPE_EMOJI[type] || '📦' };
    if (type === 'Horse') {
      listing.breed = val('listing-breed');
      listing.discipline = document.getElementById('listing-discipline').value;
      listing.age = parseInt(document.getElementById('listing-age').value, 10) || null;
    } else {
      listing.category = type;
    }
    Store.addListing(listing);
    closeModal(document.getElementById('modal-sell'));
    ['listing-title', 'listing-price', 'listing-city', 'listing-desc', 'listing-breed', 'listing-age']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    apply();
    toast('Your listing is live. Manage it any time from your dashboard.');
  });
}

/* ---------- Deal flow (Buy / Offer + Contact) ---------- */

let dealMode = 'buy';

function openDeal(listing, mode) {
  if (!requireAuth()) return;
  dealMode = mode;
  document.getElementById('deal-listing-id').value = listing.id;
  document.getElementById('deal-title').textContent = listing.title;
  document.getElementById('deal-sub').textContent = `${listing.city} · ${priceLabel(listing.price)}`;
  const offerRow = document.getElementById('deal-offer-row');
  const heading = document.getElementById('modal-deal-title');
  const submit = document.getElementById('deal-submit');
  const message = document.getElementById('deal-message');
  if (mode === 'buy') {
    heading.textContent = 'Request to Buy / Make an Offer';
    offerRow.classList.remove('hidden');
    document.getElementById('deal-offer').value = listing.price;
    submit.textContent = 'Send Offer';
    message.placeholder = 'Add a note for the seller (optional)…';
  } else {
    heading.textContent = 'Contact Seller';
    offerRow.classList.add('hidden');
    submit.textContent = 'Send Message';
    message.placeholder = 'Ask about availability, condition, location…';
  }
  openModal('modal-deal');
}

function wireDeal() {
  document.getElementById('deal-submit').addEventListener('click', () => {
    const id = document.getElementById('deal-listing-id').value;
    const listing = findListing(id);
    if (!listing) return;
    const message = val('deal-message');
    if (dealMode === 'buy') {
      const offer = parseInt(document.getElementById('deal-offer').value, 10) || listing.price;
      Store.addOrder({ listingId: listing.id, title: listing.title, price: listing.price, offer, message });
      closeModal(document.getElementById('modal-deal'));
      toast(`Offer of ${priceLabel(offer)} sent to ${listing.seller || 'the seller'}. Track it in your dashboard.`);
    } else {
      if (!message) { alert('Please write a short message to the seller.'); return; }
      Store.addInquiry({ listingId: listing.id, title: listing.title, message });
      closeModal(document.getElementById('modal-deal'));
      toast('Message sent. You can follow up from your dashboard.');
    }
    document.getElementById('deal-message').value = '';
  });
}

/* ---------- Grid actions (delegated) ---------- */

function wireGrid() {
  document.getElementById('listing-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const listing = findListing(id);
    if (!listing) return;
    const action = btn.dataset.action;
    if (action === 'fav') {
      Store.toggleFavorite(id);
      apply();
    } else if (action === 'buy') {
      openDeal(listing, 'buy');
    } else if (action === 'contact') {
      openDeal(listing, 'contact');
    }
  });
}

/* ---------- Generic modal close wiring ---------- */

function wireModalClose() {
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => closeModal(el));
  });
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', (e) => { if (e.target === bd) bd.classList.add('hidden'); });
  });
}

/* ---------- Filters ---------- */

function wireFilters() {
  document.querySelectorAll('#filter-type input').forEach(el => {
    el.addEventListener('change', () => {
      state.types = [...document.querySelectorAll('#filter-type input:checked')].map(e => e.value);
      apply();
    });
  });

  document.querySelectorAll('#filter-discipline input').forEach(el => {
    el.addEventListener('change', () => {
      state.disciplines = [...document.querySelectorAll('#filter-discipline input:checked')].map(e => e.value);
      apply();
    });
  });

  const priceInput = document.getElementById('filter-price');
  const priceDisplay = document.getElementById('price-display');
  priceInput.addEventListener('input', () => {
    state.maxPrice = parseInt(priceInput.value, 10);
    priceDisplay.textContent = `$${state.maxPrice.toLocaleString()}`;
    apply();
  });

  document.getElementById('filter-verified').addEventListener('change', e => {
    state.verifiedOnly = e.target.checked;
    apply();
  });

  document.getElementById('sort-select').addEventListener('change', e => {
    state.sort = e.target.value;
    apply();
  });

  document.getElementById('filter-reset').addEventListener('click', () => {
    state.types = ['Horse', 'Tack', 'Equipment', 'Trailer', 'Clothing', 'Other'];
    state.disciplines = [];
    state.maxPrice = 30000;
    state.verifiedOnly = false;
    state.sort = 'featured';
    document.querySelectorAll('#filter-type input').forEach(el => (el.checked = true));
    document.querySelectorAll('#filter-discipline input').forEach(el => (el.checked = false));
    priceInput.value = 30000;
    priceDisplay.textContent = '$30,000';
    document.getElementById('filter-verified').checked = false;
    document.getElementById('sort-select').value = 'featured';
    apply();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wireFilters();
  wireSell();
  wireDeal();
  wireGrid();
  wireModalClose();
  apply();
});
