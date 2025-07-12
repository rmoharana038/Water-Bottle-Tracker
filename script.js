import { auth, db } from "./firebase-init.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, addDoc, updateDoc, deleteDoc,
  collection, query, orderBy, onSnapshot, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements
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

let currentUser = null;
let entryUnsubscribe = null;
let currentEntries = [];
let editingId = null;

// Auth listener
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

async function loadUserProfile() {
  const profileRef = doc(db, "users", currentUser.uid);
  const snap = await getDoc(profileRef);
  if (snap.exists()) {
    const d = snap.data();
    userName.textContent = `👤 ${d.firstName || "User"}`;
    profileName.textContent = `${d.firstName || ""} ${d.lastName || ""}`;
    profileEmail.textContent = d.email || currentUser.email;
    profileMobile.textContent = d.mobile || "Not set";
  }
}

function setupEntryListener() {
  if (entryUnsubscribe) entryUnsubscribe();

  const q = query(collection(db, "entries", currentUser.uid, "data"), orderBy("timestamp", "desc"));
  entryUnsubscribe = onSnapshot(q, (snapshot) => {
    const entries = [];
    snapshot.forEach(doc => entries.push({ id: doc.id, ...doc.data() }));
    currentEntries = entries;
    renderEntries(entries);
    updateStats(entries);
  });
}

// Add Entry
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

// Render Entries
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

    if (editingId === entry.id) {
      row.innerHTML = `
        <td>${index + 1}</td>
        <td><input type="date" id="editDate" value="${entry.date}"></td>
        <td><input type="time" id="editTime" value="${entry.time}"></td>
        <td><input type="number" id="editBottles" value="${entry.bottles}" min="1"></td>
        <td id="editAmount">₹${entry.amount}</td>
        <td class="actions">
          <button class="save-btn" onclick="saveEdit('${entry.id}')">Save</button>
          <button class="cancel-btn" onclick="cancelEdit()">Cancel</button>
        </td>
      `;
      setTimeout(() => {
        document.getElementById('editBottles').addEventListener('input', function(e) {
          const amt = (parseInt(e.target.value) || 0) * 40;
          document.getElementById('editAmount').textContent = `₹${amt}`;
        });
      }, 10);
    } else {
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${formatDateDisplay(entry.date)}</td>
        <td>${formatTimeDisplay(entry.time)}</td>
        <td>${entry.bottles}</td>
        <td>₹${entry.amount}</td>
        <td class="actions">
          <button class="edit-btn" onclick="startEdit('${entry.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button>
        </td>
      `;
    }

    tableBody.appendChild(row);
  });
}

// Edit
window.startEdit = function(id) {
  editingId = id;
  renderEntries(currentEntries);
};

// Save Edit
window.saveEdit = async function(id) {
  const newDate = document.getElementById('editDate').value;
  const newTime = document.getElementById('editTime').value;
  const newBottles = parseInt(document.getElementById('editBottles').value);

  if (!newDate || !newTime || !newBottles || newBottles <= 0) {
    showToast("Please enter all fields correctly", "error");
    return;
  }

  await updateDoc(doc(db, "entries", currentUser.uid, "data", id), {
    date: newDate,
    time: newTime,
    bottles: newBottles,
    amount: newBottles * 40
  });

  editingId = null;
  showToast("Entry updated", "success");
};

// Cancel Edit
window.cancelEdit = function() {
  editingId = null;
  renderEntries(currentEntries);
};

// Delete Entry
window.deleteEntry = async function(id) {
  if (!confirm("Delete this entry?")) return;
  await deleteDoc(doc(db, "entries", currentUser.uid, "data", id));
  showToast("Entry deleted", "success");
};

// Export CSV
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

// Export PDF (print)
document.getElementById('exportPDF').addEventListener('click', () => {
  window.print();
});

// Clear All
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

// Helpers
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
