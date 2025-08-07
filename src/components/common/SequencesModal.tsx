import React, { useState, useEffect } from 'react';
import { Prompt } from '@/types';
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

export const SequencesModal: React.FC<SequencesModalProps> = ({ onClose }) => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSequenceName, setNewSequenceName] = useState('');

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

        <div className="sequence-prompts">
          {selectedSequence.prompts.length === 0 ? (
            <div className="empty-sequence">
              <p>This sequence is empty.</p>
              <p>Add prompts from your library to build a video sequence.</p>
            </div>
          ) : (
            <div className="prompts-list">
              {selectedSequence.prompts.map((prompt, index) => (
                <div key={index} className="sequence-prompt-card">
                  <div className="prompt-info">
                    <div className="sequence-number">#{index + 1}</div>
                    <div className="prompt-content">
                      <h4>{prompt.title}</h4>
                      <p>{prompt.prompt.substring(0, 150)}...</p>
                    </div>
                  </div>
                  <button
                    className="remove-prompt-btn"
                    onClick={() => removePromptFromSequence(index)}
                    title="Remove from sequence"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
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
  );
};