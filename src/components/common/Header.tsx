import React, { useState } from 'react';
import { Settings } from './Settings';
import { GoogleAuth } from './GoogleAuth';
import { CreatePromptModal } from './CreatePromptModal';
import { SequencesModal } from './SequencesModal';
import { UpgradeModal } from './UpgradeModal';
import { Prompt } from '@/types';
import { useAuth } from '@/hooks/useAuth';
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
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  const { userState, featureAccess, canAccess, getRemainingModifications } = useAuth();

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const handleUpgradeClick = () => {
    console.log('Upgrade clicked!'); // Debug log
    setShowUpgrade(true);
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
            {/* User Status Indicator */}
            <div className="user-status">
              {userState.isSignedIn ? (
                <div className="user-info">
                  <button 
                    className={`user-tier-badge tier-${userState.tier} ${userState.tier === 'free' ? 'clickable' : ''}`}
                    onClick={userState.tier === 'free' ? handleUpgradeClick : undefined}
                    disabled={userState.tier === 'paid'}
                    title={userState.tier === 'free' ? 'Click to upgrade to Pro' : 'Pro plan'}
                  >
                    {userState.tier === 'paid' ? '⭐ Pro' : '🎁 Free'}
                  </button>
                  {userState.tier === 'free' && (
                    <button 
                      className={`modifications-count ${getRemainingModifications() === 0 ? 'limit-reached' : ''} clickable`}
                      onClick={handleUpgradeClick}
                      title="Click to upgrade for unlimited modifications"
                    >
                      {getRemainingModifications()}/3 left
                    </button>
                  )}
                </div>
              ) : (
                <GoogleAuth />
              )}
            </div>
            <button 
              className="icon-button"
              onClick={openSettings}
              aria-label="Open settings"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Action Buttons - Show for users with appropriate access */}
        {(canAccess('createPrompts') || canAccess('createSequences')) && (
          <div className="action-buttons">
            {canAccess('createPrompts') && (
              <button
                className="action-button create-prompt-btn"
                onClick={() => setShowCreatePrompt(true)}
                title="Create new prompt with AI"
              >
                ✨ Create New Prompt
              </button>
            )}
            {canAccess('createSequences') && (
              <button
                className="action-button sequences-btn"
                onClick={() => setShowSequences(true)}
                title="Manage sequences"
              >
                🎬 Sequences
              </button>
            )}
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
      
      {showUpgrade && (
        <UpgradeModal 
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          feature="Pro Features"
          message="Upgrade to Pro for unlimited modifications and advanced features"
          userState={userState}
          onUpgrade={() => {
            // TODO: Implement upgrade flow
            window.open('https://your-upgrade-url.com', '_blank');
            setShowUpgrade(false);
          }}
        />
      )}
    </>
  );
};