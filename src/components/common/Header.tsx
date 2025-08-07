import React, { useState, useEffect } from 'react';
import { Settings } from './Settings';
import { GoogleAuth } from './GoogleAuth';
import { CreatePromptModal } from './CreatePromptModal';
import { SequencesModal } from './SequencesModal';
import { GPTService } from '@/services/gptService';
import { Prompt } from '@/types';
import './Header.css';

interface HeaderProps {
  searchQuery?: string;
  onSearch?: (query: string) => void;
  onPromptCreated?: (prompt: Prompt) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery = '', onSearch, onPromptCreated }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [showSequences, setShowSequences] = useState(false);
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

  const handlePromptSave = async (prompt: Prompt) => {
    // Save to My Prompts
    const result = await chrome.storage.local.get(['savedPrompts']);
    const savedPrompts = result.savedPrompts || [];
    const updatedPrompts = [...savedPrompts, prompt];
    
    await chrome.storage.local.set({ savedPrompts: updatedPrompts });
    
    if (onPromptCreated) {
      onPromptCreated(prompt);
    }
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
            <GoogleAuth />
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

        {/* Action Buttons */}
        {hasApiKey && (
          <div className="action-buttons">
            <button
              className="action-button create-prompt-btn"
              onClick={() => setShowCreatePrompt(true)}
              title="Create new prompt with AI"
            >
              ✨ Create New Prompt
            </button>
            <button
              className="action-button sequences-btn"
              onClick={() => setShowSequences(true)}
              title="Manage sequences"
            >
              🎬 Sequences
            </button>
          </div>
        )}
      </header>
      
      {showSettings && (
        <Settings onClose={handleSettingsClose} />
      )}
      
      {showCreatePrompt && (
        <CreatePromptModal 
          onClose={() => setShowCreatePrompt(false)}
          onSave={handlePromptSave}
        />
      )}
      
      {showSequences && (
        <SequencesModal 
          onClose={() => setShowSequences(false)}
        />
      )}
    </>
  );
};