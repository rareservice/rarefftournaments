/* ==========================================================================
   Rare FF Tournaments - Seed Data & Initial State (Cleaned - No Dummy Data)
   Ready for real tournament synchronization from upcoming Admin Website
   ========================================================================== */

// All dummy tournaments removed. Will be populated dynamically by Admin panel.
const INITIAL_TOURNAMENTS = [];

// Clean initial user state starting fresh with 0 balances
const INITIAL_USER = {
  id: "USR-0001",
  name: "Guest Player",
  ign: "Player",
  ffUid: "",
  phone: "",
  email: "",
  wallet: {
    totalBalance: 0,
    depositBalance: 0,
    winningsBalance: 0
  },
  stats: {
    matchesPlayed: 0,
    matchesWon: 0,
    totalKills: 0,
    kdRatio: 0.00,
    totalEarnings: 0
  },
  registeredMatchIds: []
};

// All dummy transactions removed
const INITIAL_TRANSACTIONS = [];

// Clean initial leaderboard - ready for official match results
const LEADERBOARD_DATA = [];

// Active supported currencies
const CURRENCIES = {
  PKR: { code: "PKR", symbol: "Rs. ", rate: 1, name: "Pakistani Rupee (PKR)" },
  INR: { code: "INR", symbol: "₹", rate: 0.31, name: "Indian Rupee (INR)" },
  USD: { code: "USD", symbol: "$", rate: 0.0036, name: "US Dollar (USD)" },
  COIN: { code: "COIN", symbol: "💎 ", rate: 1, name: "Rare FF Coins" }
};
