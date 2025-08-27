import React, { useState } from 'react';
import { Prompt } from '@/types';
import { GPTService } from '@/services/gptService';
import { Toast } from '../common/Toast';
import { UpgradeModal } from '../common/UpgradeModal';
import { useAuth } from '@/hooks/useAuth';
import './PromptCard.css';

interface PromptCardProps {
  prompt: Prompt;
  onSave?: (prompt: Prompt) => void;
  onRemove?: (prompt: Prompt) => void;
  isSaved?: boolean;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onSave, onRemove, isSaved }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [modifyInstruction, setModifyInstruction] = useState('');
  const [modifiedPrompt, setModifiedPrompt] = useState(prompt.prompt);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [showSequenceSelector, setShowSequenceSelector] = useState(false);
  const [availableSequences, setAvailableSequences] = useState<any[]>([]);

  const { userState, canAccess, getUpgradeMessage, signIn, trackModification, getRemainingModifications } = useAuth();

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCopy = async () => {
    // Copy is always allowed for all users
    try {
      await navigator.clipboard.writeText(modifiedPrompt);
      showToastMessage('📋 Prompt copied to clipboard!');
    } catch (err) {
      try {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = modifiedPrompt;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (success) {
          showToastMessage('📋 Prompt copied to clipboard!');
        } else {
          throw new Error('Copy command failed');
        }
      } catch (fallbackErr) {
        console.error('Copy failed:', fallbackErr);
        showToastMessage('❌ Failed to copy: Please select and copy the text manually');
      }
    }
  };

  const handleModifyClick = () => {
    if (!canAccess('modifyPrompts')) {
      setUpgradeFeature('AI Prompt Modification');
      setUpgradeMessage(getUpgradeMessage('modifyPrompts'));
      setShowUpgradeModal(true);
      return;
    }
    setIsModifying(true);
  };

  const handleModify = async () => {
    if (!modifyInstruction.trim()) {
      showToastMessage('📝 Please enter a modification instruction');
      return;
    }

    // Track usage for free users
    if (userState.tier === 'free') {
      const canTrack = await trackModification();
      if (!canTrack) {
        setUpgradeFeature('Daily Limit Reached');
        setUpgradeMessage('You\'ve used all 3 free modifications today. Upgrade for unlimited access!');
        setShowUpgradeModal(true);
        return;
      }
    }

    setIsLoading(true);
    try {
      const gptService = GPTService.getInstance();
      const modifiedText = await gptService.modifyPrompt({
        prompt: modifiedPrompt,
        instruction: modifyInstruction
      });
      
      setModifiedPrompt(modifiedText);
      setIsModifying(false);
      setModifyInstruction('');
      
      const remaining = getRemainingModifications();
      if (userState.tier === 'free' && remaining > 0) {
        showToastMessage(`✨ Prompt modified! ${remaining} free modifications left today.`);
      } else if (userState.tier === 'free' && remaining === 0) {
        showToastMessage('✨ Prompt modified! That was your last free modification for today.');
      } else {
        showToastMessage('✨ Prompt modified successfully!');
      }
    } catch (error) {
      console.error('Failed to modify prompt:', error);
      const errorMessage = error instanceof Error ? error.message : '❌ Failed to modify prompt';
      showToastMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    if (prompt.youtubeLink) {
      // Open centered popup window
      const width = 1000;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        prompt.youtubeLink,
        'video-preview',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,resizable=yes,scrollbars=yes`
      );
      
      // Focus the popup
      if (popup) {
        popup.focus();
      }
    } else {
      showToastMessage('🎬 Preview coming soon!');
    }
  };

  const handleSave = async () => {
    if (!onSave) return;

    // Check if user can save prompts
    if (!canAccess('savePrompts')) {
      setUpgradeFeature('Save Prompts');
      setUpgradeMessage(getUpgradeMessage('savePrompts'));
      setShowUpgradeModal(true);
      return;
    }

    onSave(prompt);
    showToastMessage('⭐ Prompt saved successfully!');
  };

  const handleRemove = () => {
    if (!onRemove) return;
    
    if (confirm('Are you sure you want to remove this prompt from your collection?')) {
      onRemove(prompt);
      showToastMessage('🗑️ Prompt removed from My Prompts');
    }
  };

  const handleAddToSequence = async () => {
    // Check if user can create sequences
    if (!canAccess('createSequences')) {
      setUpgradeFeature('Sequences');
      setUpgradeMessage(getUpgradeMessage('createSequences'));
      setShowUpgradeModal(true);
      return;
    }

    // Get existing sequences
    const result = await chrome.storage.local.get(['sequences']);
    const sequences = result.sequences || [];
    
    if (sequences.length === 0) {
      showToastMessage('📝 Create a sequence first in the Sequences menu');
      return;
    }

    // Show sequence selector modal
    setAvailableSequences(sequences);
    setShowSequenceSelector(true);
  };

  const handleSequenceSelection = async (selectedSequence: any) => {
    selectedSequence.prompts.push(prompt);
    
    const result = await chrome.storage.local.get(['sequences']);
    const sequences = result.sequences || [];
    const updatedSequences = sequences.map((seq: any) => 
      seq.id === selectedSequence.id ? selectedSequence : seq
    );
    
    await chrome.storage.local.set({ sequences: updatedSequences });
    showToastMessage(`🎬 Added to "${selectedSequence.name}"`);
    setShowSequenceSelector(false);
  };

  const handleAddApiKey = () => {
    // This would open an API key input modal (to be implemented)
    showToastMessage('API key management coming soon!');
  };

  const handleUpgrade = () => {
    // This would redirect to payment page
    showToastMessage('Upgrade flow coming soon!');
  };

  return (
    <>
      <div className="prompt-card">
        <div 
          className="prompt-header" 
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-controls={`prompt-content-${prompt.id}`}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} prompt: ${prompt.title}`}
        >
          <h3 className="prompt-title">{prompt.title}</h3>
          <span className="expand-icon" aria-hidden="true">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
        
        {isExpanded && (
          <div 
            className="prompt-content"
            id={`prompt-content-${prompt.id}`}
            role="region"
            aria-label="Prompt details"
          >
            <p className="prompt-text">{modifiedPrompt}</p>
            
            {isModifying ? (
              <div className="modify-section">
                <textarea
                  className="modify-input"
                  placeholder="How would you like to modify this prompt? (e.g., 'make it more dramatic', 'add slow motion effects')"
                  value={modifyInstruction}
                  onChange={(e) => setModifyInstruction(e.target.value)}
                />
                <div className="modify-actions">
                  <button 
                    className="secondary" 
                    onClick={() => setIsModifying(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="primary" 
                    onClick={handleModify}
                    disabled={isLoading || !modifyInstruction.trim()}
                    aria-label={isLoading ? 'Modifying prompt, please wait' : 'Apply modification to prompt'}
                  >
                    {isLoading ? '⏳ Modifying...' : '✨ Apply'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="prompt-actions" role="group" aria-label="Prompt actions">
                <button 
                  className="action-button" 
                  onClick={handleCopy}
                  aria-label="Copy prompt to clipboard"
                >
                  📋 Copy
                </button>
                <button 
                  className={`action-button ${!canAccess('createSequences') ? 'locked' : ''}`}
                  onClick={handleAddToSequence}
                  aria-label="Add to sequence"
                >
                  🎬 Add to Sequence
                </button>
                <button 
                  className={`action-button ${!canAccess('modifyPrompts') ? 'locked' : ''}`}
                  onClick={handleModifyClick}
                  aria-label={canAccess('modifyPrompts') ? 'Modify this prompt using AI' : 'Modify prompt (requires API key or subscription)'}
                >
                  ✏️ Modify {!canAccess('modifyPrompts') && '🔒'}
                </button>
                <button 
                  className="action-button" 
                  onClick={handlePreview}
                  aria-label="Preview example video"
                >
                  ▶️ Preview
                </button>
                {onSave && !isSaved && (
                  <button 
                    className="action-button" 
                    onClick={handleSave}
                    aria-label="Save prompt to favorites"
                  >
                    ⭐ Save
                  </button>
                )}
                {onRemove && (
                  <button 
                    className="action-button remove-prompt-btn" 
                    onClick={handleRemove}
                    aria-label="Remove prompt from My Prompts"
                  >
                    🗑️ Remove
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {showToast && <Toast message={toastMessage} />}
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
        message={upgradeMessage}
        userState={userState}
        onSignIn={signIn}
        onAddApiKey={handleAddApiKey}
        onUpgrade={handleUpgrade}
      />
      
      {showSequenceSelector && (
        <div className="sequence-selector-modal">
          <div className="modal-content">
            <h3>Select Sequence</h3>
            <p>Choose which sequence to add this prompt to:</p>
            <div className="sequences-list">
              {availableSequences.map((sequence) => (
                <button
                  key={sequence.id}
                  className="sequence-option"
                  onClick={() => handleSequenceSelection(sequence)}
                >
                  <div className="sequence-info">
                    <strong>{sequence.name}</strong>
                    <span>{sequence.prompts.length} prompts</span>
                  </div>
                </button>
              ))}
            </div>
            <button 
              className="cancel-sequence-btn"
              onClick={() => setShowSequenceSelector(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};