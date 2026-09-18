/* ==========================================================================
   Rare FF Tournaments - Public Tournament Manager
   ========================================================================== */

const GAME_MODES = [
  { id: "br-survival", title: "BR Survival", tag: "BATTLE ROYALE", tagColor: "var(--accent-gold)", desc: "Classic Survival Cup • Solo, Duo & Squad" },
  { id: "br-per-kill", title: "BR PER KILL", tag: "BOUNTY HUNTER", tagColor: "var(--accent-orange)", desc: "Earn Coins Per Elimination • Rush Mode" },
  { id: "4v4", title: "4V4", tag: "CLASH SQUAD", tagColor: "#c4b5fd", desc: "Full Squad Tactical War • Competitive Store" },
  { id: "2v2", title: "2V2", tag: "DUO CLASH", tagColor: "var(--accent-cyan)", desc: "Intense Duo Hardcore Battles • Fast Rounds" }
];

const TournamentsManager = {
  currentModeView: null,
  selectedSlot: null,

  init() {
    Store.listenToTournaments(() => {
      if (this.currentModeView) this.renderModeMatches();
      this.renderMyMatches();
    });
  },

  openModeView(mode) {
    this.currentModeView = mode;
    document.getElementById("arena-home").style.display = "none";
    document.getElementById("arena-mode-details").style.display = "block";
    document.getElementById("public-mode-title").innerHTML = `<span>⚔️</span> ${mode} Matches`;
    this.renderModeMatches();
  },

  closeModeView() {
    this.currentModeView = null;
    document.getElementById("arena-home").style.display = "block";
    document.getElementById("arena-mode-details").style.display = "none";
  },

  renderModeMatches() {
    const grid = document.getElementById("tournaments-grid");
    if (!grid) return;

    const all = Store.getTournaments().filter(t => t.mode === this.currentModeView);
    const user = Store.getUser();
    const registeredIds = user.registeredMatchIds.map(r => r.matchId);

    if (all.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 28px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: var(--radius-lg);">No matches published yet for this mode.</div>`;
      return;
    }

    all.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    grid.innerHTML = all.map(t => {
      const isJoined = registeredIds.includes(t.id);
      const takenCount = (t.takenSlots || []).length;
      const isFull = takenCount >= t.totalSlots;
      const progress = Math.min(100, Math.round((takenCount / t.totalSlots) * 100));
      const countdownText = UI.getCountdownString(t.startTime);
      const hasRoom = t.roomId && t.roomId !== "";

      return `
        <div class="tourney-card">
          <div class="tourney-card-body">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span class="badge-mode">${t.map}</span>
              <span class="badge-status ${hasRoom ? 'status-live' : 'status-upcoming'}">${hasRoom ? 'Live' : 'Upcoming'}</span>
            </div>
            
            <h3 class="tourney-title">${t.title}</h3>
            
            <div class="match-financials" style="margin-top: 14px;">
              <div class="fin-item"><span class="fin-label">🏆 Prize</span><span class="fin-value prize" style="font-size: 14px;">Rs. ${t.prizePool} PKR</span></div>
              <div class="fin-item"><span class="fin-label">🎯 Per Kill</span><span class="fin-value kill" style="font-size: 14px;">Rs. ${t.perKillReward} PKR</span></div>
              <div class="fin-item"><span class="fin-label">🎟️ Entry</span><span class="fin-value entry" style="font-size: 14px;">💎 ${t.entryFee}</span></div>
            </div>

            <div class="match-meta-list" style="margin-top: 14px;">
              <div class="meta-row"><span class="meta-left">⏰ Start Time:</span><span style="font-weight: 700; color: #fff;">${new Date(t.startTime).toLocaleString()}</span></div>
              <div class="meta-row"><span class="meta-left">⏳ Timer:</span><span class="countdown-box" data-countdown="${t.startTime}">${countdownText}</span></div>
            </div>

            <div class="slots-container" style="margin-top: 14px;">
              <div class="slots-label-row">
                <span style="color: var(--text-secondary);">Registered Players</span>
                <span style="font-weight: 800; color: ${isFull ? 'var(--accent-red)' : 'var(--accent-gold)'};">${takenCount}/${t.totalSlots}</span>
              </div>
              <div class="slots-progress-track"><div class="slots-progress-fill ${isFull ? 'full' : ''}" style="width: ${progress}%;"></div></div>
            </div>

            <div class="tourney-actions" style="margin-top: 18px;">
              ${isJoined 
                ? `<button class="btn-join joined" onclick="UI.switchView('my-matches')">✓ Registered</button>` 
                : isFull 
                  ? `<button class="btn-join" style="background: #334155; color: #94a3b8; cursor: not-allowed;" disabled>Lobby Full</button>` 
                  : `<button class="btn-join" onclick="TournamentsManager.openJoinModal('${t.id}')">Check Details & Buy Slots</button>`
              }
            </div>
          </div>
        </div>
      `;
    }).join("");

    setInterval(() => {
      document.querySelectorAll("[data-countdown]").forEach(el => {
        el.innerText = UI.getCountdownString(el.dataset.countdown);
      });
    }, 1000);
  },

  openJoinModal(matchId) {
    const t = Store.getTournamentById(matchId);
    if (!t) return;
    this.selectedSlot = null;

    const user = Store.getUser();
    const hasEnough = user.wallet.totalBalance >= t.entryFee;
    const taken = t.takenSlots || [];

    let slotsHtml = `<div class="slot-grid">`;
    for(let i = 1; i <= t.totalSlots; i++) {
      if (taken.includes(i)) {
        slotsHtml += `<div class="slot-box taken">X</div>`;
      } else {
        slotsHtml += `<div class="slot-box available" id="slot-box-${i}" onclick="TournamentsManager.selectSlot(${i})">${i}</div>`;
      }
    }
    slotsHtml += `</div>`;

    document.getElementById("join-modal-content").innerHTML = `
      <div>
        <h3 style="color: #fff; font-size: 20px;">${t.title}</h3>
        <p style="color: var(--text-secondary); font-size: 13px;">Map: <b>${t.map}</b></p>
      </div>

      <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
        <div><span style="font-size: 12px; color: var(--text-muted); display: block;">Entry Fee</span><span style="font-size: 18px; font-weight: 800; color: var(--accent-gold);">💎 ${t.entryFee}</span></div>
        <div style="text-align: right;"><span style="font-size: 12px; color: var(--text-muted); display: block;">Your Balance</span><span style="font-size: 18px; font-weight: 800; color: #fff;">💎 ${user.wallet.totalBalance}</span></div>
      </div>

      ${!hasEnough ? `<div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 12px; border-radius: var(--radius-sm); font-size: 13px; color: #fca5a5; margin-top: 10px;">⚠️ Insufficient Coins. <button type="button" class="btn-deposit-glow" style="margin-top: 8px; width: 100%; justify-content: center;" onclick="UI.closeModal('join-modal'); UI.openModal('wallet-modal'); WalletManager.selectTab('deposit');">Deposit Coins</button></div>` : ''}

      <div style="margin-top: 16px;">
        <h4 style="color: #fff; font-size: 14px; margin-bottom: 8px;">1. Select Your Slot Number</h4>
        ${slotsHtml}
      </div>

      <form id="join-tourney-form" onsubmit="TournamentsManager.handleJoinSubmit(event, '${t.id}')">
        <h4 style="color: #fff; font-size: 14px; margin: 16px 0 8px;">2. Enter Player Details</h4>
        <div class="form-group"><input type="text" class="form-input" id="reg-ign" value="${user.ign || ''}" required placeholder="In-Game Name (IGN)" /></div>
        <div class="form-group" style="margin-top: 10px;"><input type="text" class="form-input" id="reg-ffuid" value="${user.ffUid || ''}" required placeholder="Free Fire UID (Numbers)" /></div>
        <div class="form-group" style="margin-top: 10px;"><input type="text" class="form-input" id="reg-phone" value="${user.phone || ''}" required placeholder="WhatsApp Number" /></div>
        
        <div style="background: rgba(245, 158, 11, 0.06); border-left: 3px solid var(--accent-gold); padding: 12px; border-radius: 4px; font-size: 13px; color: #cbd5e1; margin-top: 16px;">
          💡 <b>Room Details:</b> Room ID & Room Password Will be Shared Soon in your "My Matches" tab!
        </div>

        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 16px; justify-content: center;" ${!hasEnough ? 'disabled' : ''}>Confirm & Pay 💎 ${t.entryFee}</button>
      </form>
    `;
    UI.openModal("join-modal");
  },

  selectSlot(slotNum) {
    this.selectedSlot = slotNum;
    document.querySelectorAll(".slot-box.available").forEach(box => box.classList.remove("selected"));
    document.getElementById(`slot-box-${slotNum}`).classList.add("selected");
  },

  async handleJoinSubmit(e, matchId) {
    e.preventDefault();
    if (!this.selectedSlot) {
      UI.toast("Please select an available slot number first!", "error");
      return;
    }

    const ign = document.getElementById("reg-ign").value.trim();
    const ffUid = document.getElementById("reg-ffuid").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();

    Store.updateUserProfile({ ign, ffUid, phone });
    const result = await Store.registerForTournament(matchId, this.selectedSlot, { ign, ffUid, phone });

    if (result.success) {
      UI.closeModal("join-modal");
      UI.toast(result.message, "success");
      UI.updateHeader();
      if (this.currentModeView) this.renderModeMatches();
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
    const all = Store.getTournaments();
    
    const myMatchObjects = [];
    user.registeredMatchIds.forEach(reg => {
      const match = all.find(t => t.id === reg.matchId);
      if (match) myMatchObjects.push({ match, slot: reg.slot });
    });

    if (myMatchObjects.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);"><div style="font-size: 48px; margin-bottom: 16px;">🎟️</div><h3 style="color: #fff; font-size: 20px; margin-bottom: 8px;">No Registered Matches</h3><p style="color: var(--text-secondary); font-size: 14px; max-width: 480px; margin: 0 auto 20px; line-height: 1.6;">You have not registered for any tournaments yet. Join a match from the Arena.</p><button class="btn-primary" onclick="UI.switchView('matches')">Explore Tournament Arena</button></div>`;
      return;
    }

    container.innerHTML = myMatchObjects.map(obj => {
      const t = obj.match;
      const hasRoom = t.roomId && t.roomId !== "";

      return `
        <div class="tourney-card" style="margin-bottom: 20px; border-color: rgba(245, 158, 11, 0.3);">
          <div class="tourney-card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <span class="badge-mode">${t.map}</span>
                <span style="font-size: 12px; color: var(--accent-gold); font-weight: 700; margin-left: 8px;">SLOT #${obj.slot}</span>
                <h3 style="color: #fff; font-size: 20px; margin-top: 4px;">${t.title}</h3>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 12px; color: var(--text-muted); display: block;">Match Schedule</span>
                <span style="font-weight: 800; color: #fff;">${new Date(t.startTime).toLocaleString()}</span>
              </div>
            </div>

            <div class="room-credential-box">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: 800; font-size: 13px; color: var(--accent-gold);">🔑 Custom Room Credentials</span>
                <span style="font-size: 12px; color: ${hasRoom ? 'var(--accent-green)' : 'var(--accent-orange)'}; font-weight: 700;">
                  ${hasRoom ? '🟢 Active' : '🔒 Pending'}
                </span>
              </div>

              ${hasRoom ? `
                <div class="room-unlocked">
                  <div class="credential-item"><span style="font-size: 13px; color: var(--text-secondary);">Room ID:</span><span class="cred-val">${t.roomId}</span><button class="btn-copy-cred" onclick="UI.copyText('${t.roomId}', 'Room ID', this)">Copy</button></div>
                  <div class="credential-item"><span style="font-size: 13px; color: var(--text-secondary);">Password:</span><span class="cred-val">${t.roomPass}</span><button class="btn-copy-cred" onclick="UI.copyText('${t.roomPass}', 'Password', this)">Copy</button></div>
                </div>
              ` : `
                <p style="font-size: 13px; color: #cbd5e1;">Room ID & Room Password Will be Shared Soon!</p>
              `}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
              <span style="font-size: 12px; color: var(--text-muted);">Player: <b style="color: #fff;">${user.ign}</b> (UID: ${user.ffUid})</span>
              <button class="btn-secondary" style="color: var(--accent-red); font-size: 12px; padding: 6px 12px;" onclick="TournamentsManager.cancelEntry('${t.id}')">Cancel Registration</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  async cancelEntry(matchId) {
    if (confirm("Are you sure you want to cancel your slot registration?")) {
      const res = await Store.cancelRegistration(matchId);
      if (res.success) {
        UI.toast(res.message, "success");
        UI.updateHeader();
        if (this.currentModeView) this.renderModeMatches();
        this.renderMyMatches();
      } else {
        UI.toast(res.message, "error");
      }
    }
  }
};