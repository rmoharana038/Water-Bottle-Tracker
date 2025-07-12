// Water Bottle Tracker JavaScript

document.addEventListener('DOMContentLoaded', function() {
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

    // Data storage
    let entries = JSON.parse(localStorage.getItem('water_entries')) || [];
    let editingId = null;

    // Initialize app
    updateCurrentMonth();
    renderEntries();
    updateStats();

    // Event listeners
    addBtn.addEventListener('click', addEntry);
    clearBtn.addEventListener('click', confirmClearAll);
    exportExcelBtn.addEventListener('click', exportToCSV);
    exportPDFBtn.addEventListener('click', exportToPDF);
    toastClose.addEventListener('click', hideToast);
    
    bottleInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addEntry();
        }
    });

    // Update current month display
    function updateCurrentMonth() {
        const now = new Date();
        const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        currentMonthElement.textContent = monthYear;
    }

    // Add new entry
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
            bottles: bottles,
            amount: bottles * 40
        };

        entries.push(entry);
        saveEntries();
        renderEntries();
        updateStats();
        bottleInput.value = '';
        
        showToast(`Added ${bottles} bottle${bottles > 1 ? 's' : ''} successfully!`, 'success');
    }

    // Render entries table
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
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Start editing entry
    window.startEdit = function(id) {
        const entry = entries.find(e => e.id === id);
        if (!entry) return;

        editingId = id;
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

        // Update amount when bottles change
        document.getElementById('editBottles').addEventListener('input', function(e) {
            const bottles = parseInt(e.target.value) || 0;
            const amount = bottles * 40;
            document.getElementById('editAmount').textContent = `₹${amount}`;
        });
    };

    // Save edited entry
    window.saveEdit = function() {
        const newDate = document.getElementById('editDate').value;
        const newTime = document.getElementById('editTime').value;
        const newBottles = parseInt(document.getElementById('editBottles').value);

        if (!newDate || !newTime || !newBottles || newBottles <= 0) {
            showToast('Please fill all fields correctly', 'error');
            return;
        }

        const entryIndex = entries.findIndex(e => e.id === editingId);
        if (entryIndex !== -1) {
            entries[entryIndex] = {
                ...entries[entryIndex],
                date: newDate,
                time: newTime,
                bottles: newBottles,
                amount: newBottles * 40
            };
        }

        editingId = null;
        saveEntries();
        renderEntries();
        updateStats();
        showToast('Entry updated successfully!', 'success');
    };

    // Cancel editing
    window.cancelEdit = function() {
        editingId = null;
        renderEntries();
    };

    // Delete entry
    window.deleteEntry = function(id) {
        if (confirm('Are you sure you want to delete this entry?')) {
            entries = entries.filter(e => e.id !== id);
            saveEntries();
            renderEntries();
            updateStats();
            showToast('Entry deleted successfully!', 'success');
        }
    };

    // Confirm clear all entries
    function confirmClearAll() {
        if (confirm('Are you sure you want to clear all entries? This action cannot be undone.')) {
            entries = [];
            saveEntries();
            renderEntries();
            updateStats();
            showToast('All entries cleared successfully!', 'success');
        }
    }

    // Update statistics
    function updateStats() {
        const totalBottles = entries.reduce((sum, entry) => sum + entry.bottles, 0);
        const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
        const totalEntries = entries.length;

        totalBottlesElement.textContent = totalBottles;
        totalAmountElement.textContent = `₹${totalAmount}`;
        totalEntriesElement.textContent = totalEntries;
    }

    // Save entries to localStorage
    function saveEntries() {
        localStorage.setItem('water_entries', JSON.stringify(entries));
    }

    // Export to CSV
    function exportToCSV() {
        if (entries.length === 0) {
            showToast('No entries to export', 'error');
            return;
        }

        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        let csv = `Water Bottle Tracker\n${currentMonth}\n\n`;
        csv += 'Index,Date,Time,Bottles (20L),Amount (₹)\n';

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
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `water_bottle_entries_${currentMonth.replace(' ', '_')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        showToast('CSV file downloaded successfully!', 'success');
    }

    // Export to PDF
    function exportToPDF() {
        if (entries.length === 0) {
            showToast('No entries to export', 'error');
            return;
        }

        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        let totalBottles = 0;
        let totalAmount = 0;

        const tableRows = entries.map((entry, index) => {
            totalBottles += entry.bottles;
            totalAmount += entry.amount;
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${formatDateDisplay(entry.date)}</td>
                    <td>${formatTimeDisplay(entry.time)}</td>
                    <td>${entry.bottles}</td>
                    <td>₹${entry.amount}</td>
                </tr>
            `;
        }).join('');

        const printContent = `
            <html>
            <head>
                <title>Water Bottle Tracker - ${currentMonth}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { text-align: center; color: #3b82f6; margin-bottom: 10px; }
                    h3 { text-align: center; color: #6b7280; margin-bottom: 30px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f8fafc; font-weight: bold; }
                    .total-row { background-color: #f1f5f9; font-weight: bold; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <h1>Water Bottle Tracker</h1>
                <h3>${currentMonth}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Bottles (20L)</th>
                            <th>Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;"><strong>Total</strong></td>
                            <td><strong>${totalBottles}</strong></td>
                            <td><strong>₹${totalAmount}</strong></td>
                        </tr>
                    </tbody>
                </table>
                <div class="footer">
                    Generated on ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        
        showToast('PDF generated successfully!', 'success');
    }

    // Format date for display
    function formatDateDisplay(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    // Format time for display
    function formatTimeDisplay(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        toastMessage.textContent = message;
        toast.className = `toast show ${type}`;
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            hideToast();
        }, 3000);
    }

    // Hide toast notification
    function hideToast() {
        toast.classList.remove('show');
    }

    // Service Worker Registration for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
});
