import React, { useState, useEffect } from 'react';
import { Settings } from './Settings';
import { GPTService } from '@/services/gptService';
import './Header.css';

interface HeaderProps {
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery = '', onSearch }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      const apiKey = await GPTService.getInstance().getApiKey();
      const hasKey = Boolean(apiKey);
      setHasApiKey(hasKey);
      
      // Show onboarding if no API key is set
      if (!hasKey) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to check API key status:', error);
      setHasApiKey(false);
    }
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
    setShowOnboarding(false);
    // Recheck API key status after settings are closed
    checkApiKeyStatus();
  };

  const openSettings = () => {
    setShowSettings(true);
    setShowOnboarding(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <img src="/icons/icon32.svg" alt="Veo 3 Logo" className="header-logo" />
            <h1 className="header-title">Veo 3 Prompt Assistant</h1>
          </div>
          <div className="header-actions">
            {onSearch && (
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  aria-label="Search prompts"
                />
                <span className="search-icon" aria-hidden="true">🔍</span>
              </div>
            )}
            {hasApiKey !== null && (
              <div className="api-status">
                <span 
                  className={`status-indicator ${hasApiKey ? 'connected' : 'disconnected'}`}
                  title={hasApiKey ? 'API key configured' : 'API key required'}
                >
                  {hasApiKey ? '🟢' : '🔴'}
                </span>
              </div>
            )}
            <button 
              className="icon-button"
              onClick={openSettings}
              aria-label="Open settings"
            >
              ⚙️
            </button>
          </div>
        </div>
        
        {showOnboarding && !hasApiKey && (
          <div className="onboarding-banner">
            <div className="onboarding-content">
              <h3>🚀 Get Started!</h3>
              <p>Add your OpenAI API key to unlock prompt modification features.</p>
              <button 
                className="primary setup-button"
                onClick={openSettings}
              >
                Setup API Key
              </button>
            </div>
          </div>
        )}
      </header>
      
      {showSettings && (
        <Settings onClose={handleSettingsClose} />
      )}
    </>
  );
};