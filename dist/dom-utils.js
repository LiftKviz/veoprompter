// Secure DOM manipulation utilities to prevent XSS attacks

const DOMUtils = {
  // Escape HTML to prevent XSS
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  // Create element with text content (safe from XSS)
  createElement(tag, className, textContent) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  },

  // Create element with children
  createElementWithChildren(tag, className, children) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (children) {
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });
    }
    return element;
  },

  // Safe set text content
  setTextContent(element, text) {
    element.textContent = text;
  },

  // Clear element safely
  clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  },

  // Create button with safe text
  createButton(className, textContent, onClick) {
    const button = document.createElement('button');
    if (className) button.className = className;
    if (textContent) button.textContent = textContent;
    if (onClick) button.addEventListener('click', onClick);
    return button;
  },

  // Create link safely
  createLink(href, textContent, target = '_blank') {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = textContent;
    link.target = target;
    link.rel = 'noopener noreferrer'; // Security best practice
    return link;
  },

  // Create input safely
  createInput(type, id, className, placeholder) {
    const input = document.createElement('input');
    input.type = type;
    if (id) input.id = id;
    if (className) input.className = className;
    if (placeholder) input.placeholder = placeholder;
    return input;
  },

  // Create div with safe content
  createDiv(className, content) {
    const div = document.createElement('div');
    if (className) div.className = className;
    if (content) {
      if (typeof content === 'string') {
        div.textContent = content;
      } else if (Array.isArray(content)) {
        content.forEach(item => {
          if (typeof item === 'string') {
            div.appendChild(document.createTextNode(item));
          } else {
            div.appendChild(item);
          }
        });
      } else {
        div.appendChild(content);
      }
    }
    return div;
  },

  // Validate and sanitize user input
  sanitizeInput(input) {
    // Remove any HTML tags and trim whitespace
    return input.replace(/<[^>]*>/g, '').trim();
  },

  // Create text node (always safe from XSS)
  createTextNode(text) {
    return document.createTextNode(text);
  }
};

// Make available globally
window.DOMUtils = DOMUtils;