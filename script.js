// script.js — Final Version with Firebase Auth & Full Feature Support

import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const auth = getAuth();
let currentUserEmail = null;
let entries = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
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

  // Auth check
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      currentUserEmail = user.email;
      loadEntries();
      updateCurrentMonth();
      renderEntries();
      updateStats();
    }
  });

  // Logout
  window.logout = function () {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    }).catch((err) => {
      alert("Logout failed: " + err.message);
    });
  };

  // Entry helpers
  function getStorageKey() {
    return `water_entries_${currentUserEmail}`;
  }

  function saveEntries() {
    localStorage.setItem(getStorageKey(), JSON.stringify(entries));
  }

  function loadEntries() {
    const raw = localStorage.getItem(getStorageKey());
    entries = raw ? JSON.parse(raw) : [];
  }

  function updateCurrentMonth() {
    const now = new Date();
    currentMonthElement.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  function updateStats() {
    const totalBottles = entries.reduce((sum, e) => sum + e.bottles, 0);
    const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
    const totalEntries = entries.length;

    totalBottlesElement.textContent = totalBottles;
    totalAmountElement.textContent = `₹${totalAmount}`;
    totalEntriesElement.textContent = totalEntries;
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  function formatTime(timeStr) {
    const [h, m] = timeStr.split(':');
    const d = new Date(); d.setHours(h, m);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });
  }

  // Toast
  function showToast(msg, type = 'info') {
    toastMessage.textContent = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  toastClose.addEventListener('click', () => toast.classList.remove('show'));

  // Add Entry
  addBtn.addEventListener('click', addEntry);
  bottleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addEntry();
  });

  function addEntry() {
    const bottles = parseInt(bottleInput.value);
    if (!bottles || bottles <= 0) return showToast('Enter valid bottle count', 'error');

    const now = new Date();
    const entry = {
      id: Date.now().toString(),
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      bottles,
      amount: bottles * 40
    };

    entries.push(entry);
    saveEntries();
    renderEntries();
    updateStats();
    bottleInput.value = '';
    showToast(`Added ${bottles} bottle${bottles > 1 ? 's' : ''}`, 'success');
  }

  // Render Table
  function renderEntries() {
    tableBody.innerHTML = '';

    if (entries.length === 0) {
      entriesTable.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    entriesTable.style.display = 'table';
    emptyState.style.display = 'none';

    entries.forEach((entry, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${formatDate(entry.date)}</td>
        <td>${formatTime(entry.time)}</td>
        <td>${entry.bottles}</td>
        <td>₹${entry.amount}</td>
        <td class="actions">
          <button class="edit-btn" onclick="startEdit('${entry.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button>
        </td>`;
      tableBody.appendChild(row);
    });
  }

  // Edit
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
      <td><input type="number" id="editBottles" value="${entry.bottles}" min="1"></td>
      <td id="editAmount">₹${entry.amount}</td>
      <td class="actions">
        <button class="save-btn" onclick="saveEdit()">Save</button>
        <button class="cancel-btn" onclick="cancelEdit()">Cancel</button>
      </td>`;

    document.getElementById('editBottles').addEventListener('input', (e) => {
      const b = parseInt(e.target.value) || 0;
      document.getElementById('editAmount').textContent = `₹${b * 40}`;
    });
  };

  window.saveEdit = function () {
    const date = document.getElementById('editDate').value;
    const time = document.getElementById('editTime').value;
    const bottles = parseInt(document.getElementById('editBottles').value);

    if (!date || !time || !bottles || bottles <= 0)
      return showToast('Fill all fields properly', 'error');

    const i = entries.findIndex(e => e.id === editingId);
    if (i !== -1) {
      entries[i] = { ...entries[i], date, time, bottles, amount: bottles * 40 };
    }

    editingId = null;
    saveEntries();
    renderEntries();
    updateStats();
    showToast('Entry updated', 'success');
  };

  window.cancelEdit = function () {
    editingId = null;
    renderEntries();
  };

  window.deleteEntry = function (id) {
    if (confirm('Delete this entry?')) {
      entries = entries.filter(e => e.id !== id);
      saveEntries();
      renderEntries();
      updateStats();
      showToast('Entry deleted', 'success');
    }
  };

  clearBtn.addEventListener('click', () => {
    if (confirm('Clear all entries?')) {
      entries = [];
      saveEntries();
      renderEntries();
      updateStats();
      showToast('All entries cleared', 'success');
    }
  });

  // Export
  exportExcelBtn.addEventListener('click', () => {
    if (!entries.length) return showToast('No data to export', 'error');

    let csv = 'Index,Date,Time,Bottles,Amount\n';
    entries.forEach((e, i) => {
      csv += `${i + 1},${formatDate(e.date)},${formatTime(e.time)},${e.bottles},${e.amount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `water_entries.csv`;
    a.click();
  });

  exportPDFBtn.addEventListener('click', () => {
    if (!entries.length) return showToast('No data to export', 'error');

    const rows = entries.map((e, i) => `
      <tr><td>${i + 1}</td><td>${formatDate(e.date)}</td><td>${formatTime(e.time)}</td><td>${e.bottles}</td><td>₹${e.amount}</td></tr>`).join('');

    const html = `
      <html><head><title>Export PDF</title><style>
      body { font-family: Arial; margin: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
      th { background: #f0f0f0; }
      </style></head><body>
      <h2>Water Bottle Tracker</h2>
      <table>
        <thead><tr><th>#</th><th>Date</th><th>Time</th><th>Bottles</th><th>Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></body></html>`;

    const win = window.open('', '', 'width=800,height=600');
    win.document.write(html);
    win.document.close();
    win.print();
  });

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(r => console.log('SW registered', r))
      .catch(err => console.error('SW error', err));
  }
});
