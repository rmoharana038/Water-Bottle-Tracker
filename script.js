// Water Bottle Tracker - Firebase Auth + LocalStorage for entries

import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const auth = getAuth();
let currentUserEmail = null;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        currentUserEmail = user.email;
        initApp(); // Only init after user is ready
    }
});

function getStorageKey() {
    return `water_entries_${currentUserEmail}`;
}

function initApp() {
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
        const logoutBtn = document.getElementById('logoutBtn');

        let entries = JSON.parse(localStorage.getItem(getStorageKey())) || [];
        let editingId = null;

        // Init
        updateMonth();
        renderEntries();
        updateStats();

        logoutBtn?.addEventListener('click', () => {
            signOut(auth).then(() => window.location.href = "login.html");
        });

        addBtn.addEventListener('click', addEntry);
        bottleInput.addEventListener('keypress', e => { if (e.key === 'Enter') addEntry(); });
        clearBtn.addEventListener('click', clearAll);
        exportExcelBtn.addEventListener('click', exportToCSV);
        exportPDFBtn.addEventListener('click', exportToPDF);
        toastClose.addEventListener('click', () => toast.classList.remove('show'));

        function updateMonth() {
            const now = new Date();
            currentMonthElement.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        }

        function saveEntries() {
            localStorage.setItem(getStorageKey(), JSON.stringify(entries));
        }

        function showToast(msg, type = 'info') {
            toastMessage.textContent = msg;
            toast.className = `toast show ${type}`;
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        function addEntry() {
            const bottles = parseInt(bottleInput.value);
            if (!bottles || bottles <= 0) return showToast("Enter a valid number", "error");

            const now = new Date();
            const entry = {
                id: Date.now().toString(),
                date: now.toISOString().split("T")[0],
                time: now.toTimeString().slice(0, 5),
                bottles,
                amount: bottles * 40
            };

            entries.push(entry);
            saveEntries();
            renderEntries();
            updateStats();
            bottleInput.value = '';
            showToast("Entry added!", "success");
        }

        window.startEdit = (id) => {
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
                <td>
                    <button onclick="saveEdit()">Save</button>
                    <button onclick="cancelEdit()">Cancel</button>
                </td>`;

            document.getElementById('editBottles').addEventListener('input', function () {
                const b = parseInt(this.value) || 0;
                document.getElementById('editAmount').textContent = `₹${b * 40}`;
            });
        };

        window.saveEdit = () => {
            const newDate = document.getElementById('editDate').value;
            const newTime = document.getElementById('editTime').value;
            const newBottles = parseInt(document.getElementById('editBottles').value);

            if (!newDate || !newTime || newBottles <= 0) return showToast("Fill correctly", "error");

            const idx = entries.findIndex(e => e.id === editingId);
            entries[idx] = {
                ...entries[idx],
                date: newDate,
                time: newTime,
                bottles: newBottles,
                amount: newBottles * 40
            };

            editingId = null;
            saveEntries();
            renderEntries();
            updateStats();
            showToast("Entry updated", "success");
        };

        window.cancelEdit = () => {
            editingId = null;
            renderEntries();
        };

        window.deleteEntry = (id) => {
            if (confirm("Delete this entry?")) {
                entries = entries.filter(e => e.id !== id);
                saveEntries();
                renderEntries();
                updateStats();
                showToast("Entry deleted", "success");
            }
        };

        function clearAll() {
            if (confirm("Clear all entries?")) {
                entries = [];
                saveEntries();
                renderEntries();
                updateStats();
                showToast("All entries cleared", "success");
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
                    <td>${formatDate(e.date)}</td>
                    <td>${formatTime(e.time)}</td>
                    <td>${e.bottles}</td>
                    <td>₹${e.amount}</td>
                    <td>
                        <button onclick="startEdit('${e.id}')">Edit</button>
                        <button onclick="deleteEntry('${e.id}')">Delete</button>
                    </td>`;
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

        function formatDate(d) {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        function formatTime(t) {
            const [h, m] = t.split(':');
            const d = new Date();
            d.setHours(h, m);
            return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }

        function exportToCSV() {
            if (entries.length === 0) return showToast("No entries to export", "error");

            const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
            let csv = `Water Bottle Tracker\n${currentMonth}\n\nIndex,Date,Time,Bottles,Amount\n`;

            let totalBottles = 0, totalAmount = 0;

            entries.forEach((e, i) => {
                csv += `${i + 1},${formatDate(e.date)},${formatTime(e.time)},${e.bottles},${e.amount}\n`;
                totalBottles += e.bottles;
                totalAmount += e.amount;
            });

            csv += `\n,,Total,${totalBottles},${totalAmount}`;
            const blob = new Blob([csv], { type: "text/csv" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `water_entries_${currentMonth.replace(' ', '_')}.csv`;
            link.click();
        }

        function exportToPDF() {
            if (entries.length === 0) return showToast("No entries to export", "error");

            const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
            let totalBottles = 0, totalAmount = 0;

            const rows = entries.map((e, i) => {
                totalBottles += e.bottles;
                totalAmount += e.amount;
                return `<tr><td>${i + 1}</td><td>${formatDate(e.date)}</td><td>${formatTime(e.time)}</td><td>${e.bottles}</td><td>₹${e.amount}</td></tr>`;
            }).join('');

            const html = `
                <html><head><title>${month}</title><style>
                    body{font-family:sans-serif;margin:20px;}
                    table{width:100%;border-collapse:collapse}
                    th,td{border:1px solid #ccc;padding:8px;text-align:left}
                    th{background:#f0f0f0}
                </style></head><body>
                <h2>Water Bottle Tracker - ${month}</h2>
                <table><thead><tr><th>#</th><th>Date</th><th>Time</th><th>Bottles</th><th>Amount</th></tr></thead>
                <tbody>${rows}
                <tr><td colspan="3" style="text-align:right"><b>Total</b></td><td><b>${totalBottles}</b></td><td><b>₹${totalAmount}</b></td></tr>
                </tbody></table></body></html>`;

            const win = window.open('', '', 'width=800,height=600');
            win.document.write(html);
            win.document.close();
            win.print();
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW registered:', reg))
                .catch(err => console.log('SW registration failed:', err));
        }
    });
}
