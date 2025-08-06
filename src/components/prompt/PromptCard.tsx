import React, { useState } from 'react';
import { Prompt } from '@/types';
import { GPTService } from '@/services/gptService';
import { Toast } from '../common/Toast';
import PaymentGate from '../common/PaymentGate';
import { paymentService } from '@/services/paymentService';
import './PromptCard.css';

interface PromptCardProps {
  prompt: Prompt;
  onSave?: (prompt: Prompt) => void;
  isSaved?: boolean;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onSave, isSaved }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [modifyInstruction, setModifyInstruction] = useState('');
  const [modifiedPrompt, setModifiedPrompt] = useState(prompt.prompt);
  const [isLoading, setIsLoading] = useState(false);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCopy = async () => {
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

  const handleModify = async () => {
    if (!modifyInstruction.trim()) {
      showToastMessage('📝 Please enter a modification instruction');
      return;
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
      showToastMessage('✨ Prompt modified successfully!');
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
      window.open(prompt.youtubeLink, '_blank');
    } else {
      showToastMessage('🎬 Preview coming soon!');
    }
  };

  const handleSave = async () => {
    if (!onSave) return;

    // Check if user can save more prompts
    const canTrack = await paymentService.trackUsage('saved_prompt');
    if (!canTrack) {
      const remaining = await paymentService.getRemainingUsage('saved_prompt');
      if (remaining === 0) {
        showToastMessage('💎 Save Limit Reached: Upgrade to Premium for unlimited saved prompts!');
        return;
      }
    }

    onSave(prompt);
    showToastMessage('⭐ Prompt saved successfully!');
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
                <PaymentGate 
                  feature="gpt_modification" 
                  fallback={
                    <button 
                      className="action-button disabled" 
                      disabled
                      aria-label="Modify prompt (Premium feature)"
                    >
                      ✏️ Modify (Premium)
                    </button>
                  }
                  showUpgradePrompt={false}
                >
                  <button 
                    className="action-button" 
                    onClick={() => setIsModifying(true)}
                    aria-label="Modify this prompt using AI"
                  >
                    ✏️ Modify
                  </button>
                </PaymentGate>
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
              </div>
            )}
          </div>
        )}
      </div>
      
      {showToast && <Toast message={toastMessage} />}
    </>
  );
};