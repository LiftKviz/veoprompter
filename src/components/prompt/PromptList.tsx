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
    // Load prompts from data service
    const loadPrompts = async () => {
      setLoading(true);
      try {
        if (category === 'my-prompts') {
          // Load saved prompts from storage
          const result = await chrome.storage.local.get(['savedPrompts']);
          setSavedPrompts(result.savedPrompts || []);
        } else if (category === 'all') {
          // For search results, load all prompts
          const allPrompts = await promptDataService.getPrompts();
          setPrompts(allPrompts);
        } else {
          // Load prompts by category
          const categoryPrompts = await promptDataService.getPromptsByCategory(category);
          setPrompts(categoryPrompts);
        }
      } catch (error) {
        console.error('Failed to load prompts:', error);
      }
      setLoading(false);
    };
    
    loadPrompts();
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
              isSaved={category === 'my-prompts'}
            />
          ))}
        </div>
      )}
    </div>
  );
};