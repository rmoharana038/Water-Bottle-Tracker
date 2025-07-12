// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDpCzMa8MkWPi9-5oj0O6q-eCbZ9nxmzms",
  authDomain: "water-bottle-tracker-43537.firebaseapp.com",
  projectId: "water-bottle-tracker-43537",
  storageBucket: "water-bottle-tracker-43537.appspot.com",
  messagingSenderId: "424777349690",
  appId: "1:424777349690:web:54056417c24cd2f0329303",
  measurementId: "G-ZKGP7LC80E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Make logout globally accessible
window.logout = () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    console.error("Logout failed", error);
    alert("Logout failed. Please try again.");
  });
};

// ✅ Check auth before loading UI
onAuthStateChanged(auth, async currentUser => {
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // ✅ User is logged in — show page and continue
  document.body.style.display = "block";
  user = currentUser;
  await loadEntries();
});

let user = null;
let entries = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
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

  function updateCurrentMonth() {
    const now = new Date();
    currentMonthElement.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  updateCurrentMonth();
  toastClose.addEventListener('click', () => toast.classList.remove('show'));

  addBtn.addEventListener('click', addEntry);
  clearBtn.addEventListener('click', clearAllEntries);
  exportExcelBtn.addEventListener('click', exportToCSV);
  exportPDFBtn.addEventListener('click', exportToPDF);
  bottleInput.addEventListener('keypress', e => e.key === 'Enter' && addEntry());

  async function loadEntries() {
    try {
      entries = [];
      const q = query(collection(db, "entries"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      snapshot.forEach(docSnap => {
        entries.push({ id: docSnap.id, ...docSnap.data() });
      });
      renderEntries();
      updateStats();
    } catch (err) {
      console.error(err);
      showToast("Failed to load data", "error");
    }
  }

  async function addEntry() {
    const bottles = parseInt(bottleInput.value);
    if (!bottles || bottles <= 0) return showToast("Enter valid bottle count", "error");

    const now = new Date();
    const entry = {
      uid: user.uid,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      bottles,
      amount: bottles * 40
    };

    try {
      const docRef = await addDoc(collection(db, "entries"), entry);
      entries.push({ id: docRef.id, ...entry });
      bottleInput.value = '';
      renderEntries();
      updateStats();
      showToast(`Added ${bottles} bottle${bottles > 1 ? 's' : ''}`, 'success');
    } catch (err) {
      console.error(err);
      showToast("Failed to add entry", "error");
    }
  }

  window.startEdit = function (id) {
    editingId = id;
    const entry = entries.find(e => e.id === id);
    const index = entries.findIndex(e => e.id === id);
    const row = tableBody.children[index];
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><input type="date" class="edit-input" id="editDate" value="${entry.date}"></td>
      <td><input type="time" class="edit-input" id="editTime" value="${entry.time}"></td>
      <td><input type="number" class="edit-input" id="editBottles" value="${entry.bottles}" min="1"></td>
      <td id="editAmount">₹${entry.amount}</td>
      <td class="actions">
        <button class="save-btn" onclick="saveEdit()">Save</button>
        <button class="cancel-btn" onclick="cancelEdit()">Cancel</button>
      </td>
    `;
    document.getElementById('editBottles').addEventListener('input', e => {
      const amount = parseInt(e.target.value || 0) * 40;
      document.getElementById('editAmount').textContent = `₹${amount}`;
    });
  };

  window.saveEdit = async function () {
    const newDate = document.getElementById('editDate').value;
    const newTime = document.getElementById('editTime').value;
    const newBottles = parseInt(document.getElementById('editBottles').value);

    if (!newDate || !newTime || !newBottles || newBottles <= 0)
      return showToast("Fill all fields correctly", "error");

    const updated = {
      date: newDate,
      time: newTime,
      bottles: newBottles,
      amount: newBottles * 40
    };

    try {
      const ref = doc(db, "entries", editingId);
      await updateDoc(ref, updated);
      const index = entries.findIndex(e => e.id === editingId);
      entries[index] = { ...entries[index], ...updated };
      editingId = null;
      renderEntries();
      updateStats();
      showToast("Entry updated", "success");
    } catch (err) {
      console.error(err);
      showToast("Update failed", "error");
    }
  };

  window.cancelEdit = () => {
    editingId = null;
    renderEntries();
  };

  window.deleteEntry = async function (id) {
    if (!confirm("Delete this entry?")) return;

    try {
      await deleteDoc(doc(db, "entries", id));
      entries = entries.filter(e => e.id !== id);
      renderEntries();
      updateStats();
      showToast("Entry deleted", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete", "error");
    }
  };

  async function clearAllEntries() {
    if (!confirm("Clear all entries? This cannot be undone.")) return;

    try {
      const promises = entries.map(e => deleteDoc(doc(db, "entries", e.id)));
      await Promise.all(promises);
      entries = [];
      renderEntries();
      updateStats();
      showToast("All entries cleared", "success");
    } catch (err) {
      console.error(err);
      showToast("Clear failed", "error");
    }
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
    entries.forEach((e, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${formatDateDisplay(e.date)}</td>
        <td>${formatTimeDisplay(e.time)}</td>
        <td>${e.bottles}</td>
        <td>₹${e.amount}</td>
        <td class="actions">
          <button class="edit-btn" onclick="startEdit('${e.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteEntry('${e.id}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  function updateStats() {
    const totalBottles = entries.reduce((sum, e) => sum + e.bottles, 0);
    const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
    totalBottlesElement.textContent = totalBottles;
    totalAmountElement.textContent = `₹${totalAmount}`;
    totalEntriesElement.textContent = entries.length;
  }

  function formatDateDisplay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatTimeDisplay(timeStr) {
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function showToast(msg, type = "info") {
    toastMessage.textContent = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(r => console.log("Service Worker registered", r))
      .catch(err => console.error("SW registration failed", err));
  }
});
