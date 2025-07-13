import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from './firebase-init.js';

const auth = getAuth();
let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUser = user;

    // ✅ Get and display full name
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const { firstName, lastName } = userDoc.data();
      const fullName = `${firstName} ${lastName}`;
      document.getElementById("userNameDisplay").textContent = `👤 ${fullName}`;
    }

    updateCurrentMonth();
    await fetchEntries();
    renderEntries();
    updateStats();
  }
});
