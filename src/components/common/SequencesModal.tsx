import React, { useState, useEffect } from 'react';
import { Prompt } from '@/types';
import { CreatePromptModal } from './CreatePromptModal';
import { GPTService } from '@/services/gptService';
import './SequencesModal.css';

interface Sequence {
  id: string;
  name: string;
  prompts: Prompt[];
  createdAt: string;
}

interface SequencesModalProps {
  onClose: () => void;
}

interface SequencePromptCardProps {
  prompt: Prompt;
  index: number;
  onRemove: () => void;
  onNextScene: (prompt: Prompt, instruction: string) => void;
}

const SequencePromptCard: React.FC<SequencePromptCardProps> = ({ prompt, index, onRemove, onNextScene }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNextSceneModal, setShowNextSceneModal] = useState(false);
  const [nextSceneInstruction, setNextSceneInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNextScene = async () => {
    if (!nextSceneInstruction.trim()) return;
    
    setIsGenerating(true);
    try {
      await onNextScene(prompt, nextSceneInstruction);
      setShowNextSceneModal(false);
      setNextSceneInstruction('');
    } catch (error) {
      console.error('Failed to generate next scene:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="sequence-prompt-card">
      <div className="prompt-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="prompt-info">
          <div className="sequence-number">#{index + 1}</div>
          <div className="prompt-title-section">
            <h4>{prompt.title}</h4>
            {!isExpanded && <p className="prompt-preview">{prompt.prompt.substring(0, 100)}...</p>}
          </div>
        </div>
        <div className="prompt-controls">
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="prompt-expanded">
          <p className="prompt-full-text">{prompt.prompt}</p>
          <div className="prompt-actions">
            <button className="action-btn copy-btn" onClick={handleCopy}>
              📋 Copy
            </button>
            <button className="action-btn next-scene-btn" onClick={() => setShowNextSceneModal(true)}>
              🎬 Next Scene
            </button>
            <button className="action-btn remove-btn" onClick={onRemove}>
              🗑️ Remove
            </button>
          </div>
        </div>
      )}
      
      {showNextSceneModal && (
        <div className="next-scene-modal">
          <div className="modal-content">
            <h3>Create Next Scene</h3>
            <p>Describe what happens in the next scene. Characters and style will be preserved.</p>
            <textarea
              value={nextSceneInstruction}
              onChange={(e) => setNextSceneInstruction(e.target.value)}
              placeholder="e.g., The character walks into a coffee shop and orders a latte, then sits by the window watching the rain"
              rows={4}
            />
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowNextSceneModal(false)}
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button 
                className="generate-btn" 
                onClick={handleNextScene}
                disabled={!nextSceneInstruction.trim() || isGenerating}
              >
                {isGenerating ? '⏳ Generating...' : '✨ Generate Scene'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SequencesModal: React.FC<SequencesModalProps> = ({ onClose }) => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSequenceName, setNewSequenceName] = useState('');
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    setLoading(true);
    try {
      const result = await chrome.storage.local.get(['sequences']);
      const savedSequences = result.sequences || [];
      setSequences(savedSequences);
    } catch (error) {
      console.error('Failed to load sequences:', error);
    }
    setLoading(false);
  };

  const saveSequences = async (updatedSequences: Sequence[]) => {
    try {
      await chrome.storage.local.set({ sequences: updatedSequences });
      setSequences(updatedSequences);
    } catch (error) {
      console.error('Failed to save sequences:', error);
    }
  };

  const createSequence = async () => {
    if (!newSequenceName.trim()) return;

    const newSequence: Sequence = {
      id: `sequence-${Date.now()}`,
      name: newSequenceName.trim(),
      prompts: [],
      createdAt: new Date().toISOString()
    };

    const updatedSequences = [...sequences, newSequence];
    await saveSequences(updatedSequences);
    
    setNewSequenceName('');
    setShowCreateForm(false);
    setSelectedSequence(newSequence);
  };

  const deleteSequence = async (sequenceId: string) => {
    if (!confirm('Are you sure you want to delete this sequence?')) return;
    
    const updatedSequences = sequences.filter(seq => seq.id !== sequenceId);
    await saveSequences(updatedSequences);
    
    if (selectedSequence?.id === sequenceId) {
      setSelectedSequence(null);
    }
  };

  const addPromptToSequence = async (prompt: Prompt) => {
    if (!selectedSequence) return;

    const updatedSequence = {
      ...selectedSequence,
      prompts: [...selectedSequence.prompts, prompt]
    };

    const updatedSequences = sequences.map(seq => 
      seq.id === selectedSequence.id ? updatedSequence : seq
    );
    
    await saveSequences(updatedSequences);
    setSelectedSequence(updatedSequence);
  };

  const handlePromptCreated = async (prompt: Prompt) => {
    await addPromptToSequence(prompt);
    setShowCreatePrompt(false);
  };

  const handleNextScene = async (previousPrompt: Prompt, instruction: string) => {
    if (!selectedSequence) return;
    
    const gptService = GPTService.getInstance();
    
    // Create a special instruction that preserves character consistency
    const nextSceneInstruction = `
    Create the next scene in this sequence. 
    
    IMPORTANT: Maintain character consistency:
    - Keep the same character descriptions, clothing, and appearance
    - Keep the same visual style and cinematography
    - Keep the same mood and tone
    
    Previous scene: ${previousPrompt.prompt}
    
    Next scene should: ${instruction}
    
    Generate a prompt that continues the story while maintaining all character and style elements from the previous scene.
    `;
    
    try {
      const nextScenePrompt = await gptService.modifyPrompt({
        prompt: previousPrompt.prompt,
        instruction: nextSceneInstruction
      });
      
      // Create a new prompt object for the next scene
      const newPrompt: Prompt = {
        id: `scene-${Date.now()}`,
        category: previousPrompt.category,
        title: `${previousPrompt.title} - Scene ${selectedSequence.prompts.length + 1}`,
        prompt: nextScenePrompt,
        dateAdded: new Date().toISOString(),
        isCustom: true
      };
      
      await addPromptToSequence(newPrompt);
    } catch (error) {
      console.error('Failed to generate next scene:', error);
      throw error;
    }
  };

  const removePromptFromSequence = async (promptIndex: number) => {
    if (!selectedSequence) return;

    const updatedSequence = {
      ...selectedSequence,
      prompts: selectedSequence.prompts.filter((_, index) => index !== promptIndex)
    };

    const updatedSequences = sequences.map(seq => 
      seq.id === selectedSequence.id ? updatedSequence : seq
    );
    
    await saveSequences(updatedSequences);
    setSelectedSequence(updatedSequence);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const renderSequencesList = () => (
    <div className="sequences-list">
      <div className="sequences-header">
        <h3>Your Sequences</h3>
        <button 
          className="create-sequence-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + New Sequence
        </button>
      </div>

      {showCreateForm && (
        <div className="create-sequence-form">
          <input
            type="text"
            placeholder="Sequence name (e.g., 'Product Launch Campaign')"
            value={newSequenceName}
            onChange={(e) => setNewSequenceName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createSequence()}
            autoFocus
          />
          <div className="form-actions">
            <button onClick={() => setShowCreateForm(false)}>Cancel</button>
            <button 
              onClick={createSequence}
              disabled={!newSequenceName.trim()}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading sequences...</div>
      ) : sequences.length === 0 ? (
        <div className="empty-state">
          <p>No sequences created yet.</p>
          <p>Create a sequence to organize multiple prompts for a video series or campaign.</p>
        </div>
      ) : (
        <div className="sequences-grid">
          {sequences.map((sequence) => (
            <div 
              key={sequence.id}
              className="sequence-card"
              onClick={() => setSelectedSequence(sequence)}
            >
              <div className="sequence-info">
                <h4>{sequence.name}</h4>
                <p>{sequence.prompts.length} prompts</p>
                <span className="sequence-date">
                  Created {new Date(sequence.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button
                className="delete-sequence-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSequence(sequence.id);
                }}
                title="Delete sequence"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSequenceDetails = () => {
    if (!selectedSequence) return null;

    return (
      <div className="sequence-details">
        <div className="sequence-header">
          <button 
            className="back-button"
            onClick={() => setSelectedSequence(null)}
          >
            ← Back to Sequences
          </button>
          <h3>{selectedSequence.name}</h3>
        </div>

        <div className="sequence-actions">
          <button
            className="add-prompt-btn"
            onClick={() => setShowCreatePrompt(true)}
          >
            ✨ Add New Prompt
          </button>
        </div>

        <div className="sequence-prompts">
          {selectedSequence.prompts.length === 0 ? (
            <div className="empty-sequence">
              <p>This sequence is empty.</p>
              <p>Click "Add New Prompt" to create a prompt for this sequence.</p>
            </div>
          ) : (
            <div className="prompts-list">
              {selectedSequence.prompts.map((prompt, index) => (
                <SequencePromptCard
                  key={index}
                  prompt={prompt}
                  index={index}
                  onRemove={() => removePromptFromSequence(index)}
                  onNextScene={handleNextScene}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="modal-backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
        <div className="sequences-modal" role="dialog" aria-labelledby="sequences-title">
          <div className="modal-header">
            <h2 id="sequences-title">🎬 Sequences</h2>
            <button 
              className="close-button"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            {selectedSequence ? renderSequenceDetails() : renderSequencesList()}
          </div>
        </div>
      </div>
      
      {showCreatePrompt && (
        <CreatePromptModal
          onClose={() => setShowCreatePrompt(false)}
          onSave={handlePromptCreated}
        />
      )}
    </>
  );
};