/* ==========================================================================
   Rare FF Tournaments - Wallet & Financials Manager
   ========================================================================== */

const PAYMENT_GATEWAYS = {
  jazzcash: {
    name: "JazzCash",
    accountNumber: "Available on Launch",
    accountTitle: "Rare FF Official",
    instructions: "Direct JazzCash integration will be enabled on official tournament launch."
  },
  easypaisa: {
    name: "EasyPaisa",
    accountNumber: "Available on Launch",
    accountTitle: "Rare FF Official",
    instructions: "Direct EasyPaisa merchant gateway will be enabled on official tournament launch."
  },
  nayapay: {
    name: "NayaPay / SadaPay",
    accountNumber: "Available on Launch",
    accountTitle: "Rare FF Official",
    instructions: "Direct NayaPay & SadaPay instant transfers will be enabled on tournament launch."
  },
  usdt: {
    name: "Binance Pay / USDT",
    accountNumber: "Available on Launch",
    accountTitle: "Rare Esports Global",
    instructions: "Instant zero-fee Binance Pay and USDT (TRC20 / BEP20) gateway."
  },
  anycrypto: {
    name: "Any Crypto",
    accountNumber: "BTC • ETH • LTC • TRX • SOL • USDT",
    accountTitle: "Multi-Chain Crypto Gateway",
    instructions: "Deposit using Bitcoin, Ethereum, Litecoin, TRON, Solana, or any major cryptocurrency."
  }
};

const WalletManager = {
  activeTab: "deposit",
  selectedGateway: "jazzcash",

  init() {
    this.renderWalletSummary();
    this.renderTransactions();
    this.setupWalletEvents();
  },

  setupWalletEvents() {
    document.querySelectorAll(".wallet-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".wallet-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.selectTab(btn.dataset.tab);
      });
    });
  },

  selectTab(tab) {
    this.activeTab = tab;
    const depositView = document.getElementById("wallet-view-deposit");
    const withdrawView = document.getElementById("wallet-view-withdraw");
    const historyView = document.getElementById("wallet-view-history");

    if (depositView) depositView.style.display = tab === "deposit" ? "block" : "none";
    if (withdrawView) withdrawView.style.display = tab === "withdraw" ? "block" : "none";
    if (historyView) historyView.style.display = tab === "history" ? "block" : "none";

    if (tab === "history") this.renderTransactions();
    if (tab === "deposit") this.updateGatewayDetails();
  },

  renderWalletSummary() {
    const user = Store.getUser();
    const totalEl = document.getElementById("wallet-total-bal");
    const depositEl = document.getElementById("wallet-deposit-bal");
    const winningsEl = document.getElementById("wallet-winnings-bal");

    if (totalEl) totalEl.innerText = Store.formatMoney(user.wallet.totalBalance);
    if (depositEl) depositEl.innerText = Store.formatMoney(user.wallet.depositBalance);
    if (winningsEl) winningsEl.innerText = Store.formatMoney(user.wallet.winningsBalance);
  },

  selectGateway(gwKey) {
    this.selectedGateway = gwKey;
    document.querySelectorAll(".pay-method-btn").forEach(b => {
      if (b.dataset.gateway === gwKey) {
        b.classList.add("selected");
      } else {
        b.classList.remove("selected");
      }
    });
    this.updateGatewayDetails();
  },

  setQuickAmount(amount) {
    const input = document.getElementById("deposit-amount-input");
    if (input) input.value = amount;
  },

  updateGatewayDetails() {
    const gw = PAYMENT_GATEWAYS[this.selectedGateway] || PAYMENT_GATEWAYS.jazzcash;
    const infoContainer = document.getElementById("gateway-instructions-box");
    if (!infoContainer) return;

    infoContainer.innerHTML = `
      <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; color: var(--text-muted);">Payment Channel</span>
          <span style="font-weight: 800; color: var(--accent-gold);">${gw.name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; color: var(--text-muted);">Status:</span>
          <b style="color: var(--accent-cyan); font-family: monospace;">${gw.accountNumber}</b>
        </div>
        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
          📌 ${gw.instructions}
        </p>
      </div>
    `;
  },

  handleDepositSubmit(e) {
    e.preventDefault();
    UI.showSoon();
  },

  handleWithdrawSubmit(e) {
    e.preventDefault();
    UI.showSoon();
  },

  renderTransactions() {
    const listContainer = document.getElementById("transactions-tbody");
    if (!listContainer) return;

    const list = Store.getTransactions();

    if (list.length === 0) {
      listContainer.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 28px;">
            No transactions found yet. Your deposit and prize history will appear here.
          </td>
        </tr>
      `;
      return;
    }

    listContainer.innerHTML = list.map(tx => `
      <tr>
        <td style="font-family: monospace; font-size: 12px; color: var(--accent-gold);">${tx.id}</td>
        <td><b>${tx.type}</b></td>
        <td style="font-weight: 800; font-family: var(--font-heading); color: var(--accent-gold);">
          ${Store.formatMoney(tx.amount)}
        </td>
        <td><span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${tx.status}</span></td>
        <td style="font-size: 12px; color: var(--text-muted);">${new Date(tx.date).toLocaleDateString()}</td>
      </tr>
    `).join("");
  }
};
