/* ==========================================================================
   Rare FF Tournaments - Store & State Management Layer (No Dummy Data)
   ========================================================================== */

const STORAGE_KEYS = {
  TOURNAMENTS: "rare_ff_tournaments_list_v2",
  USER: "rare_ff_user_profile_v2",
  TRANSACTIONS: "rare_ff_transactions_v2",
  CURRENCY: "rare_ff_currency_code_v2",
  NOTIFICATIONS: "rare_ff_notifications_v2"
};

const Store = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) {
      localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(INITIAL_TOURNAMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_USER));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENCY)) {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, "PKR");
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    }
  },

  // Currency
  getCurrency() {
    const code = localStorage.getItem(STORAGE_KEYS.CURRENCY) || "PKR";
    return CURRENCIES[code] || CURRENCIES.PKR;
  },

  setCurrency(code) {
    if (CURRENCIES[code]) {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, code);
    }
  },

  formatMoney(amountInPkr) {
    const curr = this.getCurrency();
    const converted = amountInPkr * curr.rate;
    if (curr.code === "USD") {
      return `${curr.symbol}${converted.toFixed(2)}`;
    }
    return `${curr.symbol}${Math.round(converted).toLocaleString()}`;
  },

  // Tournaments
  getTournaments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) || [];
    } catch (e) {
      return [];
    }
  },

  getTournamentById(id) {
    const list = this.getTournaments();
    return list.find(t => t.id === id);
  },

  saveTournaments(tournaments) {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
  },

  // User & Wallet
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || INITIAL_USER;
    } catch (e) {
      return INITIAL_USER;
    }
  },

  saveUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  updateUserProfile(updatedFields) {
    const user = this.getUser();
    const newUser = { ...user, ...updatedFields };
    this.saveUser(newUser);
    return newUser;
  },

  // Registration for Tournament
  registerForTournament(matchId, registrationData) {
    const user = this.getUser();
    const tournaments = this.getTournaments();
    const tourneyIndex = tournaments.findIndex(t => t.id === matchId);

    if (tourneyIndex === -1) {
      return { success: false, message: "Tournament not found" };
    }

    const tourney = tournaments[tourneyIndex];

    if (tourney.joinedSlots >= tourney.totalSlots) {
      return { success: false, message: "Tournament lobby is completely full!" };
    }

    if (user.registeredMatchIds && user.registeredMatchIds.includes(matchId)) {
      return { success: false, message: "You are already registered for this tournament!" };
    }

    // Check entry fee
    if (tourney.entryFee > 0) {
      const totalAvailable = user.wallet.totalBalance;
      if (totalAvailable < tourney.entryFee) {
        return { 
          success: false, 
          message: `Insufficient wallet balance (${this.formatMoney(totalAvailable)}). Entry fee is ${this.formatMoney(tourney.entryFee)}. Please deposit funds first.`,
          insufficientBalance: true
        };
      }

      let fee = tourney.entryFee;
      if (user.wallet.depositBalance >= fee) {
        user.wallet.depositBalance -= fee;
      } else {
        fee -= user.wallet.depositBalance;
        user.wallet.depositBalance = 0;
        user.wallet.winningsBalance -= fee;
      }
      user.wallet.totalBalance = user.wallet.depositBalance + user.wallet.winningsBalance;
    }

    // Update slots
    tourney.joinedSlots += 1;
    tournaments[tourneyIndex] = tourney;
    this.saveTournaments(tournaments);

    // Update user registered list
    if (!user.registeredMatchIds) user.registeredMatchIds = [];
    user.registeredMatchIds.push(matchId);
    user.stats.matchesPlayed += 1;
    this.saveUser(user);

    // Add transaction record
    if (tourney.entryFee > 0) {
      this.addTransaction({
        type: "tournament_entry",
        amount: tourney.entryFee,
        matchId: tourney.id,
        method: "Wallet Balance",
        status: "completed"
      });
    }

    return { 
      success: true, 
      message: `Successfully registered for ${tourney.title}! Assigned Room Slot: #${tourney.joinedSlots}.`,
      tournament: tourney
    };
  },

  // Cancel Registration
  cancelRegistration(matchId) {
    const user = this.getUser();
    const tournaments = this.getTournaments();
    const tourneyIndex = tournaments.findIndex(t => t.id === matchId);

    if (tourneyIndex === -1) return { success: false, message: "Tournament not found" };

    const tourney = tournaments[tourneyIndex];

    if (!user.registeredMatchIds || !user.registeredMatchIds.includes(matchId)) {
      return { success: false, message: "You are not registered for this tournament" };
    }

    if (tourney.entryFee > 0) {
      user.wallet.depositBalance += tourney.entryFee;
      user.wallet.totalBalance = user.wallet.depositBalance + user.wallet.winningsBalance;

      this.addTransaction({
        type: "refund",
        amount: tourney.entryFee,
        matchId: tourney.id,
        method: "Refund to Wallet",
        status: "completed"
      });
    }

    if (tourney.joinedSlots > 0) {
      tourney.joinedSlots -= 1;
      tournaments[tourneyIndex] = tourney;
      this.saveTournaments(tournaments);
    }

    user.registeredMatchIds = user.registeredMatchIds.filter(id => id !== matchId);
    this.saveUser(user);

    return { success: true, message: "Registration cancelled and funds refunded to your wallet." };
  },

  // Wallet Actions
  depositFunds(amount, method, trxId) {
    const user = this.getUser();
    user.wallet.depositBalance += Number(amount);
    user.wallet.totalBalance = user.wallet.depositBalance + user.wallet.winningsBalance;
    this.saveUser(user);

    const tx = this.addTransaction({
      type: "deposit",
      amount: Number(amount),
      method: method,
      reference: trxId,
      status: "completed"
    });

    return { success: true, transaction: tx, newBalance: user.wallet.totalBalance };
  },

  withdrawFunds(amount, method, accountDetails) {
    const user = this.getUser();
    if (amount > user.wallet.winningsBalance) {
      return { 
        success: false, 
        message: `Insufficient winnings balance (${this.formatMoney(user.wallet.winningsBalance)}). Only prize winnings can be withdrawn.` 
      };
    }

    user.wallet.winningsBalance -= Number(amount);
    user.wallet.totalBalance = user.wallet.depositBalance + user.wallet.winningsBalance;
    this.saveUser(user);

    const tx = this.addTransaction({
      type: "withdrawal",
      amount: Number(amount),
      method: method,
      reference: `ACC: ${accountDetails}`,
      status: "processing"
    });

    return { success: true, transaction: tx, newBalance: user.wallet.totalBalance };
  },

  // Transactions
  getTransactions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
    } catch (e) {
      return [];
    }
  },

  addTransaction(txData) {
    const list = this.getTransactions();
    const newTx = {
      id: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString(),
      ...txData
    };
    list.unshift(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
    return newTx;
  },

  // Admin Hooks (ready for incoming admin website)
  adminAddTournament(newTourney) {
    const list = this.getTournaments();
    const id = `FF-${100 + list.length + 1}`;
    const item = {
      id,
      joinedSlots: 0,
      status: "upcoming",
      ...newTourney
    };
    list.unshift(item);
    this.saveTournaments(list);
    return item;
  },

  adminUpdateRoom(id, roomId, roomPass) {
    const list = this.getTournaments();
    const idx = list.findIndex(t => t.id === id);
    if (idx !== -1) {
      list[idx].roomDetails.roomId = roomId;
      list[idx].roomDetails.roomPass = roomPass;
      this.saveTournaments(list);
      return list[idx];
    }
    return null;
  },

  adminUpdateStatus(id, newStatus) {
    const list = this.getTournaments();
    const idx = list.findIndex(t => t.id === id);
    if (idx !== -1) {
      list[idx].status = newStatus;
      this.saveTournaments(list);
      return list[idx];
    }
    return null;
  },

  resetToDefaults() {
    localStorage.clear();
    this.init();
  }
};

Store.init();
