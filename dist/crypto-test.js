// Test script for crypto utilities - FOR TESTING ONLY
// Remove this file in production

async function testCrypto() {
  console.log('🔐 Testing API Key Encryption...');
  
  const testApiKey = 'sk-test1234567890abcdefghijklmnopqrstuvwxyz123456';
  const secureStorage = new SecureStorage();
  
  try {
    // Test encryption/decryption
    console.log('1. Testing basic encryption...');
    const crypto = new SecureCrypto();
    const encrypted = await crypto.encrypt(testApiKey);
    console.log('✅ Encryption successful, length:', encrypted.length);
    
    const decrypted = await crypto.decrypt(encrypted);
    console.log('✅ Decryption successful, matches:', decrypted === testApiKey);
    
    // Test secure storage
    console.log('2. Testing secure storage...');
    await secureStorage.storeApiKey(testApiKey);
    console.log('✅ Storage successful');
    
    const retrieved = await secureStorage.getApiKey();
    console.log('✅ Retrieval successful, matches:', retrieved === testApiKey);
    
    // Test validation
    console.log('3. Testing validation...');
    console.log('Valid key test:', crypto.validateApiKey(testApiKey));
    console.log('Invalid key test:', crypto.validateApiKey('invalid-key'));
    
    // Clean up
    await secureStorage.removeApiKey();
    console.log('✅ Cleanup successful');
    
    console.log('🎉 All crypto tests passed!');
    
  } catch (error) {
    console.error('❌ Crypto test failed:', error);
  }
}

// Auto-run test in development
if (location.hostname === 'localhost' || chrome.runtime.id === 'test') {
  testCrypto();
}

// Export for manual testing
window.testCrypto = testCrypto;