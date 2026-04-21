/* Community — tab switching + render events/forums/groups */

function eventItem(e) {
  return `
    <div class="event-item">
      <div class="date-box">
        <div class="month">${e.month}</div>
        <div class="day">${e.day}</div>
      </div>
      <div class="event-info">
        <h4>${e.title}</h4>
        <div class="meta">${e.meta}</div>
      </div>
      <div class="stat-pill">${e.category}</div>
    </div>
  `;
}

function forumItem(f) {
  return `
    <div class="forum-item">
      <div class="forum-icon">${f.icon}</div>
      <div class="forum-info">
        <h4>${f.title}</h4>
        <div class="meta">${f.meta}</div>
      </div>
      <a href="#" class="btn btn-ghost">View</a>
    </div>
  `;
}

function groupItem(g) {
  return `
    <div class="group-item">
      <div class="group-icon">${g.icon}</div>
      <div class="group-info">
        <h4>${g.title}</h4>
        <div class="meta">${g.meta}</div>
      </div>
      <a href="#" class="btn btn-outline">Join</a>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('event-list').innerHTML = EVENTS.map(eventItem).join('');
  document.getElementById('forum-list').innerHTML = FORUMS.map(forumItem).join('');
  document.getElementById('group-list').innerHTML = GROUPS.map(groupItem).join('');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');
    });
  });
});
