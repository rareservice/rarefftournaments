/* ==========================================================================
   Rare FF Tournaments - Tournament Manager Component
   ========================================================================== */

const GAME_MODES = [
  {
    id: "br-survival",
    title: "BR Survival",
    tag: "BATTLE ROYALE",
    tagColor: "var(--accent-gold)",
    desc: "Classic Survival Cup • Solo, Duo & Squad",
    image: "https://cdn.discordapp.com/attachments/1539728895660785797/1550251269082316901/content.png?ex=6aada780&is=6aac5600&hm=c043c830eebee51c0bdedd875909a35ab1182861b71b8235f794a47a17ae8782"
  },
  {
    id: "br-per-kill",
    title: "BR PER KILL",
    tag: "BOUNTY HUNTER",
    tagColor: "var(--accent-orange)",
    desc: "Earn Cash Per Elimination • Rush Mode",
    image: "https://cdn.discordapp.com/attachments/1539728895660785797/1550251819920531536/content.png?ex=6aada804&is=6aac5684&hm=f96aebc9d0352ed17cf57d60addc476f40765100527052dbff19eec520a98c95"
  },
  {
    id: "4v4",
    title: "4V4",
    tag: "CLASH SQUAD",
    tagColor: "#c4b5fd",
    desc: "Full Squad Tactical War • Competitive Store",
    image: "https://cdn.discordapp.com/attachments/1539728895660785797/1550252358678745188/content.png?ex=6aada884&is=6aac5704&hm=4cca6762c4e199e1c0d85a68bf94843493a5c0eaa412d1d756ec1b836d926d44"
  },
  {
    id: "2v2",
    title: "2V2",
    tag: "DUO CLASH",
    tagColor: "var(--accent-cyan)",
    desc: "Intense Duo Hardcore Battles • Fast Rounds",
    image: "https://cdn.discordapp.com/attachments/1539728895660785797/1550252629165346886/content.png?ex=6aada8c5&is=6aac5745&hm=3ac159c4bd420b3dc420fc1a3074ba0ea699c5e50f839ea76793c2bc61cf6051"
  }
];

