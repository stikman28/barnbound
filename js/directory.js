/* Directory — filter businesses by category, city, rating */

function cardImageContent(b) {
  if (!b.image) {
    return `<span style="font-size:5rem">${b.emoji}</span>`;
  }
  const ext = b.image.split('.').pop().toLowerCase();
  const logoLike = ['svg', 'png', 'gif'].includes(ext);
  const src = '../' + b.image;
  return `<img src="${src}" alt="${b.name}" loading="lazy" class="${logoLike ? 'contain' : ''}" onerror="this.outerHTML='<span style=\\'font-size:5rem\\'>${b.emoji}</span>'" />`;
}

function businessCard(b) {
  return `
    <a href="business.html?id=${b.id}" class="card-link">
      <article class="card">
        <div class="card-image" aria-hidden="true">
          ${cardImageContent(b)}
          ${b.verified ? '<span class="badge verified">Verified</span>' : ''}
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

const state = {
  category: 'All',
  cities: [],
  minRating: 0,
  search: '',
  sort: 'featured',
};

function apply() {
  let filtered = BUSINESSES.slice();

  if (state.category !== 'All') {
    filtered = filtered.filter(b => b.category === state.category);
  }
  if (state.cities.length > 0) {
    filtered = filtered.filter(b => state.cities.includes(b.city));
  }
  if (state.minRating > 0) {
    filtered = filtered.filter(b => b.rating >= state.minRating);
  }
  if (state.search.trim()) {
    const q = state.search.toLowerCase();
    filtered = filtered.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q)) ||
      b.description.toLowerCase().includes(q)
    );
  }

  if (state.sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  else if (state.sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  else filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  document.getElementById('result-count').textContent = filtered.length;
  const grid = document.getElementById('business-grid');
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="emoji">🔎</div>
        <h3>No businesses match your filters</h3>
        <p>Try loosening your filters or resetting.</p>
      </div>`;
  } else {
    grid.innerHTML = filtered.map(businessCard).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#filter-category input').forEach(el => {
    el.addEventListener('change', () => {
      state.category = el.value;
      apply();
    });
  });

  document.querySelectorAll('#filter-city input').forEach(el => {
    el.addEventListener('change', () => {
      state.cities = [...document.querySelectorAll('#filter-city input:checked')].map(e => e.value);
      apply();
    });
  });

  document.querySelectorAll('#filter-rating input').forEach(el => {
    el.addEventListener('change', () => {
      state.minRating = parseFloat(el.value);
      apply();
    });
  });

  document.getElementById('filter-search').addEventListener('input', e => {
    state.search = e.target.value;
    apply();
  });

  document.getElementById('sort-select').addEventListener('change', e => {
    state.sort = e.target.value;
    apply();
  });

  document.getElementById('filter-reset').addEventListener('click', () => {
    state.category = 'All';
    state.cities = [];
    state.minRating = 0;
    state.search = '';
    state.sort = 'featured';
    document.querySelector('#filter-category input[value="All"]').checked = true;
    document.querySelectorAll('#filter-city input').forEach(el => (el.checked = false));
    document.querySelector('#filter-rating input[value="0"]').checked = true;
    document.getElementById('filter-search').value = '';
    document.getElementById('sort-select').value = 'featured';
    apply();
  });

  apply();
});
