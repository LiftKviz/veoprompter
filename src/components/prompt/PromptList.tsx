import React, { useState, useEffect } from 'react';
import { CategoryType, Prompt } from '@/types';
import { promptDataService } from '@/services/promptDataService';
import { PromptCard } from './PromptCard';
import './PromptList.css';

interface PromptListProps {
  category: CategoryType;
  searchQuery?: string;
  onBack: () => void;
}

export const PromptList: React.FC<PromptListProps> = ({ category, searchQuery = '', onBack }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    if (category === 'my-prompts') {
      // Load saved prompts from storage
      const loadSavedPrompts = async () => {
        const result = await chrome.storage.local.get(['savedPrompts']);
        setSavedPrompts(result.savedPrompts || []);
        setLoading(false);
      };
      loadSavedPrompts();
      return; // Don't subscribe to Firebase updates for saved prompts
    }
    
    // Subscribe to real-time updates from Firebase for all other categories
    const unsubscribe = promptDataService.subscribeToUpdates((updatedPrompts) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`📡 [${timestamp}] Component received real-time update:`, updatedPrompts.length, 'prompts');
      
      if (category === 'all') {
        console.log(`✅ [${timestamp}] Setting ALL prompts:`, updatedPrompts.length);
        setPrompts(updatedPrompts);
      } else {
        const filteredPrompts = updatedPrompts.filter(p => p.category === category);
        console.log(`✅ [${timestamp}] Setting filtered prompts for category '${category}':`, filteredPrompts.length);
        setPrompts(filteredPrompts);
      }
      setLoading(false);
    });
    
    // Initialize data service if not already done
    promptDataService.initialize().catch(error => {
      console.error('Failed to initialize prompts:', error);
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [category]);

  // Filter prompts based on search query
  const filterPrompts = (promptList: Prompt[]) => {
    if (!searchQuery.trim()) return promptList;
    
    const query = searchQuery.toLowerCase();
    return promptList.filter(prompt => 
      prompt.title.toLowerCase().includes(query) ||
      prompt.prompt.toLowerCase().includes(query) ||
      prompt.category.toLowerCase().includes(query)
    );
  };

  const handleSavePrompt = async (prompt: Prompt) => {
    const newPrompt = {
      ...prompt,
      id: `saved-${Date.now()}`,
      category: 'my-prompts' as CategoryType,
      isCustom: true,
      dateAdded: new Date().toISOString()
    };

    const updatedSaved = [...savedPrompts, newPrompt];
    setSavedPrompts(updatedSaved);
    
    // Save to chrome storage
    chrome.storage.local.set({ savedPrompts: updatedSaved });
  };

  const handleRemovePrompt = async (prompt: Prompt) => {
    const updatedSaved = savedPrompts.filter(p => p.id !== prompt.id);
    setSavedPrompts(updatedSaved);
    
    // Update chrome storage
    chrome.storage.local.set({ savedPrompts: updatedSaved });
  };

  const allPrompts = category === 'my-prompts' ? savedPrompts : prompts;
  const displayPrompts = filterPrompts(allPrompts);

  const getTitle = () => {
    if (searchQuery.trim()) {
      return `Search Results (${displayPrompts.length})`;
    }
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getEmptyMessage = () => {
    if (searchQuery.trim()) {
      return `No prompts found for "${searchQuery}". Try different keywords.`;
    }
    if (category === 'my-prompts') {
      return 'No saved prompts yet. Browse categories and save your favorites!';
    }
    return 'No prompts available for this category.';
  };

  return (
    <div className="prompt-list">
      <div className="prompt-list-header">
        <button 
          className="back-button" 
          onClick={onBack}
          aria-label="Go back to categories"
        >
          ← Back
        </button>
        <h2 className="category-title">
          {getTitle()}
        </h2>
      </div>
      
      {loading ? (
        <div className="loading-state">
          <p>Loading prompts...</p>
        </div>
      ) : displayPrompts.length === 0 ? (
        <div className="empty-state">
          <p>{getEmptyMessage()}</p>
        </div>
      ) : (
        <div className="prompts-grid">
          {displayPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onSave={category !== 'my-prompts' ? handleSavePrompt : undefined}
              onRemove={category === 'my-prompts' ? handleRemovePrompt : undefined}
              isSaved={category === 'my-prompts'}
              isCustomPrompt={category === 'my-prompts'}
            />
          ))}
        </div>
      )}
    </div>
  );
};