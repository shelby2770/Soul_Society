import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB5uI_zznx6Zrb6IgpNjyeuV8OuiDKAKV0",
  authDomain: "soul-society-88a69.firebaseapp.com",
  projectId: "soul-society-88a69",
  storageBucket: "soul-society-88a69.firebasestorage.app",
  messagingSenderId: "240554581414",
  appId: "1:240554581414:web:5691c22104402f61bc4367",
  measurementId: "G-KS7S009PPY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");
// const googleProvider = new GoogleAuthProvider();
// googleProvider.addScope("https://www.googleapis.com/auth/userinfo.email");
// googleProvider.addScope("https://www.googleapis.com/auth/userinfo.profile");
// googleProvider.setCustomParameters({
//   prompt: "select_account",
//   login_hint: "",
// });

export { auth, googleProvider, db };
