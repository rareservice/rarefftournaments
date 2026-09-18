/* ==========================================================================
   Rare FF Tournaments - Admin Manager (Bulletproof Edition)
   ========================================================================== */

const AdminManager = {
  currentMode: null,

  init() {
    Store.listenToTournaments(() => {
      if (this.currentMode) this.renderMatches();
    });
    this.renderDeposits();
    this.renderWithdrawals();
    this.renderBookings();
  },

  switchTab(tabId, btnElement) {
    document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
    if (btnElement) btnElement.classList.add("active");

    document.querySelectorAll(".admin-section").forEach(sec => sec.style.display = "none");
    document.getElementById(`tab-${tabId}`).style.display = "block";

    if (tabId === 'deposits') this.renderDeposits();
    if (tabId === 'withdrawals') this.renderWithdrawals();
    if (tabId === 'bookings') this.renderBookings();
  },

  openMode(mode) {
    this.currentMode = mode;
    document.getElementById("admin-home-view").style.display = "none";
    document.getElementById("admin-mode-view").style.display = "block";
    document.getElementById("admin-mode-title").innerText = `⚙️ Manage: ${mode}`;
    this.renderMatches();
  },

  goBack() {
    this.currentMode = null;
    document.getElementById("admin-home-view").style.display = "block";
    document.getElementById("admin-mode-view").style.display = "none";
  },

  openAddMatchModal() {
    document.getElementById("match-title").value = "";
    document.getElementById("match-time").value = "";
    UI.openModal("add-match-modal");
  },

  saveNewMatch() {
    try {
      const title = document.getElementById("match-title").value.trim();
      const map = document.getElementById("match-map").value;
      const time = document.getElementById("match-time").value;
      
      if (!title || !time) {
        alert("Please enter a Title and Start Date!");
        return;
      }

      const slots = parseInt(document.getElementById("match-slots").value) || 48;
      const entry = parseInt(document.getElementById("match-entry").value) || 0;
      const prize = parseInt(document.getElementById("match-prize").value) || 0;
      const kill = parseInt(document.getElementById("match-kill").value) || 0;
      const matchId = `FF-${Math.floor(1000 + Math.random() * 9000)}`;

      const matchData = {
        id: matchId, mode: this.currentMode, title: title, map: map, server: "PK / IND",
        startTime: time, totalSlots: slots, takenSlots: [], entryFee: entry,
        prizePool: prize, perKillReward: kill, status: "upcoming", roomId: "", roomPass: "",
        createdAt: new Date().toISOString()
      };

      const allTournaments = Store.getTournaments();
      allTournaments.unshift(matchData);
      Store.saveTournaments(allTournaments);

      UI.closeModal("add-match-modal");
      UI.toast("Match created successfully!", "success");
      this.renderMatches();

      if (Store.isFirebaseActive()) {
        firebase.firestore().collection("tournaments").doc(matchId).set(matchData)
          .catch(err => console.error(err));
      }
    } catch (error) {
      alert("CRITICAL ERROR: " + error.message);
    }
  },

  openRoomDetailsModal(id) {
    document.getElementById("room-match-id").value = id;
    document.getElementById("room-id-input").value = "";
    document.getElementById("room-pass-input").value = "";
    UI.openModal("room-details-modal");
  },

  publishRoomDetails() {
    try {
      const id = document.getElementById("room-match-id").value;
      const roomId = document.getElementById("room-id-input").value.trim();
      const roomPass = document.getElementById("room-pass-input").value.trim();

      if(!roomId || !roomPass) {
         alert("Please enter both Room ID and Password!"); return;
      }

      const list = Store.getTournaments();
      const idx = list.findIndex(t => t.id === id);
      if (idx !== -1) {
        list[idx].roomId = roomId;
        list[idx].roomPass = roomPass;
        list[idx].status = "live";
        Store.saveTournaments(list);
      }

      UI.closeModal("room-details-modal");
      UI.toast("Room Details Published!", "success");
      this.renderMatches();

      if (Store.isFirebaseActive()) {
        firebase.firestore().collection("tournaments").doc(id).update({
          roomId: roomId, roomPass: roomPass, status: "live"
        }).catch(err => console.error(err));
      }
    } catch (error) {
      alert("CRITICAL ERROR: " + error.message);
    }
  },

  renderMatches() {
    const grid = document.getElementById("admin-matches-grid");
    const all = Store.getTournaments().filter(t => t.mode === this.currentMode);

    if (all.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">No matches created for this mode yet. Click "➕ Add New Match" to begin.</div>`;
      return;
    }

    all.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    grid.innerHTML = all.map(t => {
      const isTimeEnded = new Date(t.startTime) <= new Date();
      const hasRoom = t.roomId && t.roomId !== "";
      
      let actionHtml = "";
      if (!hasRoom && isTimeEnded) {
        actionHtml = `<button class="btn-deposit-glow" style="width: 100%; justify-content: center;" onclick="AdminManager.openRoomDetailsModal('${t.id}')">🔑 Enter Room Details</button>`;
      } else if (hasRoom) {
        actionHtml = `<div style="background: rgba(16, 185, 129, 0.1); border: 1px dashed var(--accent-green); padding: 10px; border-radius: 4px; text-align: center; color: var(--accent-green); font-size: 13px;"><b>Room Published:</b> ${t.roomId}</div>`;
      } else {
        actionHtml = `<div style="text-align: center; font-size: 12px; color: var(--text-muted);">Waiting for timer to end before room creation.</div>`;
      }

      return `
        <div class="tourney-card" style="border-color: rgba(255,255,255,0.1);">
          <div class="tourney-card-body">
            <div style="display: flex; justify-content: space-between;">
              <span class="badge-mode">${t.map}</span>
              <span class="badge-status ${hasRoom ? 'status-live' : 'status-upcoming'}">${hasRoom ? 'Live' : 'Upcoming'}</span>
            </div>
            <h3 class="tourney-title" style="margin-top: 10px;">${t.title}</h3>
            <p style="font-size: 12px; color: var(--text-secondary);">Start: <b>${new Date(t.startTime).toLocaleString()}</b></p>
            <div style="margin: 14px 0; display: flex; flex-direction: column; gap: 6px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between;"><span>Slots: <b>${(t.takenSlots || []).length}/${t.totalSlots}</b></span> <span>Fee: <b>💎 ${t.entryFee}</b></span></div>
              <div style="display: flex; justify-content: space-between;"><span>Prize: <b style="color: var(--accent-gold);">Rs. ${t.prizePool} PKR</b></span> <span>Kill: <b style="color: var(--accent-orange);">Rs. ${t.perKillReward} PKR</b></span></div>
            </div>
            ${actionHtml}
            <button class="btn-secondary" style="width: 100%; margin-top: 10px; justify-content: center; color: var(--accent-red); font-size: 12px; padding: 6px;" onclick="AdminManager.deleteMatch('${t.id}')">🗑️ Delete Match</button>
          </div>
        </div>
      `;
    }).join("");
  },

  deleteMatch(id) {
    if(confirm("Are you sure you want to permanently delete this match?")) {
      let list = Store.getTournaments();
      list = list.filter(t => t.id !== id);
      Store.saveTournaments(list);
      UI.toast("Match deleted.", "success");
      this.renderMatches();

      if (Store.isFirebaseActive()) {
        firebase.firestore().collection("tournaments").doc(id).delete().catch(err => console.error(err));
      }
    }
  },

  renderDeposits() {
    const grid = document.getElementById("admin-deposits-grid");
    const deposits = Store.getAdminData("rare_ff_deposits").filter(d => d.status === "pending");

    if (deposits.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">No pending deposit requests.</div>`;
      return;
    }

    grid.innerHTML = deposits.map(d => `
      <div class="tourney-card" style="border-color: var(--accent-gold);">
        <div class="tourney-card-body">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge-mode" style="background: rgba(245, 158, 11, 0.2); color: var(--accent-gold);">Deposit Proof</span>
            <span style="font-size: 11px; color: var(--text-muted);">${new Date(d.date).toLocaleDateString()}</span>
          </div>
          <h3 style="color: #fff; font-size: 16px; margin-top: 10px;">User: ${d.ign || 'Player'}</h3>
          <p style="font-size: 12px; color: var(--text-secondary);">UID: ${d.uid || 'N/A'}</p>
          
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 4px; margin: 12px 0;">
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">Attached Files:</p>
            ${d.files.map(file => `<div style="font-size: 13px; color: var(--accent-cyan);">📄 ${file}</div>`).join('')}
          </div>

          <div style="display: flex; gap: 10px; margin-top: auto;">
            <button class="btn-deposit-glow" style="flex: 1; padding: 8px; justify-content: center;" onclick="AdminManager.processDeposit('${d.id}', true)">✅ Confirm</button>
            <button class="btn-secondary" style="flex: 1; padding: 8px; justify-content: center; color: var(--accent-red);" onclick="AdminManager.processDeposit('${d.id}', false)">❌ Decline</button>
          </div>
        </div>
      </div>
    `).join("");
  },

  processDeposit(reqId, isApproved) {
    let deposits = Store.getAdminData("rare_ff_deposits");
    let reqIndex = deposits.findIndex(d => d.id === reqId);
    if(reqIndex === -1) return;

    if (isApproved) {
      let coinsStr = prompt(`Payment Confirmed. How many Coins (💎) should be added to ${deposits[reqIndex].ign}'s wallet?`);
      let coins = parseInt(coinsStr);
      if (isNaN(coins) || coins <= 0) {
        alert("Invalid coin amount entered. Cancelled.");
        return;
      }
      deposits[reqIndex].status = "approved";
      deposits[reqIndex].coinsAdded = coins;
      
      Store.simulateUserWalletAddition(coins);
      UI.toast(`Successfully credited 💎 ${coins} to player!`, "success");
    } else {
      deposits[reqIndex].status = "declined";
      UI.toast("Deposit declined.", "info");
    }

    Store.saveAdminData("rare_ff_deposits", deposits);
    this.renderDeposits();
  },

  renderWithdrawals() {
    const grid = document.getElementById("admin-withdrawals-grid");
    const withdraws = Store.getAdminData("rare_ff_withdrawals").filter(w => w.status === "pending");

    if (withdraws.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">No pending withdrawal requests.</div>`;
      return;
    }

    grid.innerHTML = withdraws.map(w => `
      <div class="tourney-card" style="border-color: var(--accent-green);">
        <div class="tourney-card-body">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge-mode" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-green);">Withdrawal</span>
            <span style="font-size: 11px; color: var(--text-muted);">${new Date(w.date).toLocaleDateString()}</span>
          </div>
          <h3 style="color: var(--accent-gold); font-size: 22px; margin-top: 10px;">💎 ${w.amount}</h3>
          
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 4px; margin: 12px 0;">
            <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 4px;">Method: <b>${w.method}</b></div>
            <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 4px;">Acct Name: <b>${w.accountName}</b></div>
            <div style="font-size: 13px; color: var(--accent-cyan); font-family: monospace;">Details: ${w.accountDetails}</div>
            
            <div style="font-size: 13px; color: var(--accent-orange); font-family: monospace; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1);">
              📄 ID Proof: <span style="color: #fff;">${w.idProof || 'Not Attached'}</span>
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: auto;">
            <button class="btn-deposit-glow" style="flex: 1; padding: 8px; justify-content: center; background: linear-gradient(135deg, #10b981, #059669);" onclick="AdminManager.processWithdrawal('${w.id}', true)">✅ Mark Paid</button>
            <button class="btn-secondary" style="flex: 1; padding: 8px; justify-content: center; color: var(--accent-red);" onclick="AdminManager.processWithdrawal('${w.id}', false)">❌ Reject</button>
          </div>
        </div>
      </div>
    `).join("");
  },

  processWithdrawal(reqId, isPaid) {
    let withdraws = Store.getAdminData("rare_ff_withdrawals");
    let reqIndex = withdraws.findIndex(w => w.id === reqId);
    if(reqIndex === -1) return;

    if (isPaid) {
      withdraws[reqIndex].status = "completed";
      UI.toast("Withdrawal marked as Paid!", "success");
    } else {
      withdraws[reqIndex].status = "rejected";
      UI.toast("Withdrawal rejected.", "error");
    }

    Store.saveAdminData("rare_ff_withdrawals", withdraws);
    this.renderWithdrawals();
  },

  renderBookings() {
    const grid = document.getElementById("admin-bookings-grid");
    const bookings = Store.getAdminData("rare_ff_bookings");

    if (bookings.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">No player bookings received yet.</div>`;
      return;
    }

    bookings.sort((a, b) => new Date(b.date) - new Date(a.date));

    grid.innerHTML = bookings.map(b => {
       const t = Store.getTournamentById(b.matchId);
       const tName = t ? t.title : "Unknown Match";
       return `
        <div class="tourney-card" style="border-color: rgba(255,255,255,0.1);">
          <div class="tourney-card-body">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span class="badge-mode" style="background: rgba(6, 182, 212, 0.2); color: var(--accent-cyan); border-color: transparent;">Slot #${b.slot}</span>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">${new Date(b.date).toLocaleString()}</div>
              </div>
              <span style="font-size: 12px; color: var(--accent-gold); font-weight: 700; text-align: right;">${tName}</span>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 4px; margin-top: 14px;">
              <div style="font-size: 14px; color: #fff; margin-bottom: 4px;">IGN: <b>${b.ign}</b></div>
              <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 4px; font-family: monospace;">UID: ${b.ffUid}</div>
              <div style="font-size: 13px; color: var(--accent-green);">WA: ${b.phone}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Store.init();
  AdminManager.init();
});