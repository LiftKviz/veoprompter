const fs = require('fs');
const path = require('path');

console.log('Converting admin dashboard data to JSON...');

// Read the prompts-data.js file
const adminDataPath = path.join('admin-dashboard', 'prompts-data.js');
if (!fs.existsSync(adminDataPath)) {
  console.error('❌ admin-dashboard/prompts-data.js not found');
  process.exit(1);
}

const scriptContent = fs.readFileSync(adminDataPath, 'utf8');

// Extract the array data
const match = scriptContent.match(/window\.existingPrompts\s*=\s*(\[[\s\S]*?\]);/);
if (!match) {
  console.error('❌ Could not extract prompts data from script');
  process.exit(1);
}

try {
  // Parse the JavaScript array as JSON
  const promptsData = eval(match[1]);
  
  // Create JSON version
  const jsonData = {
    version: "1.0",
    source: "admin-dashboard",
    lastUpdated: new Date().toISOString(),
    prompts: promptsData
  };

  // Write to admin-dashboard/prompts-data.json
  const jsonPath = path.join('admin-dashboard', 'prompts-data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
  
  console.log(`✅ Created ${jsonPath} with ${promptsData.length} prompts`);
  
  // Also write to dist folder
  const distJsonPath = path.join('dist', 'admin-dashboard', 'prompts-data.json');
  const distDir = path.dirname(distJsonPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  fs.writeFileSync(distJsonPath, JSON.stringify(jsonData, null, 2));
  
  console.log(`✅ Created ${distJsonPath} for extension use`);
  console.log('✅ Admin dashboard data converted to JSON successfully!');
  
} catch (error) {
  console.error('❌ Failed to parse prompts data:', error);
  process.exit(1);
}