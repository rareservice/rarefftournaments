/* ==========================================================================
   Rare FF Tournaments - Store & State Management Layer
   ========================================================================== */

const STORAGE_KEYS = {
  TOURNAMENTS: "rare_ff_tournaments_v3",
  USER: "rare_ff_user_profile_v3",
  TRANSACTIONS: "rare_ff_transactions_v3",
  DEPOSITS: "rare_ff_deposits",
  WITHDRAWALS: "rare_ff_withdrawals",
  BOOKINGS: "rare_ff_bookings"
};

const Store = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    
    if (!localStorage.getItem(STORAGE_KEYS.DEPOSITS)) localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.WITHDRAWALS)) localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));

    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      const fallbackUser = typeof INITIAL_USER !== "undefined" ? INITIAL_USER : {
        id: "USR-0001", name: "Guest Player", ign: "Player", ffUid: "", phone: "", email: "",
        wallet: { totalBalance: 0, depositBalance: 0, winningsBalance: 0 },
        stats: { matchesPlayed: 0, matchesWon: 0, totalKills: 0 }, registeredMatchIds: []
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fallbackUser));
    }
  },

  isFirebaseActive() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && typeof firebase.firestore === 'function';
  },

  listenToTournaments(onUpdateCallback) {
    if (this.isFirebaseActive()) {
      try {
        firebase.firestore().collection("tournaments").onSnapshot(snap => {
          const list = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          if (list.length > 0) localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(list));
          if (onUpdateCallback) onUpdateCallback();
        }, error => console.warn(error));
      } catch (err) { console.warn(err); }
    }
  },

  formatMoney(amount) {
    return `💎 ${Math.round(amount).toLocaleString()}`;
  },

  getTournaments() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) || []; },
  getTournamentById(id) { return this.getTournaments().find(t => t.id === id); },
  saveTournaments(tournaments) { localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments)); },

  getUser() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || {}; },
  saveUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (this.isFirebaseActive() && firebase.auth().currentUser) {
      firebase.firestore().collection("users").doc(firebase.auth().currentUser.uid).set(user, { merge: true }).catch(err => err);
    }
  },
  updateUserProfile(updatedFields) {
    const user = this.getUser();
    const newUser = { ...user, ...updatedFields };
    this.saveUser(newUser); return newUser;
  },

  getAdminData(key) { return JSON.parse(localStorage.getItem(key)) || []; },
  saveAdminData(key, data) { localStorage.setItem(key, JSON.stringify(data)); },

  requestDeposit(fileNames) {
    const user = this.getUser();
    const req = {
      id: `DEP-${Math.floor(Math.random() * 90000)}`,
      uid: user.ffUid, ign: user.ign,
      files: fileNames, status: "pending", date: new Date().toISOString()
    };
    const list = this.getAdminData(STORAGE_KEYS.DEPOSITS);
    list.unshift(req);
    this.saveAdminData(STORAGE_KEYS.DEPOSITS, list);
    
    if (this.isFirebaseActive()) firebase.firestore().collection("deposits").doc(req.id).set(req).catch(e=>e);
  },

  requestWithdrawal(amount, method, accountDetails, accountName, idProofFile) {
    const user = this.getUser();
    if(amount > user.wallet.winningsBalance) return { success: false, message: "Insufficient winnings balance." };

    user.wallet.winningsBalance -= parseInt(amount);
    user.wallet.totalBalance = user.wallet.depositBalance + user.wallet.winningsBalance;
    this.saveUser(user);

    const req = {
      id: `WD-${Math.floor(Math.random() * 90000)}`,
      uid: user.ffUid, ign: user.ign,
      amount: parseInt(amount), method, accountDetails, accountName, idProof: idProofFile, status: "pending", date: new Date().toISOString()
    };
    
    const list = this.getAdminData(STORAGE_KEYS.WITHDRAWALS);
    list.unshift(req);
    this.saveAdminData(STORAGE_KEYS.WITHDRAWALS, list);

    this.addTransaction({ type: "withdrawal_pending", amount: req.amount, matchId: "N/A", method: method, status: "pending" });
    
    if (this.isFirebaseActive()) firebase.firestore().collection("withdrawals").doc(req.id).set(req).catch(e=>e);
    return { success: true };
  },

  simulateUserWalletAddition(coins) {
    const user = this.getUser();
    user.wallet.depositBalance += coins;
    user.wallet.totalBalance = user.wallet.depositBalance + user.wallet.winningsBalance;
    this.saveUser(user);
    this.addTransaction({ type: "deposit", amount: coins, matchId: "Admin Approv", method: "System", status: "completed" });
  },

  async registerForTournament(matchId, slotNumber, regData) {
    const user = this.getUser();
    const tourney = this.getTournamentById(matchId);

    if (!tourney) return { success: false, message: "Tournament not found" };
    const taken = tourney.takenSlots || [];
    if (taken.includes(slotNumber) || taken.length >= tourney.totalSlots) return { success: false, message: "This slot is already taken!" };
    if (user.registeredMatchIds && user.registeredMatchIds.some(r => r.matchId === matchId)) return { success: false, message: "Already registered!" };

    if (tourney.entryFee > 0) {
      if (user.wallet.totalBalance < tourney.entryFee) return { success: false, message: `Insufficient balance. Need 💎 ${tourney.entryFee}` };
      let fee = tourney.entryFee;
      if (user.wallet.depositBalance >= fee) user.wallet.depositBalance -= fee;
      else { fee -= user.wallet.depositBalance; user.wallet.depositBalance = 0; user.wallet.winningsBalance -= fee; }
      user.wallet.totalBalance = user.wallet.depositBalance + user.wallet.winningsBalance;
    }

    if (this.isFirebaseActive()) {
      try {
        await firebase.firestore().collection("tournaments").doc(matchId).update({ takenSlots: firebase.firestore.FieldValue.arrayUnion(slotNumber) });
      } catch (err) { return { success: false, message: "Server slot reservation failed." }; }
    }

    if (!user.registeredMatchIds) user.registeredMatchIds = [];
    user.registeredMatchIds.push({ matchId, slot: slotNumber });
    user.stats.matchesPlayed += 1;
    this.saveUser(user);

    const booking = { id: `BK-${Math.random()}`, matchId, slot: slotNumber, ign: regData.ign, ffUid: regData.ffUid, phone: regData.phone, date: new Date().toISOString() };
    const bList = this.getAdminData(STORAGE_KEYS.BOOKINGS);
    bList.unshift(booking);
    this.saveAdminData(STORAGE_KEYS.BOOKINGS, bList);

    if (this.isFirebaseActive()) firebase.firestore().collection("bookings").doc(booking.id).set(booking).catch(e=>e);

    if (tourney.entryFee > 0) this.addTransaction({ type: "tournament_entry", amount: tourney.entryFee, matchId: tourney.id, method: "Wallet", status: "completed" });
    return { success: true, message: `Successfully secured Slot #${slotNumber}!` };
  },

  async cancelRegistration(matchId) {
    const user = this.getUser();
    const tourney = this.getTournamentById(matchId);
    if (!tourney || !user.registeredMatchIds) return { success: false, message: "Invalid request." };

    const reg = user.registeredMatchIds.find(r => r.matchId === matchId);
    if (!reg) return { success: false, message: "You are not registered." };

    if (tourney.entryFee > 0) {
      user.wallet.depositBalance += tourney.entryFee;
      user.wallet.totalBalance = user.wallet.depositBalance + user.wallet.winningsBalance;
      this.addTransaction({ type: "refund", amount: tourney.entryFee, matchId: tourney.id, method: "Refund", status: "completed" });
    }

    if (this.isFirebaseActive()) {
      try { await firebase.firestore().collection("tournaments").doc(matchId).update({ takenSlots: firebase.firestore.FieldValue.arrayRemove(reg.slot) }); } 
      catch (err) { console.error(err); }
    }

    user.registeredMatchIds = user.registeredMatchIds.filter(r => r.matchId !== matchId);
    this.saveUser(user);
    return { success: true, message: "Registration cancelled and coins refunded." };
  },

  getTransactions() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || []; },
  addTransaction(txData) {
    const list = this.getTransactions();
    const newTx = { id: `TRX-${Math.floor(100000 + Math.random() * 900000)}`, date: new Date().toISOString(), ...txData };
    list.unshift(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
    return newTx;
  }
};