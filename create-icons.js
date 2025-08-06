// This script creates placeholder icons for the Chrome extension
// Run with: node create-icons.js

const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 128];

// Create a simple SVG icon
const createSvgIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4285F4"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}px" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">V3</text>
</svg>`;
};

// Ensure icons directory exists
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder PNG info
console.log('Creating placeholder icons...');
sizes.forEach(size => {
  const svgContent = createSvgIcon(size);
  const filename = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(filename, svgContent);
  console.log(`Created ${filename}`);
});

console.log('\nNote: These are SVG placeholders. For production, convert to PNG:');
console.log('1. Open each SVG in a browser');
console.log('2. Take a screenshot or use an online converter');
console.log('3. Save as icon16.png, icon32.png, icon48.png, icon128.png');