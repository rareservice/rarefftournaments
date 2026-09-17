/* ==========================================================================
   Rare FF Tournaments - UI Utilities & View Controller
   ========================================================================== */

const UI = {
  // Toast notifications
  toast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    let icon = "⚡";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "⚠️";
    if (type === "soon") icon = "⏳";

    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideIn 0.3s ease-in reverse forwards";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  // Direct trigger for upcoming / dummy clickable items
  showSoon(featureName = "") {
    this.toast("Soon implemented", "soon");
  },

  // Modal helpers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  },

  // Switch Active Page/Tab View
  switchView(viewName) {
    // Nav link active status
    document.querySelectorAll(".nav-link").forEach(link => {
      if (link.dataset.view === viewName) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Sections visibility
    const views = ["matches-view", "my-matches-view", "leaderboard-view", "rules-view", "support-view"];
    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === `${viewName}-view`) {
          el.style.display = "block";
        } else {
          el.style.display = "none";
        }
      }
    });

    // Close mobile menu if open
    const navLinks = document.querySelector(".nav-links");
    if (navLinks) navLinks.classList.remove("mobile-open");

    // Scroll to section
    const targetSection = document.getElementById(`${viewName}-view`);
    if (targetSection && viewName !== "matches") {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  },

  // Update Top Bar & Header Profile
  updateHeader() {
    const user = Store.getUser();
    const curr = Store.getCurrency();

    // Wallet balance
    const walletDisplay = document.getElementById("nav-wallet-balance");
    if (walletDisplay) {
      walletDisplay.innerText = Store.formatMoney(user.wallet.totalBalance);
    }

    // User display
    const userNameDisplay = document.getElementById("nav-user-ign");
    if (userNameDisplay) {
      userNameDisplay.innerText = user.ign || "Player";
    }

    // Registered matches badge count
    const registeredBadge = document.getElementById("my-matches-badge");
    if (registeredBadge) {
      const count = (user.registeredMatchIds || []).length;
      registeredBadge.innerText = count;
      registeredBadge.style.display = count > 0 ? "inline-block" : "none";
    }

    // Currency selector
    const currSelect = document.getElementById("currency-select");
    if (currSelect) {
      currSelect.value = curr.code;
    }
  },

  // Format countdown string
  getCountdownString(targetIso) {
    const diff = new Date(targetIso) - new Date();
    if (diff <= 0) return "Match in Progress";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = n => String(n).padStart(2, '0');
    return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
  }
};

// Global click outside modal to close
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("active");
    document.body.style.overflow = "";
  }
});
