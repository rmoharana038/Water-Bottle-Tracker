# Water Bottle Tracker - Firebase Web App

Track your daily water bottle usage with real-time syncing, secure login, and offline support.

## 🔥 Live Demo

Hosted on GitHub Pages: [https://rmoharana038.github.io/Water-Bottle-Tracker](https://rmoharana038.github.io/Water-Bottle-Tracker)

## 📁 Files Included

- `index.html` - Main app interface (protected)
- `login.html` - Login, Signup, and Password Reset (combined)
- `style.css` - Styling for both tracker and auth pages
- `script.js` - Tracker logic with Firestore integration
- `firebase-init.js` - Firebase configuration (Auth + Firestore)
- `manifest.json` - PWA manifest for mobile installation
- `sw.js` - Service Worker for offline access
- `logo.png` - App logo/icon

## 🚀 Features

- ✅ **Firebase Auth** – Login, Signup & Password Reset
- 🗂 **Per-user Data** – Each user has private entries in Firestore
- 📊 **Dashboard** – View total bottles, amount, and entries
- 📝 **Edit/Delete** – Inline editing and deleting
- 📤 **Export** – CSV download and print-ready PDF
- 📶 **Offline Support** – Works without internet (PWA)
- 📱 **Installable** – Add to Home Screen (PWA)
- 💻 **Responsive** – Works on mobile, tablet, desktop

## 🔐 How to Use

1. **Open `login.html`** and sign up or log in
2. After login, you are redirected to `index.html`
3. Add water bottle entries, view stats, and export data

## 📱 Installation as App

1. Open site in Chrome on Android
2. Tap the **Install** prompt or “Add to Home Screen”
3. It installs like a native app

## 🛠 Tech Stack

- **Firebase** (Auth + Firestore)
- **HTML, CSS, JS** (No frameworks)
- **PWA** support (manifest + service worker)

## ⚙️ Customization

- 💰 Change bottle price: Edit `amount: bottles * 40` in `script.js`
- 🪙 Change currency: Replace all `₹` with your symbol
- 🎨 Change styles: Edit `style.css`
- 🖼 Update logo: Replace `logo.png`

## 🔒 Firebase Rules (Recommended)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
    }
  }
}
