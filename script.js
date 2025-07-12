import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  enableIndexedDbPersistence,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from './firebase-init.js';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline support
enableIndexedDbPersistence(db).catch(err => {
  console.warn("Offline persistence error:", err);
});

const bottleInput = document.getElementById("bottleCount");
const addBtn = document.getElementById("addEntry");
const tableBody = document.getElementById("entryTableBody");
const entriesTable = document.getElementById("entriesTable");
const emptyState = document.getElementById("emptyState");
const currentMonthElement = document.getElementById("currentMonth");
const totalBottlesElement = document.getElementById("totalBottles");
const totalAmountElement = document.getElementById("totalAmount");
const totalEntriesElement = document.getElementById("totalEntries");
const clearBtn = document.getElementById("clearAll");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const toastClose = document.getElementById("toastClose");
const exportExcelBtn = document.getElementById("exportExcel");
const exportPDFBtn = document.getElementById("exportPDF");

const profileName = document.getElementById("profileName");
const dropdownName = document.getElementById("dropdownName");
const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");

let currentUser = null;
let editingId = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
  } else {
    currentUser = user;
    updateCurrentMonth();
    await loadEntries();
    await loadProfile();
  }
});

function getUserCollection() {
  return collection(db, "users", currentUser.uid, "entries");
}

async function loadEntries() {
  const q = query(getUserCollection());
  const snapshot = await getDocs(q);
  const entries = [];
  snapshot.forEach(doc => {
    entries.push({ id: doc.id, ...doc.data() });
  });
  renderEntries(entries);
  updateStats(entries);
}

async function addEntry() {
  const bottles = parseInt(bottleInput.value);
  if (!bottles || bottles <= 0) {
    showToast("Please enter a valid number of bottles");
    return;
  }
  const now = new Date();
  await addDoc(getUserCollection(), {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    bottles: bottles,
    amount: bottles * 40,
    created: serverTimestamp()
  });
  bottleInput.value = "";
  showToast("Entry added!");
  await loadEntries();
}

async function deleteEntry(id) {
  if (!confirm("Delete this entry?")) return;
  await deleteDoc(doc(db, "users", currentUser.uid, "entries", id));
  showToast("Deleted");
  await loadEntries();
}

function startEdit(id) {
  const row = document.getElementById(`row-${id}`);
  const date = row.dataset.date;
  const time = row.dataset.time;
  const bottles = row.dataset.bottles;

  row.innerHTML = `
    <td></td>
    <td><input type="date" id="editDate" value="${date}"></td>
    <td><input type="time" id="editTime" value="${time}"></td>
    <td><input type="number" id="editBottles" value="${bottles}"></td>
    <td id="editAmount">₹${bottles * 40}</td>
    <td>
      <button class="save-btn" onclick="saveEdit('${id}')">Save</button>
      <button class="cancel-btn" onclick="loadEntries()">Cancel</button>
    </td>
  `;

  document.getElementById("editBottles").addEventListener("input", (e) => {
    const b = parseInt(e.target.value) || 0;
    document.getElementById("editAmount").textContent = `₹${b * 40}`;
  });
}

window.startEdit = startEdit;

window.saveEdit = async (id) => {
  const newDate = document.getElementById("editDate").value;
  const newTime = document.getElementById("editTime").value;
  const newBottles = parseInt(document.getElementById("editBottles").value);

  if (!newDate || !newTime || newBottles <= 0) {
    showToast("Invalid entry");
    return;
  }

  await updateDoc(doc(db, "users", currentUser.uid, "entries", id), {
    date: newDate,
    time: newTime,
    bottles: newBottles,
    amount: newBottles * 40
  });

  showToast("Updated");
  await loadEntries();
};

function renderEntries(entries) {
  if (entries.length === 0) {
    entriesTable.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  entriesTable.style.display = "table";
  emptyState.style.display = "none";
  tableBody.innerHTML = "";

  entries.forEach((entry, i) => {
    const row = document.createElement("tr");
    row.id = `row-${entry.id}`;
    row.dataset.date = entry.date;
    row.dataset.time = entry.time;
    row.dataset.bottles = entry.bottles;

    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${entry.date}</td>
      <td>${entry.time}</td>
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

function updateStats(entries) {
  const totalBottles = entries.reduce((sum, e) => sum + e.bottles, 0);
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalEntries = entries.length;

  totalBottlesElement.textContent = totalBottles;
  totalAmountElement.textContent = `₹${totalAmount}`;
  totalEntriesElement.textContent = totalEntries;
}

async function clearAll() {
  if (!confirm("Clear all entries?")) return;
  const q = query(getUserCollection());
  const snap = await getDocs(q);
  const promises = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(promises);
  showToast("All entries cleared");
  await loadEntries();
}

function updateCurrentMonth() {
  const now = new Date();
  const monthYear = now.toLocaleString("default", { month: "long", year: "numeric" });
  currentMonthElement.textContent = monthYear;
}

function showToast(msg) {
  toastMessage.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

toastClose.addEventListener("click", () => toast.classList.remove("show"));
addBtn.addEventListener("click", addEntry);
clearBtn.addEventListener("click", clearAll);
exportExcelBtn.addEventListener("click", () => showToast("Export CSV coming soon"));
exportPDFBtn.addEventListener("click", () => showToast("Export PDF coming soon"));

window.deleteEntry = deleteEntry;
window.logout = async function () {
  await signOut(auth);
  location.href = "login.html";
};

// PROFILE
async function loadProfile() {
  const ref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  dropdownName.textContent = data.firstName || currentUser.email;
  profileName.textContent = data.firstName || "";
  document.getElementById("profileFirstName").value = data.firstName || "";
  document.getElementById("profileLastName").value = data.lastName || "";
  document.getElementById("profileEmail").value = currentUser.email || "";
  document.getElementById("profileMobile").value = data.mobile || "";
}

document.getElementById("editProfileBtn").addEventListener("click", () => {
  profileModal.classList.add("active");
});

document.getElementById("closeProfileBtn").addEventListener("click", () => {
  profileModal.classList.remove("active");
});

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const firstName = document.getElementById("profileFirstName").value;
  const lastName = document.getElementById("profileLastName").value;
  const mobile = document.getElementById("profileMobile").value;

  await setDoc(doc(db, "users", currentUser.uid), {
    firstName,
    lastName,
    mobile
  }, { merge: true });

  profileModal.classList.remove("active");
  showToast("Profile updated");
  await loadProfile();
});