const TournamentsManager = {
  currentFilter: "all",
  searchQuery: "",

  init() {
    this.renderTournaments();
    this.renderMyMatches();
    this.setupFilters();
    this.startCountdownInterval();
  },

  setupFilters() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.dataset.filter || "all";
        this.renderTournaments();
      });
    });

    const searchInput = document.getElementById("tourney-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderTournaments();
      });
    }
  },

  selectMode(modeTitle) {
    UI.toast(`⚔️ ${modeTitle}: Matches will be published soon by the admin team!`, "soon");
  },

  startCountdownInterval() {
    setInterval(() => {
      document.querySelectorAll("[data-countdown]").forEach(el => {
        const target = el.dataset.countdown;
        el.innerText = UI.getCountdownString(target);
      });
    }, 1000);
  },

  renderTournaments() {
    const grid = document.getElementById("tournaments-grid");
    if (!grid) return;

    const all = Store.getTournaments();
    const user = Store.getUser();
    const registeredIds = user.registeredMatchIds || [];

    const filtered = all.filter(item => {
      if (this.currentFilter === "solo" && item.mode !== "Solo") return false;
      if (this.currentFilter === "duo" && item.mode !== "Duo") return false;
      if (this.currentFilter === "squad" && item.mode !== "Squad") return false;
      if (this.currentFilter === "cs" && item.mode !== "Clash Squad") return false;
      if (this.currentFilter === "free" && item.entryFee > 0) return false;

      if (this.searchQuery) {
        const matchTitle = (item.title || "").toLowerCase().includes(this.searchQuery);
        const matchMap = (item.map || "").toLowerCase().includes(this.searchQuery);
        const matchId = (item.id || "").toLowerCase().includes(this.searchQuery);
        if (!matchTitle && !matchMap && !matchId) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 28px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-lg); border: 1px dashed var(--border-color); margin-top: 10px;">
          <h4 style="color: #fff; font-size: 16px; margin-bottom: 6px;">Select a Game Mode Above to View Live Matches</h4>
          <p style="color: var(--text-secondary); font-size: 13px;">Official custom room match slots will be published soon by the admin team.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(t => {
      const isJoined = registeredIds.includes(t.id);
      const isFull = t.joinedSlots >= t.totalSlots;
      const progressPercent = Math.min(100, Math.round((t.joinedSlots / t.totalSlots) * 100));

      let statusBadge = `<span class="badge-status status-upcoming">⏳ Upcoming</span>`;
      if (t.status === "live") {
        statusBadge = `<span class="badge-status status-live">🔴 Live Now</span>`;
      } else if (t.status === "completed") {
        statusBadge = `<span class="badge-status status-completed">✅ Completed</span>`;
      }

      const countdownText = UI.getCountdownString(t.startTime);

      return `
        <div class="tourney-card" data-id="${t.id}">
          <div class="tourney-card-header" style="background-image: url('${t.bgImage || ''}');">
            <div class="tourney-badges">
              <span class="badge-mode">${t.mode} • ${t.map}</span>
              ${statusBadge}
            </div>
            <div class="header-bottom-info">
              <span class="tourney-id-tag">#${t.id}</span>
              <span class="tourney-map-tag">🌐 ${t.server}</span>
            </div>
          </div>

          <div class="tourney-card-body">
            <h3 class="tourney-title">${t.title}</h3>

            <div class="match-financials">
              <div class="fin-item">
                <span class="fin-label">🏆 Total Prize</span>
                <span class="fin-value prize">${Store.formatMoney(t.prizePool)}</span>
              </div>
              <div class="fin-item">
                <span class="fin-label">🎯 Per Kill</span>
                <span class="fin-value kill">${Store.formatMoney(t.perKillReward)}</span>
              </div>
              <div class="fin-item">
                <span class="fin-label">🎟️ Entry Fee</span>
                <span class="fin-value entry">${t.entryFee === 0 ? '<span style="color: var(--accent-green)">FREE</span>' : Store.formatMoney(t.entryFee)}</span>
              </div>
            </div>

            <div class="match-meta-list">
              <div class="meta-row">
                <span class="meta-left">⏰ Kickoff Time:</span>
                <span style="font-weight: 700; color: #fff;">${new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div class="meta-row">
                <span class="meta-left">⏳ Starts In:</span>
                <span class="countdown-box" data-countdown="${t.startTime}">${countdownText}</span>
              </div>
            </div>

            <div class="slots-container">
              <div class="slots-label-row">
                <span style="color: var(--text-secondary);">Registered Players</span>
                <span style="font-weight: 800; color: ${isFull ? 'var(--accent-red)' : 'var(--accent-gold)'};">
                  ${t.joinedSlots}/${t.totalSlots} (${progressPercent}%)
                </span>
              </div>
              <div class="slots-progress-track">
                <div class="slots-progress-fill ${isFull ? 'full' : ''}" style="width: ${progressPercent}%;"></div>
              </div>
            </div>

            <div class="tourney-actions">
              ${isJoined 
                ? `<button class="btn-join joined" onclick="UI.switchView('my-matches')">✓ Registered (View Room)</button>` 
                : isFull 
                  ? `<button class="btn-join" style="background: #334155; color: #94a3b8; cursor: not-allowed;" disabled>Lobby Full</button>` 
                  : `<button class="btn-join" onclick="TournamentsManager.openJoinModal('${t.id}')">⚔️ Join Match</button>`
              }
              <button class="btn-details" onclick="TournamentsManager.openDetailsModal('${t.id}')" title="Rules & Prize Breakdown">ℹ️ Info</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  openDetailsModal(matchId) {
    const t = Store.getTournamentById(matchId);
    if (!t) return;

    const modalBody = document.getElementById("details-modal-content");
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="display: flex; gap: 16px; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
        <div style="font-size: 32px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(245, 158, 11, 0.3);">
          🔥
        </div>
        <div>
          <span style="font-size: 12px; color: var(--accent-gold); font-weight: 700;">MATCH #${t.id} • ${t.mode}</span>
          <h3 style="color: #fff; font-size: 20px;">${t.title}</h3>
          <p style="color: var(--text-secondary); font-size: 13px;">Map: <b>${t.map}</b> | Server: <b>${t.server}</b></p>
        </div>
      </div>

      <div>
        <h4 style="color: #fff; font-size: 15px; margin-bottom: 10px;">🏆 Prize Distribution Breakdown</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; background: rgba(0, 0, 0, 0.3); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div>🥇 1st Place: <b style="color: var(--accent-gold);">${Store.formatMoney(t.prizes?.first || 0)}</b></div>
          <div>🥈 2nd Place: <b style="color: #cbd5e1;">${Store.formatMoney(t.prizes?.second || 0)}</b></div>
          <div>🥉 3rd Place: <b style="color: #cd7f32;">${Store.formatMoney(t.prizes?.third || 0)}</b></div>
          <div>🎯 Per Kill: <b style="color: var(--accent-orange);">${Store.formatMoney(t.perKillReward)}/Kill</b></div>
        </div>
      </div>

      <div>
        <h4 style="color: #fff; font-size: 15px; margin-bottom: 10px;">📜 Custom Room Rules</h4>
        <ul style="list-style: disc; padding-left: 20px; font-size: 13px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 6px;">
          ${(t.rules || []).map(r => `<li>${r}</li>`).join("")}
        </ul>
      </div>

      <div style="background: rgba(245, 158, 11, 0.06); border-left: 3px solid var(--accent-gold); padding: 12px; border-radius: 4px; font-size: 13px; color: #cbd5e1;">
        💡 <b>Room Access Policy:</b> Custom Room ID & Password will unlock 15 minutes before kickoff in your <b>"My Matches"</b> tab.
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
        <button class="btn-secondary" onclick="UI.closeModal('details-modal')">Close</button>
        <button class="btn-primary" onclick="UI.closeModal('details-modal'); TournamentsManager.openJoinModal('${t.id}')">Join Now</button>
      </div>
    `;

    UI.openModal("details-modal");
  },

  openJoinModal(matchId) {
    const t = Store.getTournamentById(matchId);
    if (!t) return;

    const user = Store.getUser();
    const modalContent = document.getElementById("join-modal-content");
    if (!modalContent) return;

    const hasEnoughBalance = user.wallet.totalBalance >= t.entryFee;
    const isTeamMode = t.mode === "Duo" || t.mode === "Squad";

    modalContent.innerHTML = `
      <div>
        <span style="font-size: 12px; color: var(--accent-gold); font-weight: 700;">REGISTER FOR #${t.id}</span>
        <h3 style="color: #fff; font-size: 20px;">${t.title}</h3>
        <p style="color: var(--text-secondary); font-size: 13px;">Mode: <b>${t.mode}</b> | Map: <b>${t.map}</b></p>
      </div>

      <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 12px; color: var(--text-muted); display: block;">Entry Fee Required</span>
          <span style="font-size: 18px; font-weight: 800; color: ${t.entryFee === 0 ? 'var(--accent-green)' : 'var(--accent-gold)'};">
            ${t.entryFee === 0 ? 'FREE ENTRY' : Store.formatMoney(t.entryFee)}
          </span>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 12px; color: var(--text-muted); display: block;">Your Wallet Balance</span>
          <span style="font-size: 18px; font-weight: 800; color: #fff;">${Store.formatMoney(user.wallet.totalBalance)}</span>
        </div>
      </div>

      ${!hasEnoughBalance && t.entryFee > 0 ? `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 12px; border-radius: var(--radius-sm); font-size: 13px; color: #fca5a5;">
          ⚠️ Insufficient funds to join this match.
          <button class="btn-deposit-glow" style="margin-top: 8px; width: 100%; justify-content: center;" onclick="UI.showSoon()">
            💳 Quick Deposit to Wallet
          </button>
        </div>
      ` : ''}

      <form id="join-tourney-form" onsubmit="TournamentsManager.handleJoinSubmit(event, '${t.id}')">
        <div class="form-group">
          <label class="form-label">Player In-Game Name (IGN) *</label>
          <input type="text" class="form-input" id="reg-ign" value="${user.ign || ''}" required placeholder="e.g. RARE_SNIPER" />
        </div>

        <div class="form-group">
          <label class="form-label">Free Fire In-Game UID (Numbers Only) *</label>
          <input type="text" class="form-input" id="reg-ffuid" value="${user.ffUid || ''}" required pattern="[0-9]{8,12}" placeholder="e.g. 2948102941" />
        </div>

        <div class="form-group">
          <label class="form-label">WhatsApp Contact Number *</label>
          <input type="text" class="form-input" id="reg-phone" value="${user.phone || ''}" required placeholder="+92 300 1234567" />
        </div>

        ${isTeamMode ? `
          <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 8px;">
            <h4 style="color: var(--accent-gold); font-size: 14px; margin-bottom: 8px;">👥 Teammates Information</h4>
            <div class="form-group" style="margin-bottom: 8px;">
              <label class="form-label">Teammate 1 (IGN & UID) *</label>
              <input type="text" class="form-input" id="reg-tm1" required placeholder="IGN & Free Fire UID" />
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 14px; font-size: 12px; color: var(--text-secondary); display: flex; align-items: flex-start; gap: 8px;">
          <input type="checkbox" id="reg-agree" required checked style="margin-top: 3px;" />
          <label for="reg-agree">I agree to fair play rules (Mobile devices only, no hacks/configs/emulators).</label>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn-secondary" style="flex: 1;" onclick="UI.closeModal('join-modal')">Cancel</button>
          <button type="submit" class="btn-primary" style="flex: 2; justify-content: center;">
            Confirm Registration
          </button>
        </div>
      </form>
    `;

    UI.openModal("join-modal");
  },

  handleJoinSubmit(e, matchId) {
    e.preventDefault();
    const ign = document.getElementById("reg-ign").value.trim();
    const ffUid = document.getElementById("reg-ffuid").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();

    Store.updateUserProfile({ ign, ffUid, phone });
    const result = Store.registerForTournament(matchId, { ign, ffUid, phone });

    if (result.success) {
      UI.closeModal("join-modal");
      UI.toast(result.message, "success");
      UI.updateHeader();
      this.renderTournaments();
      this.renderMyMatches();
      UI.switchView("my-matches");
    } else {
      UI.toast(result.message, "error");
    }
  },

  renderMyMatches() {
    const container = document.getElementById("my-matches-list");
    if (!container) return;

    const user = Store.getUser();
    const registeredIds = user.registeredMatchIds || [];
    const allTourneys = Store.getTournaments();
    const myMatches = allTourneys.filter(t => registeredIds.includes(t.id));

    if (myMatches.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <div style="font-size: 48px; margin-bottom: 16px;">🎟️</div>
          <h3 style="color: #fff; font-size: 20px; margin-bottom: 8px;">No Registered Matches</h3>
          <p style="color: var(--text-secondary); font-size: 14px; max-width: 480px; margin: 0 auto 20px; line-height: 1.6;">
            You have not registered for any tournaments yet. Join a match from the Arena to get custom Room ID & Password access.
          </p>
          <button class="btn-primary" onclick="UI.switchView('matches')">Explore Tournament Arena</button>
        </div>
      `;
      return;
    }

    container.innerHTML = myMatches.map(t => {
      const startTime = new Date(t.startTime);
      const now = new Date();
      const diffMinutes = Math.floor((startTime - now) / (1000 * 60));
      const isUnlocked = diffMinutes <= 15;

      return `
        <div class="tourney-card" style="margin-bottom: 20px; border-color: rgba(245, 158, 11, 0.3);">
          <div class="tourney-card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <span class="badge-mode">${t.mode} • ${t.map}</span>
                <span style="font-size: 12px; color: var(--accent-gold); font-weight: 700; margin-left: 8px;">MATCH #${t.id}</span>
                <h3 style="color: #fff; font-size: 20px; margin-top: 4px;">${t.title}</h3>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 12px; color: var(--text-muted); display: block;">Match Schedule</span>
                <span style="font-weight: 800; color: #fff;">${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div class="room-credential-box">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: 800; font-size: 13px; color: var(--accent-gold);">🔑 Custom Room Credentials</span>
                <span style="font-size: 12px; color: ${isUnlocked ? 'var(--accent-green)' : 'var(--accent-orange)'}; font-weight: 700;">
                  ${isUnlocked ? '🟢 Active' : '🔒 Unlocks 15m Before Match'}
                </span>
              </div>

              ${isUnlocked ? `
                <div class="room-unlocked">
                  <div class="credential-item">
                    <span style="font-size: 13px; color: var(--text-secondary);">Room ID:</span>
                    <span class="cred-val">${t.roomDetails?.roomId || 'Pending'}</span>
                    <button class="btn-copy-cred" onclick="TournamentsManager.copyText('${t.roomDetails?.roomId || ''}', 'Room ID')">Copy</button>
                  </div>
                  <div class="credential-item">
                    <span style="font-size: 13px; color: var(--text-secondary);">Password:</span>
                    <span class="cred-val">${t.roomDetails?.roomPass || 'Pending'}</span>
                    <button class="btn-copy-cred" onclick="TournamentsManager.copyText('${t.roomDetails?.roomPass || ''}', 'Password')">Copy</button>
                  </div>
                </div>
              ` : `
                <p style="font-size: 13px; color: #cbd5e1;">Credentials will automatically unlock 15 minutes before kickoff.</p>
              `}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
              <span style="font-size: 12px; color: var(--text-muted);">
                Player: <b style="color: #fff;">${user.ign}</b> (UID: ${user.ffUid})
              </span>
              <button class="btn-secondary" style="color: var(--accent-red); font-size: 12px; padding: 6px 12px;" onclick="TournamentsManager.cancelEntry('${t.id}')">
                Cancel Registration
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  copyText(text, label) {
    if (!text) {
      UI.toast("Credentials pending", "info");
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      UI.toast(`${label} copied to clipboard!`, "success");
    }).catch(() => {
      UI.toast(`${label} copied to clipboard!`, "success");
    });
  },

  cancelEntry(matchId) {
    if (confirm("Are you sure you want to cancel your registration?")) {
      const res = Store.cancelRegistration(matchId);
      if (res.success) {
        UI.toast(res.message, "success");
        UI.updateHeader();
        this.renderTournaments();
        this.renderMyMatches();
      } else {
        UI.toast(res.message, "error");
      }
    }
  }
};
```(res.message, "error");
      }
    }
  }
};