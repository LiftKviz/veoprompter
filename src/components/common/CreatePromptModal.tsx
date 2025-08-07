import React, { useState } from 'react';
import { GPTService } from '@/services/gptService';
import { Prompt, CategoryType } from '@/types';
import './CreatePromptModal.css';

interface CreatePromptModalProps {
  onClose: () => void;
  onSave: (prompt: Prompt) => void;
}

export const CreatePromptModal: React.FC<CreatePromptModalProps> = ({ onClose, onSave }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!description.trim()) {
      setError('Please describe your video idea');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const gptService = GPTService.getInstance();
      
      // Create system prompt for video generation
      const systemPrompt = `You are an expert AI prompt engineer specializing in Google Veo 3. Transform ideas into prompts using the SSASAC framework:

1) SUBJECT: Clearly identify who/what is the focus with specific details (e.g., 'grizzled detective in rumpled trench coat' not 'a man')
2) SCENE: Describe environment in detail - where and when action occurs (e.g., 'dusty attic with afternoon light through grimy window')
3) ACTION: Define what subject is doing with strong verbs, chain actions with 'this happens, then that happens'
4) STYLE: Specify visual aesthetic (e.g., '1990s VHS footage', '8-bit video game', 'claymation', 'filmed on 16mm')
5) AUDIO: Explicitly describe all sounds - dialogue, ambient sounds, SFX, and music (Veo 3's signature feature)
6) CAMERA: Professional camera movements and shot specifications

For dialogue, use format: "Character Name says (with emotional tone): 'Exact words.'" - This prevents mixing up speakers.

Include negative prompt (no subtitles, no on-screen text) unless requested. Generate a professional Veo 3 prompt based on the user's description.`;

      const instruction = `Create a professional Veo 3 video prompt based on this idea: "${description}"

Please create a detailed prompt that includes:
- Specific character descriptions
- Rich environmental details  
- Clear action sequences
- Visual style specifications
- Complete audio design including dialogue and ambient sounds
- Professional camera work

Format as a single cohesive prompt optimized for Veo 3.`;

      const generatedPrompt = await gptService.modifyPrompt({
        prompt: systemPrompt,
        instruction: instruction
      });

      // Create new prompt object
      const newPrompt: Prompt = {
        id: `custom-${Date.now()}`,
        category: 'my-prompts' as CategoryType,
        title: description.length > 50 ? description.substring(0, 47) + '...' : description,
        prompt: generatedPrompt,
        dateAdded: new Date().toISOString(),
        isCustom: true
      };

      onSave(newPrompt);
      onClose();
    } catch (error: any) {
      console.error('Error creating prompt:', error);
      setError(error.message || 'Failed to create prompt. Please try again.');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div className="create-prompt-modal" role="dialog" aria-labelledby="create-prompt-title">
        <div className="modal-header">
          <h2 id="create-prompt-title">✨ Create New Prompt</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="video-description">
              Describe your video idea:
            </label>
            <textarea
              id="video-description"
              className="description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., 'A tech reviewer unboxing the latest smartphone in a modern studio setup' or 'A cooking tutorial showing how to make homemade pasta'"
              rows={4}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button 
              className="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="primary create-button"
              onClick={handleCreate}
              disabled={loading || !description.trim()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  ✨ Create Prompt
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};