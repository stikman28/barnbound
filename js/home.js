/* Home page — render featured businesses + listings */

function businessCard(b) {
  return `
    <article class="card">
      <div class="card-image" aria-hidden="true">
        <span style="font-size:5rem">${b.emoji}</span>
        ${b.verified ? '<span class="badge verified">Verified</span>' : ''}
      </div>
      <div class="card-body">
        <h3>${b.name}</h3>
        <div class="card-meta">${b.category} · ${b.city}</div>
        <div class="card-tags">${b.tags.map(t => `<span class="chip">${t}</span>`).join('')}</div>
        <div class="card-footer">
          <span class="rating">★ ${b.rating.toFixed(1)} <span class="count">(${b.reviews})</span></span>
          <a href="#" class="link-arrow small">View →</a>
        </div>
      </div>
    </article>
  `;
}

function listingCard(l) {
  const priceLabel = l.price >= 1000
    ? `$${l.price.toLocaleString()}`
    : `$${l.price}`;
  return `
    <article class="card">
      <div class="card-image" aria-hidden="true">
        <span style="font-size:5rem">${l.emoji}</span>
        ${l.featured ? '<span class="badge featured">Featured</span>' : ''}
      </div>
      <div class="card-body">
        <h3>${l.title}</h3>
        <div class="card-meta">${l.type === 'Horse' ? `${l.discipline} · ${l.city}` : `${l.category} · ${l.city}`}</div>
        <div class="card-price">${priceLabel}</div>
        <div class="card-footer">
          <span class="chip">${l.verified ? '✓ Verified Seller' : 'Unverified'}</span>
          <a href="#" class="link-arrow small">View →</a>
        </div>
      </div>
    </article>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const bizWrap = document.getElementById('featured-businesses');
  if (bizWrap) {
    const featured = BUSINESSES.filter(b => b.featured).slice(0, 4);
    bizWrap.innerHTML = featured.map(businessCard).join('');
  }

  const listWrap = document.getElementById('featured-listings');
  if (listWrap) {
    const featured = LISTINGS.filter(l => l.featured).slice(0, 4);
    listWrap.innerHTML = featured.map(listingCard).join('');
  }
});
