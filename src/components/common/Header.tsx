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
  
  const { userState, canAccess, getRemainingModifications } = useAuth();

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
        {/* First row: Logo, title, search, user status, settings */}
        <div className="header-main">
          <div className="header-left">
            <img src="/icons/icon32.svg" alt="VeoPrompter Logo" className="header-logo" />
          </div>
          
          <div className="header-right">
            {onSearch && (
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  aria-label="Search prompts"
                />
                <span className="search-icon" aria-hidden="true">🔍</span>
              </div>
            )}
            
            <div className="user-status-compact">
              {userState.isSignedIn ? (
                <div className="user-info-compact">
                  <button 
                    className={`user-tier-badge-compact tier-${userState.tier} ${userState.tier === 'free' ? 'clickable' : ''}`}
                    onClick={userState.tier === 'free' ? handleUpgradeClick : undefined}
                    disabled={userState.tier === 'paid'}
                    title={userState.tier === 'free' ? 'Click to upgrade to Pro' : 'Pro plan'}
                  >
                    {userState.tier === 'paid' ? '⭐' : '🎁'}
                  </button>
                  {userState.tier === 'free' && (
                    <button 
                      className={`modifications-count-compact ${getRemainingModifications() === 0 ? 'limit-reached' : ''} clickable`}
                      onClick={handleUpgradeClick}
                      title="Click to upgrade for unlimited modifications"
                    >
                      {getRemainingModifications()}/3
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

        {/* Second row: Action buttons */}
        {(canAccess('createPrompts') || canAccess('createSequences')) && (
          <div className="header-actions-compact">
            {canAccess('createPrompts') && (
              <button
                className="action-button-compact create-prompt-btn"
                onClick={() => setShowCreatePrompt(true)}
                title="Create new prompt with AI"
              >
                ✨ Create New Prompt
              </button>
            )}
            {canAccess('createSequences') && (
              <button
                className="action-button-compact sequences-btn"
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