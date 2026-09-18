/* ==========================================================================
   Rare FF Tournaments - Seed Data (No Dummy Data & INR Removed)
   ========================================================================== */

const INITIAL_TOURNAMENTS = [];

const INITIAL_USER = {
  id: "USR-0001",
  name: "Guest Player",
  ign: "Player",
  ffUid: "",
  phone: "",
  email: "",
  wallet: { totalBalance: 0, depositBalance: 0, winningsBalance: 0 },
  stats: { matchesPlayed: 0, matchesWon: 0, totalKills: 0, kdRatio: 0.00, totalEarnings: 0 },
  registeredMatchIds: []
};

const INITIAL_TRANSACTIONS = [];
const LEADERBOARD_DATA = [];

const CURRENCIES = {
  PKR: { code: "PKR", symbol: "Rs. ", rate: 1, name: "Pakistani Rupee (PKR)" },
  USD: { code: "USD", symbol: "$", rate: 0.0036, name: "US Dollar (USD)" },
  COIN: { code: "COIN", symbol: "💎 ", rate: 1, name: "Rare FF Coins" }
};