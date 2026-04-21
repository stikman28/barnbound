/* Home page — render featured businesses + listings */

function cardImageContent(b) {
  if (!b.image) {
    return `<span style="font-size:5rem">${b.emoji}</span>`;
  }
  const ext = b.image.split('.').pop().toLowerCase();
  const logoLike = ['svg', 'png', 'gif'].includes(ext);
  return `<img src="${b.image}" alt="${b.name}" loading="lazy" class="${logoLike ? 'contain' : ''}" onerror="this.outerHTML='<span style=\\'font-size:5rem\\'>${b.emoji}</span>'" />`;
}

function businessCard(b) {
  return `
    <a href="pages/business.html?id=${b.id}" class="card-link">
      <article class="card">
        <div class="card-image" aria-hidden="true">
          ${cardImageContent(b)}
          <span class="badge featured">Launch Partner</span>
        </div>
        <div class="card-body">
          <h3>${b.name}</h3>
          <div class="card-meta">${b.category} · ${b.city}</div>
          <p class="small muted" style="margin:0 0 0.5rem;">${b.description}</p>
          <div class="card-tags">${b.tags.map(t => `<span class="chip">${t}</span>`).join('')}</div>
          <div class="card-footer">
            <span class="rating">★ ${b.rating.toFixed(1)} <span class="count">(${b.reviews})</span></span>
            <span class="link-arrow small">View Profile →</span>
          </div>
        </div>
      </article>
    </a>
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
    bizWrap.innerHTML = BUSINESSES.filter(b => b.featured).map(businessCard).join('');
  }

  const listWrap = document.getElementById('featured-listings');
  if (listWrap) {
    const featured = LISTINGS.filter(l => l.featured).slice(0, 4);
    listWrap.innerHTML = featured.map(listingCard).join('');
  }
});
