// Migration helper for transitioning to encrypted API key storage
// This script helps users migrate from unencrypted to encrypted storage

class MigrationHelper {
  constructor() {
    this.secureStorage = new SecureStorage();
  }

  // Check if migration is needed
  async needsMigration() {
    try {
      const result = await chrome.storage.local.get(['gptApiKey']);
      const oldKey = result.gptApiKey;
      
      // Check if we have an old unencrypted key
      if (oldKey && typeof oldKey === 'string' && !oldKey.startsWith('encrypted_')) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Migration check failed:', error);
      return false;
    }
  }

  // Perform migration
  async migrate() {
    try {
      const migrated = await this.secureStorage.migrateOldKey();
      
      if (migrated) {
        // Show success message
        this.showMigrationSuccess();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Migration failed:', error);
      this.showMigrationError(error.message);
      return false;
    }
  }

  // Show success notification
  showMigrationSuccess() {
    const notification = document.createElement('div');
    notification.className = 'migration-notification success';
    notification.innerHTML = `
      <div class="migration-content">
        <h3>🔐 Security Upgrade Complete!</h3>
        <p>Your API key has been encrypted and is now stored securely.</p>
        <button class="dismiss-btn">Got it!</button>
      </div>
    `;
    
    this.styleNotification(notification);
    document.body.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
    
    // Manual dismiss
    notification.querySelector('.dismiss-btn').addEventListener('click', () => {
      notification.remove();
    });
  }

  // Show error notification
  showMigrationError(errorMessage) {
    const notification = document.createElement('div');
    notification.className = 'migration-notification error';
    notification.innerHTML = `
      <div class="migration-content">
        <h3>⚠️ Migration Warning</h3>
        <p>Could not encrypt your API key: ${errorMessage}</p>
        <p>Your key is still stored but not encrypted. Please re-enter it in Settings.</p>
        <button class="dismiss-btn">Understood</button>
      </div>
    `;
    
    this.styleNotification(notification);
    document.body.appendChild(notification);
    
    // Manual dismiss only
    notification.querySelector('.dismiss-btn').addEventListener('click', () => {
      notification.remove();
    });
  }

  // Style the notification
  styleNotification(notification) {
    const style = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 300px;
      background: #2a2a2a;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease;
    `;
    
    notification.style.cssText = style;
    
    // Add animation keyframes if not already added
    if (!document.querySelector('#migration-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'migration-styles';
      styleSheet.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .migration-notification.success {
          border-color: #16a34a;
        }
        
        .migration-notification.error {
          border-color: #dc2626;
        }
        
        .migration-content h3 {
          margin: 0 0 8px 0;
          color: #ffffff;
          font-size: 14px;
        }
        
        .migration-content p {
          margin: 0 0 12px 0;
          color: #e0e0e0;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .dismiss-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          float: right;
        }
        
        .dismiss-btn:hover {
          background: #2563eb;
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }

  // Auto-run migration check on page load
  async autoMigrate() {
    try {
      const needsMigration = await this.needsMigration();
      
      if (needsMigration) {
        // Delay to ensure page is loaded
        setTimeout(async () => {
          await this.migrate();
        }, 1000);
      }
    } catch (error) {
      console.error('Auto-migration failed:', error);
    }
  }
}

// Initialize migration helper
const migrationHelper = new MigrationHelper();

// Export for manual use
window.MigrationHelper = MigrationHelper;
window.migrationHelper = migrationHelper;

// Auto-run migration on page load
document.addEventListener('DOMContentLoaded', () => {
  migrationHelper.autoMigrate();
});