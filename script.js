// script.js (Firestore version)
import { auth, db } from './firebase-init.js';
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// DOM Elements
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

let entries = [];
let currentUser = null;
let editingId = null;

// Auth state listener
onAuthStateChanged(auth, async user => {
  if (!user) return location.href = 'login.html';
  currentUser = user;
  updateCurrentMonth();
  await fetchEntries();
});

// Current month display
function updateCurrentMonth() {
  const now = new Date();
  currentMonthElement.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Event listeners
addBtn.addEventListener('click', addEntry);
clearBtn.addEventListener('click', confirmClearAll);
exportExcelBtn.addEventListener('click', exportToCSV);
exportPDFBtn.addEventListener('click', exportToPDF);
toastClose.addEventListener('click', hideToast);
bottleInput.addEventListener('keypress', e => e.key === 'Enter' && addEntry());

async function fetchEntries() {
  entries = [];
  const q = query(collection(db, 'entries'), where('uid', '==', currentUser.uid));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach(docSnap => entries.push({ id: docSnap.id, ...docSnap.data() }));
  renderEntries();
  updateStats();
}

async function addEntry() {
  const bottles = parseInt(bottleInput.value);
  if (!bottles || bottles <= 0) return showToast('Enter valid number of bottles', 'error');

  const now = new Date();
const newEntry = {
  uid: currentUser.uid,
  date: ...,
  ...
};

  const docRef = await addDoc(collection(db, 'entries'), newEntry);
  entries.push({ id: docRef.id, ...newEntry });
  bottleInput.value = '';
  renderEntries();
  updateStats();
  showToast(`Added ${bottles} bottle(s)`, 'success');
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
      <td>${formatDateDisplay(entry.date)}</td>
      <td>${formatTimeDisplay(entry.time)}</td>
      <td>${entry.bottles}</td>
      <td>₹${entry.amount}</td>
      <td>
        <button class="edit-btn" onclick="startEdit('${entry.id}')">Edit</button>
        <button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button>
      </td>`;
    tableBody.appendChild(row);
  });
}

window.startEdit = function(id) {
  const entry = entries.find(e => e.id === id);
  const index = entries.findIndex(e => e.id === id);
  editingId = id;
  const row = tableBody.children[index];
  row.innerHTML = `
    <td>${index + 1}</td>
    <td><input type="date" id="editDate" value="${entry.date}"></td>
    <td><input type="time" id="editTime" value="${entry.time}"></td>
    <td><input type="number" id="editBottles" value="${entry.bottles}" min="1"></td>
    <td id="editAmount">₹${entry.amount}</td>
    <td>
      <button class="save-btn" onclick="saveEdit()">Save</button>
      <button class="cancel-btn" onclick="cancelEdit()">Cancel</button>
    </td>`;
  document.getElementById('editBottles').addEventListener('input', function(e) {
    document.getElementById('editAmount').textContent = `₹${parseInt(e.target.value || 0) * 40}`;
  });
};

window.saveEdit = async function() {
  const newDate = document.getElementById('editDate').value;
  const newTime = document.getElementById('editTime').value;
  const newBottles = parseInt(document.getElementById('editBottles').value);
  if (!newDate || !newTime || !newBottles) return showToast('Fill all fields correctly', 'error');

  const entryIndex = entries.findIndex(e => e.id === editingId);
  const updated = {
    ...entries[entryIndex],
    date: newDate,
    time: newTime,
    bottles: newBottles,
    amount: newBottles * 40
  };

  await updateDoc(doc(db, 'entries', editingId), updated);
  entries[entryIndex] = updated;
  editingId = null;
  renderEntries();
  updateStats();
  showToast('Entry updated', 'success');
};

window.cancelEdit = function() {
  editingId = null;
  renderEntries();
};

window.deleteEntry = async function(id) {
  if (!confirm('Delete this entry?')) return;
  await deleteDoc(doc(db, 'entries', id));
  entries = entries.filter(e => e.id !== id);
  renderEntries();
  updateStats();
  showToast('Deleted successfully', 'success');
};

async function confirmClearAll() {
  if (!confirm('Clear ALL entries?')) return;
  for (let e of entries) {
    await deleteDoc(doc(db, 'entries', e.id));
  }
  entries = [];
  renderEntries();
  updateStats();
  showToast('All entries cleared', 'success');
}

function updateStats() {
  const totalBottles = entries.reduce((sum, e) => sum + e.bottles, 0);
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  totalBottlesElement.textContent = totalBottles;
  totalAmountElement.textContent = `₹${totalAmount}`;
  totalEntriesElement.textContent = entries.length;
}

function formatDateDisplay(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeDisplay(timeStr) {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function showToast(msg, type = 'info') {
  toastMessage.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(hideToast, 3000);
}

function hideToast() {
  toast.classList.remove('show');
}

window.logout = async function () {
  await signOut(auth);
  location.href = 'login.html';
};
