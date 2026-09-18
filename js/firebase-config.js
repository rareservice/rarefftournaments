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

function isFirebaseConfigured() {
  return (
    typeof firebase !== "undefined" &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.startsWith("AIza")
  );
}