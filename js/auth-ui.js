/* =========================================================
   Auth header UI — swaps Sign In / Join Free buttons for a
   user menu when the visitor is logged in. Runs on every page.
   Requires store.js to be loaded first.
   ========================================================= */

(function() {
  function renderHeaderCTA(pathPrefix) {
    const headerCta = document.querySelector('.header-cta');
    if (!headerCta) return;

    const user = Store.currentUser();

    if (user) {
      const initial = (user.name[0] || 'U').toUpperCase();
      headerCta.innerHTML = `
        <div class="user-menu" id="user-menu">
          <button class="user-chip" id="user-chip" aria-haspopup="true" aria-expanded="false">
            <span class="user-avatar">${initial}</span>
            <span class="user-name">${user.name.split(' ')[0]}</span>
            <span class="caret">▾</span>
          </button>
          <div class="user-dropdown hidden" id="user-dropdown" role="menu">
            <div class="user-dropdown-head">
              <div class="user-avatar big">${initial}</div>
              <div>
                <strong>${user.name}</strong>
                <span class="muted small">${user.email}</span>
              </div>
            </div>
            <div class="user-dropdown-body">
              <span class="chip">${user.role || 'Rider'}</span>
              ${user.location ? `<span class="chip">📍 ${user.location}</span>` : ''}
            </div>
            <a href="${pathPrefix}pages/community.html" class="user-dropdown-item">My Groups</a>
            <button type="button" class="user-dropdown-item danger" id="sign-out-btn">Sign Out</button>
          </div>
        </div>
      `;

      const chip = document.getElementById('user-chip');
      const dropdown = document.getElementById('user-dropdown');
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
        chip.setAttribute('aria-expanded', !dropdown.classList.contains('hidden'));
      });
      document.addEventListener('click', () => dropdown.classList.add('hidden'));
      dropdown.addEventListener('click', (e) => e.stopPropagation());

      document.getElementById('sign-out-btn').addEventListener('click', () => {
        Store.signOut();
        window.location.reload();
      });
    } else {
      headerCta.innerHTML = `
        <a href="${pathPrefix}pages/signin.html" class="btn btn-ghost">Sign In</a>
        <a href="${pathPrefix}pages/signup.html" class="btn btn-primary">Join Free</a>
      `;
    }
  }

  // Detect if we're at the site root or inside /pages/
  function detectPrefix() {
    const path = window.location.pathname;
    // If the path ends with pages/<something>.html, we're inside /pages/
    if (/\/pages\//.test(path)) return '../';
    return '';
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderHeaderCTA(detectPrefix());
  });
})();
