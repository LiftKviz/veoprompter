const fs = require('fs');
const path = require('path');

// Read the Firebase service and config
const firebaseServicePath = path.join(__dirname, 'src/services/firebaseService.js');
const firebaseConfigPath = path.join(__dirname, 'src/firebase-config.js');

let firebaseService = fs.readFileSync(firebaseServicePath, 'utf8');
let firebaseConfig = fs.readFileSync(firebaseConfigPath, 'utf8');

// Remove import/export statements and combine
firebaseService = firebaseService.replace(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?/g, '');
firebaseService = firebaseService.replace(/export\s+const\s+firebaseService\s*=\s*new\s+FirebaseService\(\);?/, 'const firebaseService = new FirebaseService();');

firebaseConfig = firebaseConfig.replace(/export\s+const\s+/, 'const ');

// Combine into a single file
const combined = `// Firebase Integration for Veo 3 Prompt Assistant
${firebaseConfig}

${firebaseService}
`;

// Write to dist
fs.writeFileSync(path.join(__dirname, 'dist/firebase-service.js'), combined);

console.log('Firebase service built successfully!');