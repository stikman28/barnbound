/* =========================================================
   Map Page — Northern Colorado Front Range
   Shows businesses, events, and user-posted trail rides.
   ========================================================= */

const FRONT_RANGE_CENTER = [40.45, -105.05];
const FRONT_RANGE_ZOOM = 10;

function pinIcon(variant) {
  return L.divIcon({
    className: 'custom-pin-wrap',
    html: `<div class="custom-pin ${variant}">${variant === 'business' ? '' : variant === 'event' ? '★' : '🏇'}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

const layers = {
  business: L.layerGroup(),
  event: L.layerGroup(),
  trail: L.layerGroup(),
};

let map;

function init() {
  map = L.map('main-map').setView(FRONT_RANGE_CENTER, FRONT_RANGE_ZOOM);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  drawBusinesses();
  drawEvents();
  drawTrails();

  layers.business.addTo(map);
  layers.event.addTo(map);
  layers.trail.addTo(map);

  wireFilters();
  wireModal();
  updateTrailList();

  // Deep-link support: map.html#b3 centers on business id 3
  const hash = window.location.hash;
  if (hash && hash.startsWith('#b')) {
    const id = parseInt(hash.slice(2), 10);
    const b = BUSINESSES.find(x => x.id === id);
    if (b && b.coords) map.setView(b.coords, 14);
  }
}

function drawBusinesses() {
  layers.business.clearLayers();
  BUSINESSES.filter(b => b.coords).forEach(b => {
    const marker = L.marker(b.coords, { icon: pinIcon('business') });
    const pop = `
      <div style="min-width:220px;">
        <strong style="font-size:1.05rem;">${b.name}</strong><br>
        <span style="color:#666; font-size:0.85rem;">${b.category} · ${b.city}</span>
        <p style="margin:0.5rem 0; font-size:0.9rem;">${b.description.slice(0, 120)}…</p>
        <a href="business.html?id=${b.id}" style="font-weight:600;">View profile →</a>
      </div>`;
    marker.bindPopup(pop);
    marker.addTo(layers.business);
  });
  document.getElementById('count-businesses').textContent = BUSINESSES.filter(b => b.coords).length;
}

function drawEvents() {
  layers.event.clearLayers();
  EVENTS.filter(e => e.coords).forEach(e => {
    const marker = L.marker(e.coords, { icon: pinIcon('event') });
    marker.bindPopup(`
      <div style="min-width:200px;">
        <strong>📅 ${e.title}</strong><br>
        <span style="color:#666; font-size:0.85rem;">${e.month} ${e.day} · ${e.category}</span>
        <p style="margin:0.5rem 0 0; font-size:0.9rem;">${e.meta}</p>
      </div>`);
    marker.addTo(layers.event);
  });
  document.getElementById('count-events').textContent = EVENTS.filter(e => e.coords).length;
}

function drawTrails() {
  layers.trail.clearLayers();
  const rides = Store.trailRides();
  rides.forEach(r => {
    const marker = L.marker([r.lat, r.lng], { icon: pinIcon('trail') });
    marker.bindPopup(`
      <div style="min-width:220px;">
        <strong>🏇 ${r.title}</strong><br>
        <span style="color:#666; font-size:0.85rem;">${r.date || ''} ${r.time || ''}</span>
        <p style="margin:0.5rem 0 0.25rem; font-size:0.9rem;">📍 ${r.location}</p>
        ${r.notes ? `<p style="margin:0 0 0.5rem; font-size:0.85rem; color:#555;">${r.notes}</p>` : ''}
        <div style="font-size:0.8rem; color:#666;">Posted by ${r.author || 'Anonymous'}</div>
        <button onclick="removeTrail('${r.id}')" style="margin-top:0.5rem; background:transparent; border:1px solid #ccc; padding:0.25rem 0.5rem; border-radius:4px; cursor:pointer; font-size:0.8rem;">Remove</button>
      </div>`);
    marker.addTo(layers.trail);
  });
  document.getElementById('count-trails').textContent = rides.length;
}

function updateTrailList() {
  const rides = Store.trailRides();
  const list = document.getElementById('trail-list');
  if (rides.length === 0) {
    list.innerHTML = '<p class="muted small">No trail rides posted yet. Be the first!</p>';
    return;
  }
  list.innerHTML = rides.slice(0, 8).map(r => `
    <div style="padding:0.6rem 0; border-bottom:1px solid var(--cream-200);">
      <strong style="font-size:0.9rem;">${r.title}</strong><br>
      <span class="muted small">${r.date || ''} · ${r.location}</span>
    </div>
  `).join('');
}

window.removeTrail = function(id) {
  Store.removeTrailRide(id);
  drawTrails();
  updateTrailList();
};

function wireFilters() {
  document.getElementById('toggle-business').addEventListener('change', (e) => {
    e.target.checked ? layers.business.addTo(map) : map.removeLayer(layers.business);
  });
  document.getElementById('toggle-event').addEventListener('change', (e) => {
    e.target.checked ? layers.event.addTo(map) : map.removeLayer(layers.event);
  });
  document.getElementById('toggle-trail').addEventListener('change', (e) => {
    e.target.checked ? layers.trail.addTo(map) : map.removeLayer(layers.trail);
  });
}

function wireModal() {
  const backdrop = document.getElementById('modal-trail');
  document.getElementById('btn-post-trail').addEventListener('click', () => {
    backdrop.classList.remove('hidden');
  });
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => backdrop.classList.add('hidden'));
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.classList.add('hidden');
  });

  document.getElementById('save-trail').addEventListener('click', () => {
    const title = document.getElementById('trail-title').value.trim();
    const sel = document.getElementById('trail-location');
    const opt = sel.options[sel.selectedIndex];
    const location = opt.text;
    const lat = parseFloat(opt.dataset.lat);
    const lng = parseFloat(opt.dataset.lng);
    const date = document.getElementById('trail-date').value;
    const time = document.getElementById('trail-time').value;
    const notes = document.getElementById('trail-notes').value.trim();
    const author = document.getElementById('trail-author').value.trim() || 'Anonymous Rider';

    if (!title) { alert('Please give your ride a title.'); return; }

    Store.addTrailRide({ title, location, lat, lng, date, time, notes, author });
    backdrop.classList.add('hidden');
    ['trail-title','trail-date','trail-time','trail-notes','trail-author'].forEach(id => {
      document.getElementById(id).value = '';
    });
    drawTrails();
    updateTrailList();
    map.setView([lat, lng], 12);
  });
}

document.addEventListener('DOMContentLoaded', init);
