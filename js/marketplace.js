/* Marketplace — filter, sort, render listings */

function listingCard(l) {
  const priceLabel = l.price >= 1000
    ? `$${l.price.toLocaleString()}`
    : `$${l.price}`;
  const metaLine = l.type === 'Horse'
    ? `${l.breed} · ${l.discipline} · ${l.age}yr · ${l.city}`
    : `${l.category} · ${l.city}`;
  return `
    <article class="card">
      <div class="card-image" aria-hidden="true">
        <span style="font-size:5rem">${l.emoji}</span>
        ${l.featured ? '<span class="badge featured">Featured</span>' : ''}
      </div>
      <div class="card-body">
        <h3>${l.title}</h3>
        <div class="card-meta">${metaLine}</div>
        <p class="small muted" style="margin:0 0 0.5rem;">${l.description}</p>
        <div class="card-price">${priceLabel}</div>
        <div class="card-footer">
          <span class="chip">${l.verified ? '✓ Verified Seller' : 'Unverified'}</span>
          <a href="#" class="link-arrow small">Contact →</a>
        </div>
      </div>
    </article>
  `;
}

const state = {
  types: ['Horse', 'Tack', 'Equipment', 'Trailer', 'Clothing', 'Other'],
  disciplines: [],
  maxPrice: 30000,
  verifiedOnly: false,
  sort: 'featured',
};

function apply() {
  let filtered = LISTINGS.filter(l => state.types.includes(l.type));

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

document.addEventListener('DOMContentLoaded', () => {
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

  apply();
});
