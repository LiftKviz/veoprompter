// Alternative admin.js using redirect authentication
// Firebase should already be initialized by firebase-init.js
const auth = firebase.auth();
const db = firebase.firestore();

// Set auth persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

// State
let currentUser = null;
let prompts = [];
let currentCategory = 'all';
let editingPromptId = null;

// DOM Elements
const authBtn = document.getElementById('auth-btn');
const authStatus = document.getElementById('auth-status');
const mainContent = document.getElementById('main-content');
const promptList = document.getElementById('prompt-list');
const categoryList = document.getElementById('category-list');
const addPromptBtn = document.getElementById('add-prompt-btn');
const promptModal = document.getElementById('prompt-modal');
const promptForm = document.getElementById('prompt-form');
const modalTitle = document.getElementById('modal-title');
const cancelBtn = document.getElementById('cancel-btn');
const messageArea = document.getElementById('message-area');
const totalPromptsEl = document.getElementById('total-prompts');
const lastUpdatedEl = document.getElementById('last-updated');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const importExistingBtn = document.getElementById('import-existing-btn');

// Check for redirect result on page load
auth.getRedirectResult()
  .then((result) => {
    if (result.user) {
      console.log('Redirect sign-in successful:', result.user.email);
      showMessage('Sign-in successful!', 'success');
    }
  })
  .catch((error) => {
    if (error.code && error.code !== 'auth/no-auth-event') {
      console.error('Redirect error:', error);
      showMessage('Authentication error: ' + error.message, 'error');
    }
  });

// Authentication using redirect
authBtn.addEventListener('click', async () => {
  if (currentUser) {
    try {
      await auth.signOut();
      showMessage('Signed out successfully', 'success');
    } catch (error) {
      showMessage('Error signing out: ' + error.message, 'error');
    }
  } else {
    // Use Google Sign-In with redirect
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Store a flag to indicate we're attempting sign-in
    localStorage.setItem('attemptingSignIn', 'true');
    
    try {
      // This will redirect the user to Google
      await auth.signInWithRedirect(provider);
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('attemptingSignIn');
      
      // Handle specific errors
      if (error.code === 'auth/unauthorized-domain') {
        showMessage('This domain is not authorized. Please contact the administrator.', 'error');
      } else {
        showMessage('Authentication failed: ' + error.message, 'error');
      }
    }
  }
});

// Check if we were attempting sign-in
if (localStorage.getItem('attemptingSignIn')) {
  showMessage('Completing sign-in...', 'info');
  localStorage.removeItem('attemptingSignIn');
}

// Rest of the admin.js code remains the same...
auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (user) {
    authStatus.textContent = `Signed in as ${user.email}`;
    authBtn.textContent = 'Sign Out';
    mainContent.style.display = 'grid';
    loadPrompts();
    subscribeToPrompts();
  } else {
    authStatus.textContent = 'Not authenticated';
    authBtn.textContent = 'Sign In';
    mainContent.style.display = 'none';
  }
});

// Copy all the remaining functions from the original admin.js
// (subscribeToPrompts, loadPrompts, renderPrompts, etc.)

// Utility functions
function showMessage(message, type = 'info') {
  messageArea.innerHTML = `<div class="${type}">${message}</div>`;
  setTimeout(() => {
    messageArea.innerHTML = '';
  }, 5000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}