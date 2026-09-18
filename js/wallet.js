/* ==========================================================================
   Rare FF Tournaments - Wallet & Financials Manager
   ========================================================================== */

const WalletManager = {
  activeTab: "deposit",

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

  // Handles the Multi-File Proof Upload
  handleProofSubmit(e) {
    e.preventDefault();
    const fileInput = document.getElementById("proof-files");
    
    if (!fileInput || fileInput.files.length === 0) {
      UI.toast("Please select at least one screenshot as payment proof.", "error");
      return;
    }

    const fileCount = fileInput.files.length;
    UI.toast(`Uploading ${fileCount} payment proof(s)...`, "info");

    // Simulate backend upload delay
    setTimeout(() => {
      UI.toast("✅ Payment proofs submitted successfully! Admin will verify soon.", "success");
      fileInput.value = ""; // Reset file input
    }, 1500);
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