// Debug script to test extension data loading like the browser would
const path = require('path');
const fs = require('fs');

console.log('🔍 Debugging extension data loading...\n');

// Simulate the extension's data loading process
const simulateDataLoading = async () => {
  console.log('📡 Simulating extension fetch to /admin-dashboard/prompts-data.json...');
  
  // Check if the file exists in dist (where extension loads from)
  const jsonPath = path.join('dist', 'admin-dashboard', 'prompts-data.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.log('❌ JSON file not found in dist folder');
    return;
  }
  
  try {
    // Read and parse the JSON (simulating fetch)
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const jsonData = JSON.parse(jsonContent);
    
    console.log('✅ JSON loaded successfully');
    console.log(`📊 JSON structure check:`);
    console.log(`   - Has 'prompts' property: ${!!jsonData.prompts}`);
    console.log(`   - Prompts is array: ${Array.isArray(jsonData.prompts)}`);
    console.log(`   - Prompts count: ${jsonData.prompts?.length || 0}`);
    
    if (jsonData.prompts && Array.isArray(jsonData.prompts) && jsonData.prompts.length > 0) {
      const firstPrompt = jsonData.prompts[0];
      console.log(`   - Sample prompt structure:`);
      console.log(`     * category: ${firstPrompt.category}`);
      console.log(`     * title: ${firstPrompt.title}`);
      console.log(`     * prompt: ${firstPrompt.prompt ? 'present' : 'missing'}`);
      
      console.log('\n🎯 Data loading should work!');
      console.log('💡 If still showing "Loading prompts...", check browser DevTools console');
    } else {
      console.log('❌ Invalid JSON structure - prompts not found or empty');
    }
    
  } catch (error) {
    console.log(`❌ JSON parsing failed: ${error.message}`);
  }
};

// Also check fallback prompts.txt
console.log('\n📋 Checking fallback prompts.txt...');
const txtPath = path.join('dist', 'data', 'prompts.txt');
if (fs.existsSync(txtPath)) {
  const txtContent = fs.readFileSync(txtPath, 'utf8');
  const lines = txtContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  console.log(`✅ Fallback prompts.txt has ${lines.length} lines`);
} else {
  console.log('❌ Fallback prompts.txt not found');
}

simulateDataLoading();