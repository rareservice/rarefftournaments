/* ==========================================================================
   Rare FF Tournaments - Main App Orchestrator & Initializer
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  Store.init();
  UI.updateHeader();
  TournamentsManager.init();
  WalletManager.init();
  AuthManager.init();
  renderLeaderboard();
  setupNavigation();
  setupProfileModal();
  setupAdminBridge();

  console.log("Rare FF Tournaments - Platform ready with Firebase Auth integration.");
});

function setupNavigation() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view) {
        UI.switchView(view);
      }
    });
  });

  const mobileToggle = document.getElementById("mobile-nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener("click", () => {
      navLinks.classList.toggle("mobile-open");
    });
  }
}

function renderLeaderboard() {
  const podiumContainer = document.getElementById("lb-podium");
  const tableContainer = document.getElementById("lb-tbody");
  if (!podiumContainer || !tableContainer) return;

  if (LEADERBOARD_DATA.length === 0) {
    podiumContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px 16px;">
        <div style="font-size: 40px; margin-bottom: 10px;">🏆</div>
        <h3 style="color: #fff; font-size: 20px; margin-bottom: 6px;">Season 1 Leaderboard</h3>
        <p style="color: var(--text-secondary); font-size: 14px; max-width: 480px; margin: 0 auto;">
          Rankings and top fraggers will be updated automatically as upcoming tournament matches conclude.
        </p>
      </div>
    `;

    tableContainer.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px 16px; font-size: 14px;">
          No tournament matches recorded yet. The Season 1 leaderboard will open with the first official tournament.
        </td>
      </tr>
    `;
    return;
  }
}

function setupProfileModal() {
  const profileBtn = document.getElementById("btn-user-profile");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      const user = Store.getUser();
      const content = document.getElementById("profile-modal-content");
      if (content) {
        content.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 54px; height: 54px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-gold), var(--accent-orange)); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #000;">
                🎮
              </div>
              <div>
                <h3 style="color: #fff; font-size: 18px;">${user.ign || 'Player'}</h3>
                <p style="color: var(--accent-gold); font-size: 12px; font-family: monospace;">UID: ${user.ffUid || 'Not set'}</p>
                <span style="font-size: 12px; color: var(--text-secondary);">${user.email || 'Email not linked'}</span>
              </div>
            </div>
            <button class="btn-secondary" style="color: var(--accent-red); font-size: 12px; padding: 6px 12px;" onclick="AuthManager.handleSignOut()">
              🚪 Log Out
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0;">
            <div class="hero-stat-box" style="text-align: center;">
              <div class="hero-stat-val">${user.stats.matchesPlayed || 0}</div>
              <div class="hero-stat-lbl">Matches</div>
            </div>
            <div class="hero-stat-box" style="text-align: center;">
              <div class="hero-stat-val text-green">${user.stats.matchesWon || 0}</div>
              <div class="hero-stat-lbl">Victories</div>
            </div>
            <div class="hero-stat-box" style="text-align: center;">
              <div class="hero-stat-val text-orange">${user.stats.totalKills || 0}</div>
              <div class="hero-stat-lbl">Kills</div>
            </div>
          </div>

          <form id="edit-profile-form" onsubmit="handleProfileUpdate(event)">
            <div class="form-group">
              <label class="form-label">Free Fire In-Game Name (IGN) *</label>
              <input type="text" class="form-input" id="profile-ign-input" value="${user.ign || ''}" placeholder="e.g. RARE_SNIPER" required />
            </div>
            <div class="form-group">
              <label class="form-label">Free Fire In-Game UID (Numbers) *</label>
              <input type="text" class="form-input" id="profile-uid-input" value="${user.ffUid || ''}" placeholder="e.g. 2948102941" required />
            </div>
            <div class="form-group">
              <label class="form-label">WhatsApp Contact Number *</label>
              <input type="text" class="form-input" id="profile-phone-input" value="${user.phone || ''}" placeholder="+92 300 1234567" required />
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px;">
              <button type="button" class="btn-secondary" onclick="UI.closeModal('profile-modal')">Close</button>
              <button type="submit" class="btn-primary">Save Profile</button>
            </div>
          </form>
        `;
      }
      UI.openModal("profile-modal");
    });
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const ign = document.getElementById("profile-ign-input").value.trim();
  const ffUid = document.getElementById("profile-uid-input").value.trim();
  const phone = document.getElementById("profile-phone-input").value.trim();

  Store.updateUserProfile({ ign, ffUid, phone });

  UI.toast("Player profile saved!", "success");
  UI.updateHeader();
  UI.closeModal("profile-modal");
}

function setupAdminBridge() {
  const adminBtn = document.getElementById("admin-bridge-btn");
  if (adminBtn) {
    adminBtn.addEventListener("click", () => {
      UI.showSoon();
    });
  }
}