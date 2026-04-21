/* =========================================================
   Community — interactive tabs with join, post, and My Groups.
   Persists user-created content in localStorage (see store.js).
   ========================================================= */

/* ---------- Item renderers ---------- */

function eventItem(e) {
  const joined = Store.isJoinedEvent(e.id);
  return `
    <div class="event-item">
      <div class="date-box">
        <div class="month">${e.month}</div>
        <div class="day">${e.day}</div>
      </div>
      <div class="event-info">
        <h4>${e.title} ${e.userCreated ? '<span class="chip" style="font-size:0.7rem;">Community post</span>' : ''}</h4>
        <div class="meta">${e.meta}</div>
      </div>
      <div style="display:flex; gap:0.5rem; align-items:center;">
        <span class="stat-pill">${e.category}</span>
        <button class="join-btn ${joined ? 'joined' : ''}" data-type="event" data-id="${e.id}">
          ${joined ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  `;
}

function forumItem(f) {
  const joined = Store.isJoinedThread(f.id);
  return `
    <div class="forum-item">
      <div class="forum-icon">${f.icon}</div>
      <div class="forum-info">
        <h4>${f.title} ${f.userCreated ? '<span class="chip" style="font-size:0.7rem;">Community post</span>' : ''}</h4>
        <div class="meta">${f.meta}</div>
      </div>
      <button class="join-btn ${joined ? 'joined' : ''}" data-type="thread" data-id="${f.id}">
        ${joined ? 'Following' : 'Follow'}
      </button>
    </div>
  `;
}

function groupItem(g) {
  const joined = Store.isJoinedGroup(g.id);
  return `
    <div class="group-item">
      <div class="group-icon">${g.icon}</div>
      <div class="group-info">
        <h4>${g.title} ${g.userCreated ? '<span class="chip" style="font-size:0.7rem;">Community created</span>' : ''}</h4>
        <div class="meta">${g.meta}</div>
      </div>
      <button class="join-btn ${joined ? 'joined' : ''}" data-type="group" data-id="${g.id}">
        ${joined ? 'Joined' : 'Join'}
      </button>
    </div>
  `;
}

/* ---------- Combined lists (built-in + user-created) ---------- */

function allEvents() { return [...Store.userEvents(), ...EVENTS]; }
function allForums() { return [...Store.userThreads(), ...FORUMS]; }
function allGroups() { return [...Store.userGroups(), ...GROUPS]; }

/* ---------- My Groups aggregated view ---------- */

function renderMyGroups() {
  const joinedG = Store.joinedGroups();
  const joinedT = Store.joinedThreads();
  const joinedE = Store.joinedEvents();

  const groups = allGroups().filter(g => joinedG.includes(g.id));
  const threads = allForums().filter(t => joinedT.includes(t.id));
  const events = allEvents().filter(e => joinedE.includes(e.id));

  const container = document.getElementById('my-groups-content');
  if (groups.length + threads.length + events.length === 0) {
    container.innerHTML = `
      <div class="my-groups-empty">
        <div style="font-size:3rem;">⭐</div>
        <h3>You haven't saved anything yet</h3>
        <p class="muted">Join groups, follow threads, and save events from the other tabs — they'll collect here so you can get back to them fast.</p>
      </div>`;
    return;
  }

  let html = '';
  if (groups.length > 0) {
    html += `<h3 style="margin-top:1rem;">My Groups (${groups.length})</h3>`;
    html += `<div class="group-list">${groups.map(groupItem).join('')}</div>`;
  }
  if (threads.length > 0) {
    html += `<h3 style="margin-top:2rem;">Following (${threads.length})</h3>`;
    html += `<div class="forum-list">${threads.map(forumItem).join('')}</div>`;
  }
  if (events.length > 0) {
    html += `<h3 style="margin-top:2rem;">Saved Events (${events.length})</h3>`;
    html += `<div class="event-list">${events.map(eventItem).join('')}</div>`;
  }
  container.innerHTML = html;
  wireJoinButtons(container);
}

/* ---------- Main renderers ---------- */

function renderAll() {
  document.getElementById('event-list').innerHTML = allEvents().map(eventItem).join('');
  document.getElementById('forum-list').innerHTML = allForums().map(forumItem).join('');
  document.getElementById('group-list').innerHTML = allGroups().map(groupItem).join('');
  renderMyGroups();
  wireJoinButtons(document);
}

function wireJoinButtons(root) {
  root.querySelectorAll('.join-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const id = btn.dataset.id;
      if (type === 'group') {
        Store.isJoinedGroup(id) ? Store.leaveGroup(id) : Store.joinGroup(id);
      } else if (type === 'thread') {
        Store.isJoinedThread(id) ? Store.leaveThread(id) : Store.joinThread(id);
      } else if (type === 'event') {
        Store.isJoinedEvent(id) ? Store.leaveEvent(id) : Store.joinEvent(id);
      }
      renderAll();
    });
  });
}

/* ---------- Tabs ---------- */

function wireTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');
      if (target === 'mygroups') renderMyGroups();
    });
  });
}

/* ---------- Modals ---------- */

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(el) { el.closest('.modal-backdrop').classList.add('hidden'); }

function wireModals() {
  // Open triggers
  document.getElementById('btn-post-event').addEventListener('click', () => openModal('modal-event'));
  document.getElementById('btn-start-thread').addEventListener('click', () => openModal('modal-thread'));
  document.getElementById('btn-create-group').addEventListener('click', () => openModal('modal-group'));

  // Close buttons
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => closeModal(el));
  });
  // Backdrop click to close
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', (e) => {
      if (e.target === bd) bd.classList.add('hidden');
    });
  });

  // Event save
  document.getElementById('save-event').addEventListener('click', () => {
    const title = document.getElementById('event-title').value.trim();
    const month = document.getElementById('event-month').value;
    const day = parseInt(document.getElementById('event-day').value, 10);
    const meta = document.getElementById('event-meta').value.trim();
    const category = document.getElementById('event-category').value;
    if (!title || !day || !meta) { alert('Please fill in title, day, and details.'); return; }
    Store.addEvent({ month, day, title, meta, category });
    closeModal(document.getElementById('modal-event'));
    document.getElementById('event-title').value = '';
    document.getElementById('event-day').value = '';
    document.getElementById('event-meta').value = '';
    renderAll();
  });

  // Thread save
  document.getElementById('save-thread').addEventListener('click', () => {
    const title = document.getElementById('thread-title').value.trim();
    const category = document.getElementById('thread-category').value;
    const icon = document.getElementById('thread-icon').value;
    if (!title) { alert('Please add a title for your thread.'); return; }
    Store.addThread({ icon, title, meta: `Posted in ${category} · 0 replies · just now` });
    closeModal(document.getElementById('modal-thread'));
    document.getElementById('thread-title').value = '';
    renderAll();
  });

  // Group save
  document.getElementById('save-group').addEventListener('click', () => {
    const title = document.getElementById('group-title').value.trim();
    const meta = document.getElementById('group-meta').value.trim();
    const icon = document.getElementById('group-icon').value;
    if (!title || !meta) { alert('Please fill in name and description.'); return; }
    const group = Store.addGroup({ icon, title, meta: `1 member · ${meta}` });
    Store.joinGroup(group.id);
    closeModal(document.getElementById('modal-group'));
    document.getElementById('group-title').value = '';
    document.getElementById('group-meta').value = '';
    renderAll();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  wireTabs();
  wireModals();
});
