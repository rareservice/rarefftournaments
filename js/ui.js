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

  // Robust Text Clipboard Copy (Supports Phones & Older Browsers + Button Update)
  copyText(text, label = "Details", btnElement = null) {
    const onSuccess = () => {
      this.toast(`${label} copied to clipboard!`, "success");
      if (btnElement) {
        const originalHtml = btnElement.innerHTML;
        btnElement.innerHTML = "✅ Successfully Copied";
        btnElement.style.color = "var(--accent-green)";
        btnElement.style.borderColor = "var(--accent-green)";
        
        setTimeout(() => {
          btnElement.innerHTML = originalHtml;
          btnElement.style.color = "";
          btnElement.style.borderColor = "";
        }, 5000);
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        onSuccess();
      }).catch(() => {
        this.fallbackCopyText(text, label, onSuccess);
      });
    } else {
      this.fallbackCopyText(text, label, onSuccess);
    }
  },

  fallbackCopyText(text, label, onSuccessCallback) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Prevent zooming or scrolling on mobile
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        if (onSuccessCallback) onSuccessCallback();
        else this.toast(`${label} copied to clipboard!`, "success");
      } else {
        this.toast("Failed to copy text. Please try manually.", "error");
      }
    } catch (err) {
      this.toast("Failed to copy text.", "error");
    }
    document.body.removeChild(textArea);
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
    document.querySelectorAll(".nav-link").forEach(link => {
      if (link.dataset.view === viewName) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

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

    const navLinks = document.querySelector(".nav-links");
    if (navLinks) navLinks.classList.remove("mobile-open");

    const targetSection = document.getElementById(`${viewName}-view`);
    if (targetSection && viewName !== "matches") {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  },

  // Update Top Bar & Header Profile
  updateHeader() {
    const user = Store.getUser();

    const walletDisplay = document.getElementById("nav-wallet-balance");
    if (walletDisplay) {
      walletDisplay.innerText = Store.formatMoney(user.wallet.totalBalance);
    }

    const userNameDisplay = document.getElementById("nav-user-ign");
    if (userNameDisplay) {
      userNameDisplay.innerText = user.ign || "Player";
    }

    const registeredBadge = document.getElementById("my-matches-badge");
    if (registeredBadge) {
      const count = (user.registeredMatchIds || []).length;
      registeredBadge.innerText = count;
      registeredBadge.style.display = count > 0 ? "inline-block" : "none";
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