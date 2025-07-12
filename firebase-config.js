// firebase-config.js
export const firebaseConfig = {
  apiKey: "AIzaSyDpCzMa8MkWPi9-5oj0O6q-eCbZ9nxmzms",
  authDomain: "water-bottle-tracker-43537.firebaseapp.com",
  projectId: "water-bottle-tracker-43537",
  storageBucket: "water-bottle-tracker-43537.appspot.com",
  messagingSenderId: "424777349690",
  appId: "1:424777349690:web:54056417c24cd2f0329303"
};
import { enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("Persistence can only be enabled in one tab at a time.");
  } else if (err.code === 'unimplemented') {
    console.warn("This browser doesn't support offline persistence.");
  }
});
