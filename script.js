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

const bottleInput = document.getElementById('bottleCount');
const addBtn = document.getElementById('addEntry');
const clearBtn = document.getElementById('clearAll');
const exportExcelBtn = document.getElementById('exportExcel');
const exportPDFBtn = document.getElementById('exportPDF');
const tableBody = document.getElementById('entryTableBody');
const entriesTable = document.getElementById('entriesTable');
const emptyState = document.getElementById('emptyState');
const totalBottlesElement = document.getElementById('totalBottles');
const totalAmountElement = document.getElementById('totalAmount');
const totalEntriesElement = document.getElementById('totalEntries');
const currentMonthElement = document.getElementById('currentMonth');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastClose = document.getElementById('toastClose');
const userFullNameElement = document.getElementById('userFullName');

let entries = [];
let editingId = null;

// Auth check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUser = user;
    await displayUserName(user.uid);
    updateCurrentMonth();
    await fetchEntries();
    renderEntries();
    updateStats();
  }
});

// Show user full name
async function displayUserName(uid) {
  try {
    console.log("Fetching user full name for UID:", uid);
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const { firstName, lastName } = userDoc.data();
      console.log("User name fetched:", firstName, lastName);
      if (userFullNameElement) {
        userFullNameElement.textContent = `${firstName} ${lastName}`;
      }
    } else {
      console.warn("User doc not found in Firestore");
    }
  } catch (error) {
    console.error("Error fetching user name:", error);
  }
}

// Events
toastClose.addEventListener('click', hideToast);
addBtn.addEventListener('click', addEntry);
clearBtn.addEventListener('click', clearAllEntries);
exportExcelBtn.addEventListener('click', exportToCSV);
exportPDFBtn.addEventListener('click', exportToPDF);
bottleInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addEntry();
});

window.logout = function () {
  signOut(auth).then(() => window.location.href = "login.html");
};

function updateCurrentMonth() {
  const now = new Date();
  const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  currentMonthElement.textContent = monthYear;
}

async function fetchEntries() {
  entries = [];
  const q = query(collection(db, "entries"), where("uid", "==", currentUser.uid));
  const snapshot = await getDocs(q);
  snapshot.forEach((docSnap) => {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });
}

async function addEntry() {
  const bottles = parseInt(bottleInput.value);
  if (!bottles || bottles <= 0) {
    showToast('Enter a valid number of bottles', 'error');
    return;
  }

  const now = new Date();
  const entry = {
    uid: currentUser.uid,
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    bottles,
    amount: bottles * 40,
  };

  const docRef = await addDoc(collection(db, "entries"), entry);
  entries.push({ ...entry, id: docRef.id });
  bottleInput.value = '';
  renderEntries();
  updateStats();
  showToast('Entry added successfully!', 'success');
}

function renderEntries() {
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
      <td>${formatDate(entry.date)}</td>
      <td>${formatTime(entry.time)}</td>
      <td>${entry.bottles}</td>
      <td>₹${entry.amount}</td>
      <td>
        <button class="edit-btn" onclick="startEdit('${entry.id}')">Edit</button>
        <button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

window.startEdit = function (id) {
  const entry = entries.find(e => e.id === id);
  if (!entry) return;

  editingId = id;
  const index = entries.findIndex(e => e.id === id);
  const row = tableBody.children[index];

  row.innerHTML = `
    <td>${index + 1}</td>
    <td><input type="date" id="editDate" value="${entry.date}"></td>
    <td><input type="time" id="editTime" value="${entry.time}"></td>
    <td><input type="number" id="editBottles" value="${entry.bottles}"></td>
    <td id="editAmount">₹${entry.amount}</td>
    <td>
      <button class="save-btn" onclick="saveEdit()">Save</button>
      <button class="cancel-btn" onclick="cancelEdit()">Cancel</button>
    </td>
  `;

  document.getElementById('editBottles').addEventListener('input', function (e) {
    const bottles = parseInt(e.target.value) || 0;
    document.getElementById('editAmount').textContent = `₹${bottles * 40}`;
  });
};

window.saveEdit = async function () {
  const newDate = document.getElementById('editDate').value;
  const newTime = document.getElementById('editTime').value;
  const newBottles = parseInt(document.getElementById('editBottles').value);

  if (!newDate || !newTime || !newBottles || newBottles <= 0) {
    showToast('Please fill all fields correctly', 'error');
    return;
  }

  const index = entries.findIndex(e => e.id === editingId);
  const updatedEntry = {
    ...entries[index],
    date: newDate,
    time: newTime,
    bottles: newBottles,
    amount: newBottles * 40,
  };

  await updateDoc(doc(db, "entries", editingId), updatedEntry);
  entries[index] = updatedEntry;
  editingId = null;
  renderEntries();
  updateStats();
  showToast('Entry updated successfully!', 'success');
};

window.cancelEdit = function () {
  editingId = null;
  renderEntries();
};

window.deleteEntry = async function (id) {
  if (!confirm("Delete this entry?")) return;
  await deleteDoc(doc(db, "entries", id));
  entries = entries.filter(e => e.id !== id);
  renderEntries();
  updateStats();
  showToast('Entry deleted.', 'success');
};

async function clearAllEntries() {
  if (!confirm("Clear all entries? This cannot be undone.")) return;
  const userEntries = entries.filter(e => e.uid === currentUser.uid);
  for (let entry of userEntries) {
    await deleteDoc(doc(db, "entries", entry.id));
  }
  entries = [];
  renderEntries();
  updateStats();
  showToast("All entries cleared.", "success");
}

function updateStats() {
  const totalBottles = entries.reduce((sum, e) => sum + e.bottles, 0);
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalEntries = entries.length;
  totalBottlesElement.textContent = totalBottles;
  totalAmountElement.textContent = `₹${totalAmount}`;
  totalEntriesElement.textContent = totalEntries;
}

function exportToCSV() {
  if (entries.length === 0) return showToast('No entries to export', 'error');

  let csv = `Water Bottle Tracker\n${currentMonthElement.textContent}\n\n`;
  csv += 'Index,Date,Time,Bottles,Amount\n';
  entries.forEach((e, i) => {
    csv += `${i + 1},${formatDate(e.date)},${formatTime(e.time)},${e.bottles},${e.amount}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'entries.csv';
  link.click();
}

function exportToPDF() {
  if (entries.length === 0) return showToast('No entries to export', 'error');
  const w = window.open('', '', 'width=800,height=600');
  w.document.write(`
    <html><head><title>PDF Export</title></head><body>
    <h1>Water Bottle Tracker - ${currentMonthElement.textContent}</h1>
    <table border="1" cellspacing="0" cellpadding="8">
      <tr><th>#</th><th>Date</th><th>Time</th><th>Bottles</th><th>Amount</th></tr>
      ${entries.map((e, i) => `
        <tr><td>${i + 1}</td><td>${formatDate(e.date)}</td><td>${formatTime(e.time)}</td><td>${e.bottles}</td><td>${e.amount}</td></tr>
      `).join('')}
    </table>
    </body></html>
  `);
  w.document.close();
  w.print();
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB');
}
function formatTime(t) {
  return t;
}
function showToast(msg, type = 'info') {
  toastMessage.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => hideToast(), 3000);
}
function hideToast() {
  toast.classList.remove('show');
}
