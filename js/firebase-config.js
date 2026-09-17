// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8f9V7vbmFgsk0NUGaC2P9Nzia6xucssc",
  authDomain: "rare-ff-tournaments.firebaseapp.com",
  projectId: "rare-ff-tournaments",
  storageBucket: "rare-ff-tournaments.firebasestorage.app",
  messagingSenderId: "941277406492",
  appId: "1:941277406492:web:ab4c9780c28bc5f2ce46d9",
  measurementId: "G-R9EEK8BTVD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);