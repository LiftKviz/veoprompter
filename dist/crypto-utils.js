// Secure cryptographic utilities for API key encryption
// Uses Web Crypto API for strong encryption

class SecureCrypto {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96 bits for AES-GCM
  }

  // Generate a cryptographic key from extension ID and user agent
  async generateKey() {
    try {
      const extensionId = chrome.runtime.id;
      const userAgent = navigator.userAgent;
      const keyMaterial = extensionId + userAgent + 'veo3-secure-key';
      
      // Create key material from string
      const encoder = new TextEncoder();
      const keyData = encoder.encode(keyMaterial);
      
      // Import as key material
      const importedKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derive actual encryption key
      const salt = encoder.encode('veo3-extension-salt-2024');
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        importedKey,
        { name: this.algorithm, length: this.keyLength },
        false,
        ['encrypt', 'decrypt']
      );

      return key;
    } catch (error) {
      console.error('Key generation failed:', error);
      throw new Error('Failed to generate encryption key');
    }
  }

  // Encrypt data
  async encrypt(plaintext) {
    try {
      if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('Invalid plaintext data');
      }

      const key = await this.generateKey();
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      
      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );

      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encrypted.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 for storage
      return this.arrayBufferToBase64(result);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data
  async decrypt(encryptedData) {
    try {
      if (!encryptedData || typeof encryptedData !== 'string') {
        throw new Error('Invalid encrypted data');
      }

      const key = await this.generateKey();
      
      // Convert from base64
      const combined = this.base64ToArrayBuffer(encryptedData);
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, this.ivLength);
      const encrypted = combined.slice(this.ivLength);

      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encrypted
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Utility: Convert ArrayBuffer to Base64
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Utility: Convert Base64 to ArrayBuffer
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Validate API key format (basic check)
  validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Check for common API key patterns
    const patterns = [
      /^sk-[a-zA-Z0-9]{48,}$/, // OpenAI API key pattern
      /^[a-zA-Z0-9-_]{20,}$/, // Generic API key pattern
    ];
    
    return patterns.some(pattern => pattern.test(apiKey));
  }

  // Secure wipe of sensitive data
  secureWipe(data) {
    if (typeof data === 'string') {
      // Overwrite string data (best effort in JavaScript)
      return data.replace(/./g, '0');
    }
    return null;
  }
}

// Secure storage wrapper for API keys
class SecureStorage {
  constructor() {
    this.crypto = new SecureCrypto();
    this.keyPrefix = 'secure_';
  }

  // Store encrypted API key
  async storeApiKey(apiKey) {
    try {
      if (!this.crypto.validateApiKey(apiKey)) {
        throw new Error('Invalid API key format');
      }

      const encrypted = await this.crypto.encrypt(apiKey);
      
      // Store in Chrome storage
      await chrome.storage.local.set({
        [this.keyPrefix + 'gptApiKey']: encrypted,
        [this.keyPrefix + 'timestamp']: Date.now()
      });

      // Secure wipe of plaintext
      this.crypto.secureWipe(apiKey);
      
      return true;
    } catch (error) {
      console.error('Failed to store API key:', error);
      throw error;
    }
  }

  // Retrieve and decrypt API key
  async getApiKey() {
    try {
      const result = await chrome.storage.local.get([
        this.keyPrefix + 'gptApiKey',
        this.keyPrefix + 'timestamp'
      ]);

      const encryptedKey = result[this.keyPrefix + 'gptApiKey'];
      if (!encryptedKey) {
        return null; // No key stored
      }

      // Check if key is too old (optional security measure)
      const timestamp = result[this.keyPrefix + 'timestamp'];
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      if (timestamp && (Date.now() - timestamp > maxAge)) {
        await this.removeApiKey();
        throw new Error('Stored API key has expired');
      }

      const decrypted = await this.crypto.decrypt(encryptedKey);
      return decrypted;
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      // If decryption fails, remove the corrupted key
      await this.removeApiKey();
      return null;
    }
  }

  // Remove API key from storage
  async removeApiKey() {
    try {
      await chrome.storage.local.remove([
        this.keyPrefix + 'gptApiKey',
        this.keyPrefix + 'timestamp'
      ]);
      return true;
    } catch (error) {
      console.error('Failed to remove API key:', error);
      return false;
    }
  }

  // Check if API key exists
  async hasApiKey() {
    try {
      const result = await chrome.storage.local.get([this.keyPrefix + 'gptApiKey']);
      return !!result[this.keyPrefix + 'gptApiKey'];
    } catch (error) {
      console.error('Failed to check API key existence:', error);
      return false;
    }
  }

  // Migrate old unencrypted keys
  async migrateOldKey() {
    try {
      const result = await chrome.storage.local.get(['gptApiKey']);
      const oldKey = result.gptApiKey;
      
      if (oldKey && typeof oldKey === 'string' && oldKey.startsWith('sk-')) {
        // This looks like an unencrypted OpenAI key
        await this.storeApiKey(oldKey);
        
        // Remove old unencrypted key
        await chrome.storage.local.remove(['gptApiKey']);
        
        console.log('Successfully migrated unencrypted API key');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to migrate old API key:', error);
      return false;
    }
  }
}

// Export for use in other scripts
window.SecureStorage = SecureStorage;
window.SecureCrypto = SecureCrypto;