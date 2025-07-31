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
const monthFilter = document.getElementById('monthFilter');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastClose = document.getElementById('toastClose');
const userFullNameElement = document.getElementById('userFullName');

let entries = [];
let editingId = null;

// Firebase Auth check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUser = user;
    await displayUserName(user.uid);
    populateMonthFilter();
    updateCurrentMonth();
    await fetchEntries();
    renderEntries();
    updateStats();
  }
});

async function displayUserName(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const { firstName, lastName } = userDoc.data();
      if (userFullNameElement) {
        userFullNameElement.textContent = `${firstName} ${lastName}`;
      }
    }
  } catch (error) {
    console.error("Error fetching user name:", error);
  }
}

// Button events
toastClose.addEventListener('click', hideToast);
addBtn.addEventListener('click', addEntry);
clearBtn.addEventListener('click', clearAllEntries);

exportPDFBtn.addEventListener('click', exportToPDF);
bottleInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addEntry();
});

window.logout = function () {
  signOut(auth).then(() => window.location.href = "login.html");
};

window.exportToExcel = exportToExcel;
window.exportToPDF = exportToPDF;

function populateMonthFilter() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Add options for the last 12 months (including current)
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const value = `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = `${monthName} ${year}`;
    monthFilter.appendChild(option);
  }
  monthFilter.value = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
}

monthFilter.addEventListener('change', async () => {
  await fetchEntries();
  renderEntries();
  updateStats();
});

function updateCurrentMonth() {
  const selectedMonthYear = monthFilter.value.split('-');
  const selectedYear = parseInt(selectedMonthYear[0]);
  const selectedMonth = parseInt(selectedMonthYear[1]);
  const date = new Date(selectedYear, selectedMonth - 1, 1);
  const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
  currentMonthElement.textContent = monthYear;
}

async function fetchEntries() {
  entries = [];
  const selectedMonthYear = monthFilter.value.split('-');
  const selectedYear = parseInt(selectedMonthYear[0]);
  const selectedMonth = parseInt(selectedMonthYear[1]);

  // Calculate start and end dates for the selected month
  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
  const startDateString = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;
  const endDateString = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;

  console.log("Start Date String for Query:", startDateString);
  console.log("End Date String for Query:", endDateString);

  const q = query(
    collection(db, "entries"),
    where("uid", "==", currentUser.uid),
    where("date", ">=", startDateString),
    where("date", "<=", endDateString)
  );
  const snapshot = await getDocs(q);
  snapshot.forEach((docSnap) => {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
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
  // Sort entries by date (descending) and then by time (descending)
  entries.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA - dateB;
  });

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
      <td class="actions">
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
    <td class="actions">
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
  for (let entry of entries) {
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
  totalBottlesElement.textContent = totalBottles;
  totalAmountElement.textContent = `₹${totalAmount}`;
  totalEntriesElement.textContent = entries.length;
}

function exportToExcel() {
  if (entries.length === 0) return showToast('No entries to export', 'error');

  const monthYear = currentMonthElement.textContent.replace(' ', '-');
  const filename = `Water_Bottle_Tracker_Report_${monthYear}.xlsx`;

  // Prepare data for XLSX
  const data = [
    ['Water Bottle Tracker Report'], // A1
    [], // A2 (empty row for spacing)
    ['Month/Year:', currentMonthElement.textContent], // A3, B3
    [], // A4 (empty row for spacing)
    ['Summary:'], // A5
    ['Total Bottles:', totalBottlesElement.textContent], // A6, B6
    ['Total Amount:', totalAmountElement.textContent], // A7, B7
    ['Total Entries:', totalEntriesElement.textContent], // A8, B8
    [], // A9 (empty row for spacing)
    ['#', 'Date', 'Time', 'Bottles', 'Amount'] // A10:E10
  ];

  entries.forEach((entry, index) => {
    data.push([index + 1, formatDate(entry.date), formatTime(entry.time), entry.bottles, `₹${entry.amount}`]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Apply styles
  // Main Title (A1)
  ws['A1'].s = {
    font: { sz: 20, bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1E88E5" } }, // Deeper blue
    alignment: { horizontal: "center", vertical: "center" }
  };
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]; // Merge A1:E1

  // Month/Year (A3, B3)
  ws['A3'].s = { font: { sz: 14, bold: true }, alignment: { horizontal: "left" } };
  ws['B3'].s = { font: { sz: 14 }, alignment: { horizontal: "left" } };

  // Summary Header (A5)
  ws['A5'].s = {
    font: { sz: 16, bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "2E7D32" } }, // Darker green
    alignment: { horizontal: "center" }
  };
  ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 1 } }); // Merge A5:B5

  // Summary Data (A6:B8)
  for (let i = 5; i <= 7; i++) { // Rows 6, 7, 8
    ws[`A${i + 1}`].s = { font: { bold: true }, fill: { fgColor: { rgb: "E8F5E9" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    ws[`B${i + 1}`].s = { font: { bold: true }, fill: { fgColor: { rgb: "E8F5E9" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
  }

  // Table Headers (A10:E10)
  const tableHeaderRow = 9; // 0-indexed row 9 is Excel row 10
  const tableHeaders = ['#', 'Date', 'Time', 'Bottles', 'Amount'];
  for (let i = 0; i < tableHeaders.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: tableHeaderRow, c: i });
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
      fill: { fgColor: { rgb: "455A64" } }, // Dark grey
      alignment: { horizontal: "center" },
      border: { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } } // Thicker borders
    };
  }

  // Table Data (from row 11 onwards)
  for (let r = 0; r < entries.length; r++) {
    const rowNum = tableHeaderRow + 1 + r;
    const rowColor = r % 2 === 0 ? "F5F5F5" : "FFFFFF"; // Alternating row colors
    for (let c = 0; c < 5; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: rowNum, c: c });
      if (!ws[cellRef]) ws[cellRef] = {}; // Create cell if it doesn't exist
      ws[cellRef].s = {
        fill: { fgColor: { rgb: rowColor } },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
      };
      if (c === 3 || c === 4) { // Bottles and Amount columns
        ws[cellRef].s.alignment = { horizontal: "right" };
      }
    }
  }

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },  // #
    { wch: 15 }, // Date
    { wch: 10 }, // Time
    { wch: 12 }, // Bottles
    { wch: 15 }  // Amount
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Entries");

  // Generate and download XLSX file
  XLSX.writeFile(wb, filename);

}

function exportToPDF() {
  if (entries.length === 0) return showToast('No entries to export', 'error');

  const monthYear = currentMonthElement.textContent.replace(' ', '-');
  const filename = `Water_Bottle_Tracker_Report_${monthYear}.pdf`;

  const w = window.open('', '', 'width=800,height=600');
  w.document.title = filename;
  w.document.write(`
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; color: #333; margin-bottom: 20px; }
        .report-info { text-align: center; margin-bottom: 30px; color: #555; }
        .summary-table { width: 50%; margin: 0 auto 30px auto; border-collapse: collapse; }
        .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .summary-table th { background-color: #f2f2f2; }
        .entries-table { width: 100%; border-collapse: collapse; }
        .entries-table th, .entries-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .entries-table th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>Water Bottle Tracker Report</h1>
      <div class="report-info">Month/Year: ${currentMonthElement.textContent}</div>

      <h2>Summary</h2>
      <table class="summary-table">
        <tr><th>Total Bottles</th><td>${totalBottlesElement.textContent}</td></tr>
        <tr><th>Total Amount</th><td>${totalAmountElement.textContent}</td></tr>
        <tr><th>Total Entries</th><td>${totalEntriesElement.textContent}</td></tr>
      </table>

      <h2>Entries</h2>
      <table class="entries-table">
        <thead>
          <tr><th>#</th><th>Date</th><th>Time</th><th>Bottles</th><th>Amount</th></tr>
        </thead>
        <tbody>
          ${entries.map((e, i) => `
            <tr><td>${i + 1}</td><td>${formatDate(e.date)}</td><td>${formatTime(e.time)}</td><td>${e.bottles}</td><td>${e.amount}</td></tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
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
