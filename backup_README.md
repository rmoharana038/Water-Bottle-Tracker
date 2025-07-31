# 💧 Water Bottle Tracker - Firebase Web App (PWA)

Track your daily water bottle usage, expenses, and history with login-based secure access, offline support, and export options — powered by Firebase.

---

## 🔗 Live Demo

**GitHub Pages:**  
👉 [https://rmoharana038.github.io/Water-Bottle-Tracker](https://rmoharana038.github.io/Water-Bottle-Tracker)

---

## 📁 Project Structure

| File               | Description                                      |
|--------------------|--------------------------------------------------|
| `index.html`       | Main dashboard with tracker UI (requires login)  |
| `login.html`       | Unified page for Login, Signup, and Reset        |
| `style.css`        | Full responsive and auth styling                 |
| `script.js`        | App logic (CRUD, stats, export)                  |
| `firebase-init.js` | Firebase config + Firestore with offline cache   |
| `manifest.json`    | PWA manifest for installable web app             |
| `sw.js`            | Service worker for offline use                   |
| `logo.png`         | App icon and favicon                             |

---

## 🚀 Key Features

- 🔐 **Firebase Auth** – Login, Signup, and Password Reset
- 👤 **Per-user Storage** – Private entries for each authenticated user
- 📈 **Dashboard** – Total bottles, expense, and entry count
- 📝 **CRUD Support** – Add, edit, and delete entries
- 📤 **Export Data** – Download CSV or Print as PDF
- 📦 **Offline Ready** – Works without internet (PWA)
- 📲 **Installable App** – Add to Home Screen support
- 💻 **Responsive UI** – Works seamlessly on all devices

---

## 🔧 Usage Instructions

1. **Open [`login.html`](login.html)**  
   Sign up or log in using your email and password

2. **Tracker Dashboard (`index.html`)**  
   - Add daily water bottle usage
   - View monthly stats
   - Edit or delete entries
   - Export history as CSV or PDF

3. **Install App (PWA)**  
   - Visit site in Chrome (Android/Desktop)
   - Tap **"Install"** or "Add to Home Screen"

---

## ⚙️ Tech Stack

- **Firebase** – Authentication + Firestore DB
- **JavaScript** – Vanilla JS for logic and UI updates
- **HTML + CSS** – Fully responsive design
- **PWA Support** – Service Worker + Manifest

---

## ✨ Customization Guide

| What                | How to change                                      |
|---------------------|----------------------------------------------------|
| 💰 Bottle price     | In `script.js`, update: `amount: bottles * 40`     |
| 💱 Currency         | Replace all `₹` symbols with your local currency   |
| 🎨 UI Theme         | Modify colors/fonts in `style.css`                 |
| 🖼 Logo/Icon        | Replace `logo.png` with your own                   |

---

## 🔐 Recommended Firebase Security Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Water Bottle Entries
    match /entries/{entryId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }

    // User Profile Info
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
