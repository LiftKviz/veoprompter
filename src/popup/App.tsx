import React, { useState } from 'react';
import { AppState, CategoryType } from '@/types';
import { Header } from '@/components/common/Header';
import { CategoryGrid } from '@/components/prompt/CategoryGrid';
import { PromptList } from '@/components/prompt/PromptList';
import SubscriptionStatus from '@/components/common/SubscriptionStatus';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    activeCategory: null,
    view: 'browse'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategorySelect = (category: CategoryType | null) => {
    setAppState(prev => ({
      ...prev,
      activeCategory: category,
      view: category === 'my-prompts' ? 'my-prompts' : 'browse'
    }));
    // Clear search when switching categories
    setSearchQuery('');
  };

  const handleBack = () => {
    setAppState({
      activeCategory: null,
      view: 'browse'
    });
    setSearchQuery('');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // If searching, show all prompts regardless of category
    if (query.trim()) {
      setAppState(prev => ({
        ...prev,
        activeCategory: 'all', // Special category for search results
        view: 'search'
      }));
    } else if (appState.view === 'search') {
      // Clear search and go back to browse view
      setAppState({
        activeCategory: null,
        view: 'browse'
      });
    }
  };

  const renderContent = () => {
    if (appState.activeCategory) {
      return (
        <PromptList
          category={appState.activeCategory}
          searchQuery={searchQuery}
          onBack={handleBack}
        />
      );
    }
    return <CategoryGrid onCategorySelect={handleCategorySelect} />;
  };

  const handlePromptCreated = () => {
    setSearchQuery('');
    setAppState({ activeCategory: 'my-prompts' as CategoryType, view: 'my-prompts' });
  };

  return (
    <div className="app">
      <Header 
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onPromptCreated={handlePromptCreated}
      />
      <SubscriptionStatus showDetailsButton={false} />
      <main className="app-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;