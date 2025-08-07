const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing admin dashboard for Netlify deployment...');

// Ensure admin-dashboard directory exists
if (!fs.existsSync('admin-dashboard')) {
  console.error('❌ admin-dashboard directory not found');
  process.exit(1);
}

// Check required files
const requiredFiles = [
  'index.html',
  'admin.js',
  'firebase-init.js',
  'prompts-data.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join('admin-dashboard', file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Required file missing: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✅ Found: ${file}`);
  }
});

if (!allFilesExist) {
  console.error('❌ Missing required files for deployment');
  process.exit(1);
}

// Verify Firebase config exists (placeholder check)
const firebaseInitPath = path.join('admin-dashboard', 'firebase-init.js');
const firebaseInitContent = fs.readFileSync(firebaseInitPath, 'utf8');

if (firebaseInitContent.includes('YOUR_API_KEY') || firebaseInitContent.includes('your-project-id')) {
  console.warn('⚠️  WARNING: Firebase config contains placeholder values');
  console.warn('   Update admin-dashboard/firebase-init.js with your actual Firebase config before deployment');
} else {
  console.log('✅ Firebase config appears to be configured');
}

// Check if _headers file exists (for Netlify)
const headersPath = path.join('admin-dashboard', '_headers');
if (fs.existsSync(headersPath)) {
  console.log('✅ Found _headers file for Netlify');
} else {
  console.log('ℹ️  No _headers file found (using netlify.toml headers instead)');
}

console.log('\n📋 Deployment checklist:');
console.log('1. ✅ Admin dashboard files are ready');
console.log('2. ✅ netlify.toml configuration created');
console.log('3. ⚠️  Ensure Firebase config is updated with real values');
console.log('4. ⚠️  Test admin dashboard locally before deploying');

console.log('\n🌐 To deploy to Netlify:');
console.log('1. Go to https://netlify.com and sign in');
console.log('2. Drag the admin-dashboard folder to deploy');
console.log('3. Or connect to your git repository for auto-deployment');

console.log('\n✅ Admin dashboard is ready for Netlify deployment!');