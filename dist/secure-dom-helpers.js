// Secure DOM helper functions for the extension

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  const div = document.createElement('div');
  div.textContent = unsafe;
  return div.innerHTML;
}

// Highlight text safely (for search results)
function highlightTextSafe(text, query) {
  if (!query) return escapeHtml(text);
  
  const escaped = escapeHtml(text);
  const escapedQuery = escapeHtml(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  return escaped.replace(regex, '<span class="search-highlight">$1</span>');
}

// Create prompt card element safely
function createPromptCard(prompt, isSearch = false, searchQuery = '') {
  const card = document.createElement('div');
  card.className = 'prompt-card';
  card.dataset.id = prompt.id;
  
  // Header
  const header = document.createElement('div');
  header.className = 'prompt-header';
  
  const title = document.createElement('div');
  title.className = 'prompt-title';
  if (isSearch && searchQuery) {
    // For search results, we need to handle highlighting
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = highlightTextSafe(prompt.title, searchQuery);
    title.appendChild(tempDiv);
  } else {
    title.textContent = prompt.title;
  }
  
  const expandIcon = document.createElement('span');
  expandIcon.className = 'expand-icon';
  expandIcon.textContent = '▶';
  
  header.appendChild(title);
  header.appendChild(expandIcon);
  
  // Content (initially hidden)
  const content = document.createElement('div');
  content.className = 'prompt-content';
  content.style.display = 'none';
  
  const promptText = document.createElement('div');
  promptText.className = 'prompt-text';
  if (isSearch && searchQuery) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = highlightTextSafe(prompt.prompt, searchQuery);
    promptText.appendChild(tempDiv);
  } else {
    promptText.textContent = prompt.prompt;
  }
  
  // Actions
  const actions = document.createElement('div');
  actions.className = 'prompt-actions';
  
  const actionButtons = [
    { action: 'copy', icon: '📋', text: 'Copy' },
    { action: 'modify', icon: '✏️', text: 'Modify' },
    { action: 'preview', icon: '▶️', text: 'Preview' },
    { action: 'save', icon: '⭐', text: 'Save' },
    { action: 'add-sequence', icon: '🎬', text: 'Add to Sequence', class: 'add-to-sequence' }
  ];
  
  actionButtons.forEach(({ action, icon, text, class: btnClass }) => {
    const button = document.createElement('button');
    button.className = btnClass ? `action-button ${btnClass}` : 'action-button';
    button.dataset.action = action;
    button.dataset.id = prompt.id;
    button.textContent = `${icon} ${text}`;
    actions.appendChild(button);
  });
  
  content.appendChild(promptText);
  content.appendChild(actions);
  
  card.appendChild(header);
  card.appendChild(content);
  
  return card;
}

// Create category card safely
function createCategoryCard(category) {
  const card = document.createElement('div');
  card.className = 'category-card';
  card.dataset.category = category.id;
  
  const icon = document.createElement('div');
  icon.className = 'category-icon';
  icon.textContent = category.icon;
  
  const name = document.createElement('div');
  name.className = 'category-name';
  name.textContent = category.name;
  
  const description = document.createElement('div');
  description.className = 'category-description';
  description.textContent = category.description;
  
  const count = document.createElement('div');
  count.className = 'category-count';
  count.textContent = `${category.prompts.length} prompts`;
  
  card.appendChild(icon);
  card.appendChild(name);
  card.appendChild(description);
  card.appendChild(count);
  
  return card;
}

// Create settings modal safely
function createSettingsModal(apiKey) {
  const overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  
  const title = document.createElement('h2');
  title.textContent = 'Settings';
  
  const formDiv = document.createElement('div');
  
  const label = document.createElement('label');
  label.textContent = 'OpenAI API Key';
  
  const input = document.createElement('input');
  input.type = 'password';
  input.id = 'api-key-input';
  input.className = 'api-key-input';
  input.placeholder = 'sk-...';
  input.value = apiKey || '';
  
  const helpText = document.createElement('p');
  helpText.style.cssText = 'font-size: 12px; color: #b0b0b0; margin-bottom: 16px;';
  helpText.textContent = 'Get your API key from ';
  
  const link = document.createElement('a');
  link.href = 'https://platform.openai.com/api-keys';
  link.target = '_blank';
  link.textContent = 'OpenAI Dashboard';
  helpText.appendChild(link);
  
  formDiv.appendChild(label);
  formDiv.appendChild(input);
  formDiv.appendChild(helpText);
  
  const actions = document.createElement('div');
  actions.className = 'settings-actions';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'action-button';
  cancelBtn.id = 'cancel-settings';
  cancelBtn.textContent = 'Cancel';
  
  const saveBtn = document.createElement('button');
  saveBtn.className = 'action-button primary';
  saveBtn.id = 'save-key';
  saveBtn.textContent = 'Save';
  
  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  
  modal.appendChild(title);
  modal.appendChild(formDiv);
  modal.appendChild(actions);
  
  overlay.appendChild(modal);
  
  return overlay;
}

// Create toast notification safely
function showToastSafe(message, type = 'info') {
  // Remove any existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Export functions for use in popup.js
window.SecureDOM = {
  escapeHtml,
  highlightTextSafe,
  createPromptCard,
  createCategoryCard,
  createSettingsModal,
  showToastSafe
};