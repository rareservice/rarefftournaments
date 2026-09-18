/* ==========================================================================
   Rare FF Tournaments - Authentication Manager & Firebase Auth Integration
   ========================================================================== */

const AuthManager = {
  init() {
    if (Store.isFirebaseActive()) {
      firebase.auth().onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const doc = await firebase.firestore().collection("users").doc(firebaseUser.uid).get();
            if (doc.exists) {
              const userData = doc.data();
              Store.saveUser(userData);
              this.updateUIForUser(userData);
            }
          } catch (err) {
            console.error("Error fetching user data:", err);
          }
        } else {
          this.updateUIForGuest();
        }
      });
    } else {
      const user = Store.getUser();
      if (user && user.email) {
        this.updateUIForUser(user);
      } else {
        this.updateUIForGuest();
      }
    }
  },

  openAuthModal(tab) {
    this.switchAuthTab(tab);
    UI.openModal("auth-modal");
  },

  switchAuthTab(tab) {
    const signinForm = document.getElementById("auth-form-signin");
    const signupForm = document.getElementById("auth-form-signup");
    const resetForm = document.getElementById("auth-form-reset");

    if (signinForm) signinForm.style.display = "none";
    if (signupForm) signupForm.style.display = "none";
    if (resetForm) resetForm.style.display = "none";

    document.querySelectorAll(".auth-tab-btn").forEach(btn => btn.classList.remove("active"));

    if (tab === "signin") {
      if (signinForm) signinForm.style.display = "block";
      const btn = document.querySelector('[data-tab="signin"]');
      if (btn) btn.classList.add("active");
    } else if (tab === "signup") {
      if (signupForm) signupForm.style.display = "block";
      const btn = document.querySelector('[data-tab="signup"]');
      if (btn) btn.classList.add("active");
    } else if (tab === "reset") {
      if (resetForm) resetForm.style.display = "block";
    }

    const errMsg = document.getElementById("auth-error-msg");
    if (errMsg) errMsg.style.display = "none";
  },

  showError(message) {
    const errMsg = document.getElementById("auth-error-msg");
    if (errMsg) {
      errMsg.innerText = message;
      errMsg.style.display = "block";
    } else {
      UI.toast(message, "error");
    }
  },

  async handleSignUp(e) {
    e.preventDefault();
    const ign = document.getElementById("signup-ign") ? document.getElementById("signup-ign").value.trim() : "";
    const ffuid = document.getElementById("signup-ffuid") ? document.getElementById("signup-ffuid").value.trim() : "";
    const phone = document.getElementById("signup-phone") ? document.getElementById("signup-phone").value.trim() : "";
    const email = document.getElementById("signup-email") ? document.getElementById("signup-email").value.trim() : "";
    const pass = document.getElementById("signup-pass") ? document.getElementById("signup-pass").value : "";
    const passConfirmEl = document.getElementById("signup-pass-confirm");
    const passConfirm = passConfirmEl ? passConfirmEl.value : pass;

    if (pass !== passConfirm) {
      this.showError("Passwords do not match!");
      return;
    }

    if (Store.isFirebaseActive()) {
      try {
        UI.toast("Creating account...", "info");
        const userCred = await firebase.auth().createUserWithEmailAndPassword(email, pass);
        const uid = userCred.user.uid;
        
        const newUser = {
          id: uid,
          ign: ign,
          ffUid: ffuid,
          phone: phone,
          email: email,
          wallet: { totalBalance: 0, depositBalance: 0, winningsBalance: 0 },
          stats: { matchesPlayed: 0, matchesWon: 0, totalKills: 0 },
          registeredMatchIds: []
        };

        await firebase.firestore().collection("users").doc(uid).set(newUser);
        Store.saveUser(newUser);

        UI.closeModal("auth-modal");
        UI.toast("Account created successfully!", "success");
        this.updateUIForUser(newUser);

      } catch (error) {
        this.showError(error.message);
      }
    } else {
      this.showError("Firebase is not connected. Cannot create account.");
    }
  },

  async handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById("signin-email") ? document.getElementById("signin-email").value.trim() : "";
    const pass = document.getElementById("signin-pass") ? document.getElementById("signin-pass").value : "";

    if (Store.isFirebaseActive()) {
      try {
        UI.toast("Logging in...", "info");
        const userCred = await firebase.auth().signInWithEmailAndPassword(email, pass);
        const doc = await firebase.firestore().collection("users").doc(userCred.user.uid).get();
        
        if (doc.exists) {
          Store.saveUser(doc.data());
          this.updateUIForUser(doc.data());
        }
        
        UI.closeModal("auth-modal");
        UI.toast("Welcome back!", "success");
      } catch (error) {
        this.showError("Invalid email or password.");
      }
    } else {
      this.showError("Firebase is not connected.");
    }
  },

  async handleGoogleSignIn() {
    if (Store.isFirebaseActive()) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        const uid = result.user.uid;
        
        const doc = await firebase.firestore().collection("users").doc(uid).get();
        let userData;
        
        if (!doc.exists) {
          userData = {
            id: uid,
            ign: result.user.displayName || "Player",
            ffUid: "",
            phone: "",
            email: result.user.email,
            wallet: { totalBalance: 0, depositBalance: 0, winningsBalance: 0 },
            stats: { matchesPlayed: 0, matchesWon: 0, totalKills: 0 },
            registeredMatchIds: []
          };
          await firebase.firestore().collection("users").doc(uid).set(userData);
        } else {
          userData = doc.data();
        }
        
        Store.saveUser(userData);
        UI.closeModal("auth-modal");
        UI.toast("Signed in with Google!", "success");
        this.updateUIForUser(userData);

      } catch (error) {
        if (error.code === "auth/unauthorized-domain") {
          this.showError("Domain not authorized in Firebase. Add 'rarefftournaments.online' under Authentication > Settings > Authorized Domains.");
        } else {
          this.showError(error.message);
        }
      }
    } else {
      UI.toast("Google Sign-In requires Firebase to be active.", "error");
    }
  },

  async handlePasswordReset(e) {
    e.preventDefault();
    const email = document.getElementById("reset-email") ? document.getElementById("reset-email").value.trim() : "";
    
    if (Store.isFirebaseActive()) {
      try {
        await firebase.auth().sendPasswordResetEmail(email);
        UI.toast("Password reset link sent to your email!", "success");
        this.switchAuthTab("signin");
      } catch (error) {
        this.showError(error.message);
      }
    } else {
      this.showError("Firebase is not connected.");
    }
  },

  async handleSignOut() {
    if (Store.isFirebaseActive()) {
      try {
        await firebase.auth().signOut();
      } catch(err) {
        console.error("Sign out error:", err);
      }
    }
    
    localStorage.removeItem("rare_ff_user_profile_v3");
    Store.init();
    
    UI.closeModal("profile-modal");
    UI.toast("Successfully signed out.", "info");
    this.updateUIForGuest();
  },

  updateUIForUser(user) {
    const guestActions = document.getElementById("nav-guest-actions");
    const userActions = document.getElementById("nav-user-actions");
    const navIgn = document.getElementById("nav-user-ign");

    if (guestActions) guestActions.style.display = "none";
    if (userActions) userActions.style.display = "flex";
    if (navIgn && user && user.ign) {
      navIgn.innerText = user.ign;
    }

    if (typeof UI !== 'undefined') {
      UI.updateHeader();
    }
  },

  updateUIForGuest() {
    const guestActions = document.getElementById("nav-guest-actions");
    const userActions = document.getElementById("nav-user-actions");

    if (guestActions) guestActions.style.display = "flex";
    if (userActions) userActions.style.display = "none";
    
    if (typeof UI !== 'undefined') {
      UI.updateHeader();
    }
  }
};