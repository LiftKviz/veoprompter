// Admin Dashboard for Veo 3 Prompt Assistant
// Firebase should already be initialized by firebase-init.js
const auth = firebase.auth();
const db = firebase.firestore();

// Add this function near the top of the file (after the Firebase imports)
function checkAdminAccess(user) {
  const allowedEmails = ['nemanja@leaded.pro'];
  
  if (!allowedEmails.includes(user.email)) {
    alert('Access denied. Admin access only.');
    auth.signOut();
    return false;
  }
  return true;
}

// Handle redirect-based sign-in results (needed when popup is blocked or fallback used)
auth.getRedirectResult()
  .then((result) => {
    if (result && result.user) {
      console.log('Redirect sign-in successful:', result.user.email);
      // UI will update via onAuthStateChanged below
    }
  })
  .catch((error) => {
    console.error('Redirect sign-in error:', error);
    if (typeof showMessage === 'function') {
      showMessage('Authentication failed after redirect: ' + (error.message || error.code || 'Unknown error'), 'error');
    }
  });

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

// Authentication
authBtn.addEventListener('click', async () => {
  if (currentUser) {
    await auth.signOut();
  } else {
    // Use Google Sign-In
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (error) {
      console.error('Auth error:', error);
      
      // Handle specific errors
      if (error.code === 'auth/unauthorized-domain') {
        showMessage('This domain is not authorized. Please contact the administrator to add this domain to Firebase (Authorized domains).', 'error');
      } else if (error.code === 'auth/popup-blocked') {
        // Fallback to redirect if popup is blocked
        showMessage('Popup was blocked. Redirecting to Google Sign-In...', 'info');
        try {
          await auth.signInWithRedirect(provider);
          return;
        } catch (redirectErr) {
          console.error('Redirect sign-in error:', redirectErr);
          showMessage('Redirect sign-in failed: ' + redirectErr.message, 'error');
        }
      } else if (error.code === 'auth/cancelled-popup-request') {
        showMessage('Authentication cancelled.', 'error');
      } else if (error.code === 'auth/popup-closed-by-user') {
        showMessage('Sign-in popup was closed before completing sign in.', 'error');
      } else {
        showMessage('Authentication failed: ' + error.message, 'error');
      }
      
      // Show additional debugging info
      console.log('Current domain:', window.location.hostname);
      console.log('Error code:', error.code);
    }
  }
});

auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (user) {
    // Check if user is authorized admin
    if (!checkAdminAccess(user)) {
      return; // Exit early if not authorized
    }
    
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

// Load and subscribe to prompts
function subscribeToPrompts() {
  db.collection('prompts')
    .orderBy('category')
    .onSnapshot((snapshot) => {
      prompts = [];
      snapshot.forEach((doc) => {
        prompts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      renderPrompts();
      updateStats();
    }, (error) => {
      showMessage('Error loading prompts: ' + error.message, 'error');
    });
}

async function loadPrompts() {
  try {
    // Try to load from Firebase first
    const snapshot = await db.collection('prompts').get();
    prompts = [];
    snapshot.forEach((doc) => {
      prompts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // If Firebase is empty, fallback to local JSON data
    if (prompts.length === 0) {
      console.log('Firebase empty, loading from local prompts-data.json');
      try {
        const response = await fetch('./prompts-data.json');
        if (response.ok) {
          const data = await response.json();
          if (data.prompts && Array.isArray(data.prompts)) {
            prompts = data.prompts.map((prompt, index) => ({
              id: `local-${index}`,
              ...prompt
            }));
            showMessage(`Loaded ${prompts.length} prompts from local data. Use "Import Existing Prompts" to save them to Firebase.`, 'success');
          }
        }
      } catch (fallbackError) {
        console.error('Failed to load fallback data:', fallbackError);
        showMessage('No prompts found. Use "Import Existing Prompts" to populate the database.', 'error');
      }
    }
    
    renderPrompts();
    updateStats();
  } catch (error) {
    console.error('Error loading prompts:', error);
    showMessage('Error loading prompts: ' + error.message, 'error');
  }
}

// Render prompts
function renderPrompts() {
  const filteredPrompts = currentCategory === 'all' 
    ? prompts 
    : prompts.filter(p => p.category === currentCategory);

  if (filteredPrompts.length === 0) {
    promptList.innerHTML = '<div class="loading">No prompts found</div>';
    return;
  }

  promptList.innerHTML = filteredPrompts.map(prompt => `
    <div class="prompt-item">
      <div class="prompt-header">
        <div>
          <div class="prompt-title">${escapeHtml(prompt.title)}</div>
          <span style="font-size: 12px; color: #666;">Category: ${prompt.category}</span>
        </div>
        <div class="prompt-actions">
          <button class="btn btn-secondary" onclick="editPrompt('${prompt.id}')">Edit</button>
          <button class="btn btn-danger" onclick="deletePrompt('${prompt.id}')">Delete</button>
        </div>
      </div>
      <div class="prompt-preview">${escapeHtml(prompt.prompt)}</div>
      ${prompt.customFields && prompt.customFields.length > 0 ? `<div style="margin-top: 5px; font-size: 12px; color: #666;">Custom fields: ${prompt.customFields.map(f => f.label).join(', ')}</div>` : ''}
      ${prompt.youtubeLink ? `<div style="margin-top: 5px; font-size: 12px;"><a href="${prompt.youtubeLink}" target="_blank">🔗 YouTube Link</a></div>` : ''}
    </div>
  `).join('');
}

// Category selection
categoryList.addEventListener('click', (e) => {
  if (e.target.classList.contains('category-item')) {
    document.querySelectorAll('.category-item').forEach(item => {
      item.classList.remove('active');
    });
    e.target.classList.add('active');
    currentCategory = e.target.dataset.category;
    renderPrompts();
  }
});

// Add/Edit prompt
addPromptBtn.addEventListener('click', () => {
  editingPromptId = null;
  modalTitle.textContent = 'Add New Prompt';
  promptForm.reset();
  // Add default custom fields template
  document.getElementById('prompt-fields').value = `[
  {"name": "example_field", "label": "Example Field", "type": "text"}
]`;
  promptModal.classList.add('show');
});

window.editPrompt = async (id) => {
  console.log('Edit prompt called with ID:', id);
  editingPromptId = id;
  modalTitle.textContent = 'Edit Prompt';
  const prompt = prompts.find(p => p.id === id);
  
  console.log('Found prompt:', prompt);
  console.log('Setting editingPromptId to:', editingPromptId);
  
  if (prompt) {
    document.getElementById('prompt-category').value = prompt.category;
    document.getElementById('prompt-title').value = prompt.title;
    document.getElementById('prompt-content').value = prompt.prompt;
    document.getElementById('prompt-youtube').value = prompt.youtubeLink || '';
    document.getElementById('prompt-order').value = prompt.order || '';
    document.getElementById('prompt-fields').value = prompt.customFields ? JSON.stringify(prompt.customFields, null, 2) : '';
    promptModal.classList.add('show');
    updatePreview(); // Update preview when editing
  } else {
    console.error('Prompt not found with ID:', id);
  }
};

window.deletePrompt = async (id) => {
  if (confirm('Are you sure you want to delete this prompt?')) {
    try {
      await db.collection('prompts').doc(id).delete();
      showMessage('Prompt deleted successfully', 'success');
    } catch (error) {
      showMessage('Error deleting prompt: ' + error.message, 'error');
    }
  }
};

// Form submission
promptForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Parse custom fields
  let customFields = [];
  const fieldsValue = document.getElementById('prompt-fields').value.trim();
  if (fieldsValue) {
    try {
      customFields = JSON.parse(fieldsValue);
      // Validate custom fields
      if (!Array.isArray(customFields)) {
        throw new Error('Custom fields must be an array');
      }
      customFields.forEach(field => {
        if (!field.name || !field.label) {
          throw new Error('Each field must have name and label');
        }
      });
    } catch (error) {
      showMessage('Invalid custom fields JSON: ' + error.message, 'error');
      return;
    }
  }

  const promptData = {
    category: document.getElementById('prompt-category').value,
    title: document.getElementById('prompt-title').value,
    prompt: document.getElementById('prompt-content').value,
    youtubeLink: document.getElementById('prompt-youtube').value || null,
    order: parseInt(document.getElementById('prompt-order').value) || 0,
    customFields: customFields.length > 0 ? customFields : null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: currentUser.email
  };

  try {
    console.log('Saving prompt data:', promptData);
    console.log('Current user:', currentUser?.email);
    console.log('Editing ID:', editingPromptId);
    
    if (editingPromptId) {
      console.log('Updating document:', editingPromptId);
      await db.collection('prompts').doc(editingPromptId).update(promptData);
      showMessage('Prompt updated successfully', 'success');
    } else {
      console.log('Creating new document');
      promptData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      promptData.createdBy = currentUser.email;
      await db.collection('prompts').add(promptData);
      showMessage('Prompt added successfully', 'success');
    }
    promptModal.classList.remove('show');
    promptForm.reset();
    editingPromptId = null; // Reset editing ID
  } catch (error) {
    console.error('Firebase save error:', error);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    showMessage('Error saving prompt: ' + error.message, 'error');
  }
});

// Modal controls
cancelBtn.addEventListener('click', () => {
  promptModal.classList.remove('show');
  promptForm.reset();
});

promptModal.addEventListener('click', (e) => {
  if (e.target === promptModal) {
    promptModal.classList.remove('show');
    promptForm.reset();
  }
});

// Export/Import functionality
exportBtn.addEventListener('click', () => {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    prompts: prompts
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `veo3-prompts-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => {
  importFile.click();
});

importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.prompts || !Array.isArray(data.prompts)) {
      throw new Error('Invalid file format');
    }
    
    if (confirm(`Import ${data.prompts.length} prompts? This will not delete existing prompts.`)) {
      const batch = db.batch();
      
      data.prompts.forEach(prompt => {
        const docRef = db.collection('prompts').doc();
        batch.set(docRef, {
          ...prompt,
          id: undefined, // Remove old ID
          importedAt: firebase.firestore.FieldValue.serverTimestamp(),
          importedBy: currentUser.email
        });
      });
      
      await batch.commit();
      showMessage(`Successfully imported ${data.prompts.length} prompts`, 'success');
    }
  } catch (error) {
    showMessage('Error importing file: ' + error.message, 'error');
  }
  
  importFile.value = '';
});

// Import existing prompts from prompts.txt
importExistingBtn.addEventListener('click', async () => {
  if (!currentUser) {
    showMessage('Please sign in to import prompts', 'error');
    return;
  }
  
  // Check if parsedPrompts is available from import-prompts.js
  if (!window.parsedPrompts) {
    showMessage('Import script not loaded properly', 'error');
    return;
  }
  
  const confirmImport = confirm(`This will import ${window.parsedPrompts.length} prompts from the original prompts.txt file. Continue?`);
  if (!confirmImport) return;
  
  try {
    importExistingBtn.disabled = true;
    importExistingBtn.textContent = 'Importing...';
    
    const batch = db.batch();
    let successCount = 0;
    
    // Add each prompt to the batch
    window.parsedPrompts.forEach(prompt => {
      const docRef = db.collection('prompts').doc();
      batch.set(docRef, {
        ...prompt,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: currentUser.email,
        updatedBy: currentUser.email
      });
      successCount++;
    });
    
    // Commit the batch
    await batch.commit();
    
    showMessage(`Successfully imported ${successCount} prompts!`, 'success');
    
    // Reset button
    importExistingBtn.textContent = '🚀 Import Existing Prompts';
    importExistingBtn.disabled = false;
    
  } catch (error) {
    console.error('Import error:', error);
    showMessage('Error importing prompts: ' + error.message, 'error');
    importExistingBtn.textContent = '🚀 Import Existing Prompts';
    importExistingBtn.disabled = false;
  }
});

// Update stats
function updateStats() {
  totalPromptsEl.textContent = prompts.length;
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  lastUpdatedEl.textContent = timeStr;
}

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

// Preview functionality
const promptContentEl = document.getElementById('prompt-content');
const promptFieldsEl = document.getElementById('prompt-fields');
const promptPreviewEl = document.getElementById('prompt-preview');

function updatePreview() {
  let content = promptContentEl.value;
  
  if (!content) {
    promptPreviewEl.innerHTML = '<span style="color: #999;">Enter prompt content to see preview...</span>';
    return;
  }
  
  // Parse custom fields and replace placeholders
  try {
    const fieldsValue = promptFieldsEl.value.trim();
    if (fieldsValue) {
      const fields = JSON.parse(fieldsValue);
      fields.forEach(field => {
        const placeholder = `{${field.name}}`;
        const replacement = `<span style="background: #e3f2fd; padding: 2px 6px; border-radius: 3px; color: #1976d2;">[${field.label}]</span>`;
        content = content.replace(new RegExp(placeholder, 'g'), replacement);
      });
    }
  } catch (e) {
    // Ignore JSON parse errors for preview
  }
  
  promptPreviewEl.innerHTML = escapeHtml(content).replace(/\[([^\]]+)\]/g, '<span style="background: #e3f2fd; padding: 2px 6px; border-radius: 3px; color: #1976d2;">[$1]</span>');
}

promptContentEl.addEventListener('input', updatePreview);
promptFieldsEl.addEventListener('input', updatePreview);

// Helper function to insert variables
window.insertVariable = (variableName) => {
  const textarea = promptContentEl;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const variable = `{${variableName}}`;
  
  textarea.value = text.substring(0, start) + variable + text.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + variable.length;
  textarea.focus();
  
  // Update the custom fields JSON if not already present
  try {
    let fields = [];
    const fieldsValue = promptFieldsEl.value.trim();
    if (fieldsValue) {
      fields = JSON.parse(fieldsValue);
    }
    
    // Check if this field already exists
    if (!fields.find(f => f.name === variableName)) {
      // Add the field with a nice label
      const label = variableName.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      fields.push({
        name: variableName,
        label: label,
        type: 'text'
      });
      
      promptFieldsEl.value = JSON.stringify(fields, null, 2);
    }
  } catch (e) {
    console.error('Error updating fields:', e);
  }
  
  updatePreview();
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check if Firebase config is set
  if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
    messageArea.innerHTML = `
      <div class="error">
        <strong>Firebase not configured!</strong><br>
        Please update the firebaseConfig in admin.js with your Firebase project credentials.
      </div>
    `;
  }
});