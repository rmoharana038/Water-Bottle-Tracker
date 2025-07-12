// auth.js (Firebase Auth logic using modules)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpCzMa8MkWPi9-5oj0O6q-eCbZ9nxmzms",
  authDomain: "water-bottle-tracker-43537.firebaseapp.com",
  projectId: "water-bottle-tracker-43537",
  storageBucket: "water-bottle-tracker-43537.appspot.com",
  messagingSenderId: "424777349690",
  appId: "1:424777349690:web:54056417c24cd2f0329303",
  measurementId: "G-ZKGP7LC80E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------------------------
// Signup
// ---------------------------
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Account created successfully!");
      localStorage.setItem("currentUser", email);
      window.location.href = "index.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

// ---------------------------
// Login
// ---------------------------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("currentUser", email);
      window.location.href = "index.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

// ---------------------------
// Reset Password
// ---------------------------
const resetForm = document.getElementById("resetForm");
if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("resetEmail").value;

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
      window.location.href = "login.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

// ---------------------------
// Logout (used in index.html)
// ---------------------------
window.logout = function () {
  signOut(auth)
    .then(() => {
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    })
    .catch((error) => {
      alert("Logout error: " + error.message);
    });
};
