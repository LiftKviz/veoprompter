import React, { useState, useEffect } from 'react';
import { GPTService } from '@/services/gptService';
import './Settings.css';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load existing API key
    GPTService.getInstance().getApiKey().then(key => {
      if (key) setApiKey(key);
    });
  }, []);

  const handleSave = async () => {
    try {
      await GPTService.getInstance().setApiKey(apiKey);
      
      // Upgrade to BYOK tier if valid API key is provided
      if (apiKey && typeof window !== 'undefined' && (window as any).tierService) {
        const tierService = (window as any).tierService;
        try {
          await tierService.upgradeToBYOK(apiKey);
          console.log('User upgraded to BYOK tier');
        } catch (error) {
          console.error('Failed to upgrade to BYOK tier:', error);
        }
      } else if (!apiKey && typeof window !== 'undefined' && (window as any).tierService) {
        // Downgrade to free tier when API key is removed
        const tierService = (window as any).tierService;
        await tierService.setUserTier('free', null);
      }
      
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  };

  return (
    <div 
      className="settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="settings-modal">
        <div className="settings-header">
          <h2 id="settings-title">Settings</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>
        
        <div className="settings-content">
          <div className="setting-group">
            <label htmlFor="api-key">OpenAI API Key</label>
            <div className="api-key-input-group">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="api-key-input"
              />
              <button 
                className="toggle-visibility"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                type="button"
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="setting-help">
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Dashboard</a>
            </p>
          </div>
        </div>
        
        <div className="settings-footer">
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};