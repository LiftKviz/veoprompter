// Test deployment structure
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking deployment structure...\n');

// Check if netlify.toml exists
if (fs.existsSync('netlify.toml')) {
  console.log('✅ netlify.toml exists');
  const toml = fs.readFileSync('netlify.toml', 'utf8');
  console.log('📋 netlify.toml content:');
  console.log(toml);
} else {
  console.log('❌ netlify.toml missing');
}

// Check functions directory
if (fs.existsSync('netlify/functions')) {
  console.log('\n✅ netlify/functions directory exists');
  const files = fs.readdirSync('netlify/functions');
  console.log('📁 Functions found:', files);
  
  // Check gpt.js specifically
  if (files.includes('gpt.js')) {
    console.log('✅ gpt.js function exists');
    const gptContent = fs.readFileSync('netlify/functions/gpt.js', 'utf8');
    console.log('📄 Function exports handler:', gptContent.includes('exports.handler'));
  }
} else {
  console.log('❌ netlify/functions directory missing');
}

// Check publish directory
if (fs.existsSync('admin-dashboard')) {
  console.log('\n✅ admin-dashboard publish directory exists');
  const files = fs.readdirSync('admin-dashboard');
  console.log('📁 Files in publish dir:', files.length, 'files');
} else {
  console.log('❌ admin-dashboard publish directory missing');
}

console.log('\n🚀 Deployment structure check complete!');