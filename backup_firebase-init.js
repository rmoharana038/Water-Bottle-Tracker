// firebase-init.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpCzMa8MkWPi9-5oj0O6q-eCbZ9nxmzms",
  authDomain: "water-bottle-tracker-43537.firebaseapp.com",
  projectId: "water-bottle-tracker-43537",
  storageBucket: "water-bottle-tracker-43537.appspot.com",
  messagingSenderId: "424777349690",
  appId: "1:424777349690:web:54056417c24cd2f0329303"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence and multi-tab support
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Firebase Auth
const auth = getAuth(app);

// Export both for use in other files
export { auth, db };
