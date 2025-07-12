// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDpCzMa8MkWPi9-5oj0O6q-eCbZ9nxmzms",
  authDomain: "water-bottle-tracker-43537.firebaseapp.com",
  projectId: "water-bottle-tracker-43537",
  storageBucket: "water-bottle-tracker-43537.appspot.com",
  messagingSenderId: "424777349690",
  appId: "1:424777349690:web:54056417c24cd2f0329303"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
