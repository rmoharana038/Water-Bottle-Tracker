import { auth } from './firebase-init.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

document.addEventListener('DOMContentLoaded', function () {
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

  let entries = JSON.parse(localStorage.getItem('water_entries')) || [];
  let editingId = null;

  updateCurrentMonth();
  renderEntries();
  updateStats();

  addBtn.addEventListener('click', addEntry);
  clearBtn.addEventListener('click', confirmClearAll);
  exportExcelBtn.addEventListener('click', exportToCSV);
  exportPDFBtn.addEventListener('click', exportToPDF);
  toastClose.addEventListener('click', hideToast);
  bottleInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      addEntry();
    }
  });

  window.logout = async function () {
  try {
    await signOut(auth);
    // Don't clear entries
    window.location.href = 'login.html';
  } catch (error) {
    showToast('Logout failed', 'error');
    console.error(error);
  }
};

  function updateCurrentMonth() {
    const now = new Date();
    const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    currentMonthElement.textContent = monthYear;
  }

  function addEntry() {
    const bottles = parseInt(bottleInput.value);
    if (!bottles || bottles <= 0) {
      showToast('Please enter a valid number of bottles', 'error');
      return;
    }
    const now = new Date();
    const entry = {
      id: Date.now().toString(),
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      bottles,
      amount: bottles * 40,
    };
    entries.push(entry);
    saveEntries();
    renderEntries();
    updateStats();
    bottleInput.value = '';
    showToast(`Added ${bottles} bottle${bottles > 1 ? 's' : ''} successfully!`, 'success');
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
        <td class="actions">
          <button class="edit-btn" onclick="startEdit('${entry.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button>
        </td>`;
      tableBody.appendChild(row);
    });
  }

  window.startEdit = function (id) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    editingId = id;
    const index = entries.findIndex((e) => e.id === id);
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
      </td>`;
    document.getElementById('editBottles').addEventListener('input', (e) => {
      const bottles = parseInt(e.target.value) || 0;
      const amount = bottles * 40;
      document.getElementById('editAmount').textContent = `₹${amount}`;
    });
  };

  window.saveEdit = function () {
    const newDate = document.getElementById('editDate').value;
    const newTime = document.getElementById('editTime').value;
    const newBottles = parseInt(document.getElementById('editBottles').value);
    if (!newDate || !newTime || !newBottles || newBottles <= 0) {
      showToast('Please fill all fields correctly', 'error');
      return;
    }
    const entryIndex = entries.findIndex((e) => e.id === editingId);
    if (entryIndex !== -1) {
      entries[entryIndex] = {
        ...entries[entryIndex],
        date: newDate,
        time: newTime,
        bottles: newBottles,
        amount: newBottles * 40,
      };
    }
    editingId = null;
    saveEntries();
    renderEntries();
    updateStats();
    showToast('Entry updated successfully!', 'success');
  };

  window.cancelEdit = function () {
    editingId = null;
    renderEntries();
  };

  window.deleteEntry = function (id) {
    if (confirm('Are you sure you want to delete this entry?')) {
      entries = entries.filter((e) => e.id !== id);
      saveEntries();
      renderEntries();
      updateStats();
      showToast('Entry deleted successfully!', 'success');
    }
  };

  function confirmClearAll() {
    if (confirm('Are you sure you want to clear all entries?')) {
      entries = [];
      saveEntries();
      renderEntries();
      updateStats();
      showToast('All entries cleared!', 'success');
    }
  }

  function updateStats() {
    const totalBottles = entries.reduce((sum, e) => sum + e.bottles, 0);
    const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
    totalBottlesElement.textContent = totalBottles;
    totalAmountElement.textContent = `₹${totalAmount}`;
    totalEntriesElement.textContent = entries.length;
  }

  function saveEntries() {
    localStorage.setItem('water_entries', JSON.stringify(entries));
  }

  function exportToCSV() {
    if (entries.length === 0) {
      showToast('No entries to export', 'error');
      return;
    }
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    let csv = `Water Bottle Tracker\n${currentMonth}\n\nIndex,Date,Time,Bottles,Amount\n`;
    let totalBottles = 0;
    let totalAmount = 0;
    entries.forEach((entry, index) => {
      totalBottles += entry.bottles;
      totalAmount += entry.amount;
      csv += `${index + 1},${formatDateDisplay(entry.date)},${formatTimeDisplay(entry.time)},${entry.bottles},${entry.amount}\n`;
    });
    csv += `\n,,Total,${totalBottles},${totalAmount}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `water_bottle_${currentMonth.replace(/\s/g, '_')}.csv`);
    link.click();
    showToast('CSV downloaded!', 'success');
  }

  function exportToPDF() {
    if (entries.length === 0) {
      showToast('No entries to export', 'error');
      return;
    }
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    let totalBottles = 0;
    let totalAmount = 0;
    const rows = entries.map((e, i) => {
      totalBottles += e.bottles;
      totalAmount += e.amount;
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${formatDateDisplay(e.date)}</td>
          <td>${formatTimeDisplay(e.time)}</td>
          <td>${e.bottles}</td>
          <td>₹${e.amount}</td>
        </tr>`;
    }).join('');
    const content = `
      <html><head><title>Water Tracker - ${currentMonth}</title>
      <style>
        body { font-family: Arial; margin: 20px; }
        h1, h3 { text-align: center; color: #3b82f6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; }
        th { background: #f8fafc; }
        .total-row { background: #f1f5f9; font-weight: bold; }
      </style></head><body>
        <h1>Water Bottle Tracker</h1><h3>${currentMonth}</h3>
        <table><thead><tr>
          <th>#</th><th>Date</th><th>Time</th><th>Bottles</th><th>Amount</th>
        </tr></thead><tbody>${rows}
          <tr class="total-row">
            <td colspan="3" style="text-align: right;">Total</td>
            <td>${totalBottles}</td><td>₹${totalAmount}</td>
          </tr></tbody></table>
      </body></html>`;
    const win = window.open('', '', 'width=800,height=600');
    win.document.write(content);
    win.document.close();
    win.print();
    showToast('PDF generated!', 'success');
  }

  function formatDateDisplay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatTimeDisplay(timeStr) {
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => hideToast(), 3000);
  }

  function hideToast() {
    toast.classList.remove('show');
  }

  // PWA: Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(
        (reg) => console.log('SW registered: ', reg),
        (err) => console.log('SW registration failed: ', err)
      );
    });
  }
});
