/* =========================================================
   Business Profile Page
   URL: pages/business.html?id=N
   ========================================================= */

function getBusinessId() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('id'), 10);
}

function starsFor(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function renderHeroImage(b) {
  if (!b.image) {
    return `<div class="profile-hero-image"><span style="font-size:9rem">${b.emoji}</span></div>`;
  }
  const ext = b.image.split('.').pop().toLowerCase();
  const logoLike = ['svg', 'png', 'gif'].includes(ext);
  const src = '../' + b.image;
  return `
    <div class="profile-hero-image${logoLike ? ' logo-mode' : ''}">
      <img src="${src}" alt="${b.name}" onerror="this.outerHTML='<span style=\\'font-size:9rem\\'>${b.emoji}</span>'" />
    </div>
  `;
}

function computeStats(b, userReviews) {
  const userRatings = userReviews.map(r => r.rating).filter(Number.isFinite);
  const totalCount = b.reviews + userRatings.length;
  if (userRatings.length === 0) return { rating: b.rating, count: totalCount };
  const baseSum = b.rating * b.reviews;
  const userSum = userRatings.reduce((a, v) => a + v, 0);
  return { rating: (baseSum + userSum) / totalCount, count: totalCount };
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function reviewItem(businessId, r) {
  const liked = Store.hasLiked(businessId, r.id);
  return `
    <div class="review-item">
      <div class="review-head">
        <div>
          <strong>${r.author || 'Anonymous Rider'}</strong>
          <span class="muted small"> · ${formatDate(r.date)}</span>
        </div>
        <div class="review-stars">${starsFor(r.rating)} <span class="muted small">${r.rating.toFixed(1)}</span></div>
      </div>
      <p class="review-body">${r.comment}</p>
      <div class="review-actions">
        <button class="btn-like ${liked ? 'liked' : ''}" data-id="${r.id}" aria-pressed="${liked}">
          ${liked ? '♥' : '♡'} <span class="count">${r.likes || 0}</span>
        </button>
      </div>
    </div>
  `;
}

function render(b) {
  const root = document.getElementById('profile-root');
  if (!b) {
    root.innerHTML = `
      <div class="empty-state" style="padding: 6rem 2rem;">
        <div class="emoji">🔎</div>
        <h3>Business not found</h3>
        <p>The profile you're looking for doesn't exist. <a href="directory.html">Browse the directory</a>.</p>
      </div>`;
    return;
  }

  const userReviews = Store.reviewsFor(b.id);
  const stats = computeStats(b, userReviews);

  root.innerHTML = `
    <section class="profile-hero">
      <div class="container profile-hero-inner">
        ${renderHeroImage(b)}
        <div class="profile-hero-copy">
          <div class="breadcrumb">
            <a href="directory.html">← Back to Directory</a>
          </div>
          <span class="eyebrow">${b.category} · ${b.city}</span>
          <h1>${b.name}</h1>
          <div class="profile-rating">
            <span class="rating-big">${starsFor(stats.rating)}</span>
            <strong>${stats.rating.toFixed(1)}</strong>
            <span class="muted">(${stats.count} reviews)</span>
            ${b.verified ? '<span class="badge verified" style="position:relative;top:auto;left:auto;">✓ Verified</span>' : ''}
          </div>
          <p class="lede">${b.description}</p>
          <div class="profile-actions">
            ${b.url ? `<a href="${b.url}" target="_blank" rel="noopener" class="btn btn-primary">Visit Website ↗</a>` : ''}
            <a href="#reviews" class="btn btn-outline">Write a Review</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container profile-layout">
        <div>
          <h2 class="profile-section-title">Services & Specialties</h2>
          <div class="card-tags" style="gap:0.5rem;">
            ${b.tags.map(t => `<span class="chip" style="font-size:0.85rem; padding:0.4rem 0.8rem;">${t}</span>`).join('')}
          </div>

          <h2 class="profile-section-title" style="margin-top:2.5rem;">About</h2>
          <p>${b.description}</p>

          <h2 class="profile-section-title" id="reviews" style="margin-top:2.5rem;">Reviews</h2>
          <div class="review-form card" style="padding:1.5rem; margin-bottom:1.5rem;">
            <h3 style="font-family:var(--font-body); font-size:1.05rem; font-weight:700; margin:0 0 0.75rem;">Rate this business</h3>
            <div class="star-picker" id="star-picker" aria-label="Rate 1 to 5 stars">
              ${[1,2,3,4,5].map(n => `<button type="button" data-value="${n}" class="star-btn">☆</button>`).join('')}
            </div>
            <input type="text" id="review-author" placeholder="Your name (optional)" class="form-input" />
            <textarea id="review-comment" placeholder="Share your experience…" class="form-input" rows="3"></textarea>
            <button type="button" class="btn btn-primary" id="submit-review">Submit Review</button>
          </div>
          <div id="review-list">${
            userReviews.length === 0
              ? `<p class="muted small">No reviews yet — be the first!</p>`
              : userReviews.map(r => reviewItem(b.id, r)).join('')
          }</div>
        </div>

        <aside>
          <div class="card" style="padding:1.25rem;">
            <h3 style="font-family:var(--font-body); font-size:0.85rem; text-transform:uppercase; letter-spacing:1px; color:var(--ink-500); margin:0 0 0.75rem;">Location</h3>
            <p style="margin:0 0 0.75rem; font-weight:600;">📍 ${b.city}</p>
            <div id="profile-map" style="height:260px; border-radius:10px; overflow:hidden; border:1px solid var(--border);"></div>
            <a href="map.html#b${b.id}" class="link-arrow small" style="display:inline-block; margin-top:0.75rem;">See on full map →</a>
          </div>

          <div class="card" style="padding:1.25rem; margin-top:1rem;">
            <h3 style="font-family:var(--font-body); font-size:0.85rem; text-transform:uppercase; letter-spacing:1px; color:var(--ink-500); margin:0 0 0.75rem;">Contact</h3>
            ${b.url ? `<p style="margin:0 0 0.5rem;"><a href="${b.url}" target="_blank" rel="noopener">${new URL(b.url).hostname.replace('www.','')}</a></p>` : ''}
            <p class="muted small" style="margin:0;">Contact details available to BarnBound members.</p>
          </div>
        </aside>
      </div>
    </section>
  `;

  // Wire up the rating star picker
  let selectedRating = 0;
  const starBtns = document.querySelectorAll('#star-picker .star-btn');
  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.value, 10);
      starBtns.forEach((b2, i) => {
        b2.textContent = i < selectedRating ? '★' : '☆';
        b2.classList.toggle('active', i < selectedRating);
      });
    });
  });

  // Wire submit
  document.getElementById('submit-review').addEventListener('click', () => {
    const comment = document.getElementById('review-comment').value.trim();
    const author = document.getElementById('review-author').value.trim() || 'Anonymous Rider';
    if (selectedRating === 0) {
      alert('Please pick a rating (1-5 stars).');
      return;
    }
    if (!comment) {
      alert('Please share a comment about your experience.');
      return;
    }
    Store.addReview(b.id, { rating: selectedRating, comment, author });
    render(b);
    document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' });
  });

  // Wire likes
  document.querySelectorAll('.btn-like').forEach(btn => {
    btn.addEventListener('click', () => {
      Store.toggleReviewLike(b.id, btn.dataset.id);
      render(b);
      setTimeout(() => document.getElementById('reviews').scrollIntoView({ behavior: 'auto', block: 'start' }), 10);
    });
  });

  // Init map
  if (b.coords && typeof L !== 'undefined') {
    const map = L.map('profile-map', { scrollWheelZoom: false }).setView(b.coords, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    L.marker(b.coords)
      .addTo(map)
      .bindPopup(`<strong>${b.name}</strong><br>${b.city}`)
      .openPopup();
  }

  document.title = `${b.name} — BarnBound`;
}

document.addEventListener('DOMContentLoaded', () => {
  const id = getBusinessId();
  const b = BUSINESSES.find(x => x.id === id);
  render(b);
});
