import React from 'react';
import { CategoryType } from '@/types';
import { categories } from '@/data/categories';
import './CategoryGrid.css';

interface CategoryGridProps {
  onCategorySelect: (category: CategoryType) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onCategorySelect }) => {
  const handleKeyDown = (event: React.KeyboardEvent, category: CategoryType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onCategorySelect(category);
    }
  };

  const formatCategoryName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <main className="category-grid" role="main" aria-label="Prompt categories">
      {categories.map((category) => {
        const categoryDisplayName = formatCategoryName(category.name);
        
        return (
          <div
            key={category.id}
            className="category-card"
            onClick={() => onCategorySelect(category.name)}
            onKeyDown={(e) => handleKeyDown(e, category.name)}
            style={{ borderColor: category.color }}
            role="button"
            tabIndex={0}
            aria-label={`${categoryDisplayName} category. ${category.description}`}
          >
            <div 
              className="category-icon" 
              style={{ backgroundColor: category.color + '20' }}
              aria-hidden="true"
            >
              {category.icon}
            </div>
            <h3 className="category-name">
              {categoryDisplayName}
            </h3>
            <p className="category-description">{category.description}</p>
            <span className="category-count" aria-label="Click to view prompts in this category">
              View prompts
            </span>
          </div>
        );
      })}
    </main>
  );
};