// auth.js

// Load users from localStorage
function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || [];
}

// Save users to localStorage
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// Signup form handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();

    const users = getUsers();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      alert('Account already exists with this email.');
      return;
    }

    users.push({ email, password });
    saveUsers(users);
    localStorage.setItem('currentUser', email);
    window.location.href = 'index.html';
  });
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      localStorage.setItem('currentUser', email);
      window.location.href = 'index.html';
    } else {
      alert('Invalid email or password');
    }
  });
}
