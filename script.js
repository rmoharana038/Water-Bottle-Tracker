import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

let currentUser = null;
let entryUnsubscribe = null;

// DOM elements
const totalBottlesElement = document.getElementById('totalBottles');
const totalAmountElement = document.getElementById('totalAmount');
const totalEntriesElement = document.getElementById('totalEntries');
const bottleInput = document.getElementById('bottleCount');
const tableBody = document.getElementById('entryTableBody');
const entriesTable = document.getElementById('entriesTable');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastClose = document.getElementById('toastClose');
const currentMonthElement = document.getElementById('currentMonth');
const userName = document.getElementById('userName');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileMobile = document.getElementById('profileMobile');

// Handle auth state
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;
  await loadUserProfile();
  updateCurrentMonth();
  setupEntryListener();
});

// Load profile
async function loadUserProfile() {
  const profileRef = doc(db, "users", currentUser.uid);
  const profileSnap = await getDoc(profileRef);
  if (profileSnap.exists()) {
    const data = profileSnap.data();
    const displayName = data.firstName || "User";
    userName.textContent = `👤 ${displayName}`;
    profileName.textContent = `${data.firstName} ${data.lastName || ""}`;
    profileEmail.textContent = data.email || currentUser.email;
    profileMobile.textContent = data.mobile || "Not set";
  }
}

// Setup live entries listener
function setupEntryListener() {
  if (entryUnsubscribe) entryUnsubscribe();

  const q = query(collection(db, "entries", currentUser.uid, "data"), orderBy("timestamp", "desc"));
  entryUnsubscribe = onSnapshot(q, (snapshot) => {
    const entries = [];
    snapshot.forEach(doc => entries.push({ id: doc.id, ...doc.data() }));
    renderEntries(entries);
    updateStats(entries);
  });
}

// Add entry
document.getElementById('addEntry').addEventListener('click', async () => {
  const bottles = parseInt(bottleInput.value);
  if (!bottles || bottles <= 0) {
    showToast("Enter valid number of bottles", "error");
    return;
  }

  const now = new Date();
  await addDoc(collection(db, "entries", currentUser.uid, "data"), {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    bottles,
    amount: bottles * 40,
    timestamp: now
  });

  bottleInput.value = '';
  showToast(`Added ${bottles} bottle${bottles > 1 ? 's' : ''}`, "success");
});

// Render entries
function renderEntries(entries) {
  if (entries.length === 0) {
    entriesTable.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  entriesTable.style.display = 'table';
  emptyState.style.display = 'none';
  tableBody.innerHTML = '';

  entries.forEach((entry, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${formatDateDisplay(entry.date)}</td>
      <td>${formatTimeDisplay(entry.time)}</td>
      <td>${entry.bottles}</td>
      <td>₹${entry.amount}</td>
      <td class="actions">
        <button onclick="deleteEntry('${entry.id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Delete entry
window.deleteEntry = async (id) => {
  if (!confirm("Delete this entry?")) return;
  await deleteDoc(doc(db, "entries", currentUser.uid, "data", id));
  showToast("Entry deleted", "success");
};

// Export to CSV
document.getElementById('exportExcel').addEventListener('click', async () => {
  const q = query(collection(db, "entries", currentUser.uid, "data"), orderBy("timestamp"));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    showToast("No entries to export", "error");
    return;
  }

  let csv = `Water Tracker\n${currentMonthElement.textContent}\n\nIndex,Date,Time,Bottles,Amount\n`;
  let index = 1, totalBottles = 0, totalAmount = 0;

  snapshot.forEach(doc => {
    const d = doc.data();
    csv += `${index++},${d.date},${d.time},${d.bottles},${d.amount}\n`;
    totalBottles += d.bottles;
    totalAmount += d.amount;
  });

  csv += `\n,,Total,${totalBottles},${totalAmount}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'Water_Tracker.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("CSV downloaded!", "success");
});

// Export to PDF (simplified for brevity)
document.getElementById('exportPDF').addEventListener('click', () => {
  window.print(); // You can enhance this using html2pdf later
});

// Clear All (not needed if stored in Firestore unless you want full delete)
document.getElementById('clearAll').addEventListener('click', async () => {
  if (!confirm("Clear all entries?")) return;
  const q = query(collection(db, "entries", currentUser.uid, "data"));
  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(promises);
  showToast("All entries cleared!", "success");
});

// Logout
window.logout = async () => {
  await signOut(auth);
  window.location.href = "login.html";
};

// Utility
function updateCurrentMonth() {
  const now = new Date();
  currentMonthElement.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
}
function updateStats(entries) {
  const totalBottles = entries.reduce((sum, e) => sum + e.bottles, 0);
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  totalBottlesElement.textContent = totalBottles;
  totalAmountElement.textContent = `₹${totalAmount}`;
  totalEntriesElement.textContent = entries.length;
}
function formatDateDisplay(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTimeDisplay(timeStr) {
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function showToast(message, type = 'info') {
  toastMessage.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}
toastClose.addEventListener('click', () => toast.classList.remove('show'));
