/* ==========================================================================
   Rare FF Tournaments - Firebase Configuration
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyD8f9V7vbmFgsk0NUGaC2P9Nzia6xucssc",
  authDomain: "rare-ff-tournaments.firebaseapp.com",
  projectId: "rare-ff-tournaments",
  storageBucket: "rare-ff-tournaments.firebasestorage.app",
  messagingSenderId: "941277406492",
  appId: "1:941277406492:web:ab4c9780c28bc5f2ce46d9",
  measurementId: "G-R9EEK8BTVD"
};

// Initialize Firebase automatically if it hasn't been initialized yet
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
}

function isFirebaseConfigured() {
  return (
    typeof firebase !== "undefined" &&
    firebase.apps.length > 0 &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.startsWith("AIza")
  );
}