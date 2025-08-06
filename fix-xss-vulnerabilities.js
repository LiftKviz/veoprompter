const fs = require('fs');
const path = require('path');

// Read the original popup.js
const popupPath = path.join(__dirname, 'dist', 'popup.js');
const popupContent = fs.readFileSync(popupPath, 'utf8');

// Key replacements for innerHTML to secure methods
const replacements = [
  {
    // Replace document.body.innerHTML = `...` with secure DOM creation
    pattern: /document\.body\.innerHTML = `[\s\S]*?`;/g,
    replacement: `// Initialize the app with secure DOM methods
  injectStyles();
  DOMUtils.clearElement(document.body);
  const appStructure = createAppStructure();
  document.body.appendChild(appStructure);`
  },
  {
    // Replace element.innerHTML = string with textContent
    pattern: /(\w+)\.innerHTML = ([^`][^;]+);/g,
    replacement: '$1.textContent = $2;'
  },
  {
    // For template literals, we need manual review
    pattern: /(\w+)\.innerHTML = `[^`]+`;/g,
    replacement: function(match, varName) {
      console.log(`Found innerHTML with template literal that needs manual review: ${match.substring(0, 50)}...`);
      return `// TODO: Replace with secure DOM methods\n    // ${match}`;
    }
  }
];

// Function to create secure popup.js
function createSecurePopup() {
  let secureContent = popupContent;
  
  // Apply replacements
  replacements.forEach(({ pattern, replacement }) => {
    if (typeof replacement === 'function') {
      secureContent = secureContent.replace(pattern, replacement);
    } else {
      secureContent = secureContent.replace(pattern, replacement);
    }
  });
  
  // Add DOM utils import at the top
  const importStatement = `// Import secure DOM utilities
// Note: dom-utils.js should be loaded before this script in popup.html

`;
  
  secureContent = importStatement + secureContent;
  
  // Write the secure version
  const securePopupPath = path.join(__dirname, 'dist', 'popup-secure-auto.js');
  fs.writeFileSync(securePopupPath, secureContent);
  
  console.log('Created popup-secure-auto.js with automatic replacements.');
  console.log('Manual review required for template literal innerHTML assignments.');
}

// List all innerHTML occurrences for manual review
function listInnerHTMLOccurrences() {
  const lines = popupContent.split('\n');
  const occurrences = [];
  
  lines.forEach((line, index) => {
    if (line.includes('innerHTML')) {
      occurrences.push({
        lineNumber: index + 1,
        content: line.trim()
      });
    }
  });
  
  console.log('\nAll innerHTML occurrences:');
  occurrences.forEach(({ lineNumber, content }) => {
    console.log(`Line ${lineNumber}: ${content}`);
  });
  
  return occurrences;
}

// Main execution
console.log('Starting XSS vulnerability fix...\n');
listInnerHTMLOccurrences();
createSecurePopup();

console.log('\nNext steps:');
console.log('1. Review popup-secure-auto.js for TODO comments');
console.log('2. Manually convert template literal innerHTML to secure DOM methods');
console.log('3. Test the extension thoroughly');
console.log('4. Replace popup.js with the secure version once verified');