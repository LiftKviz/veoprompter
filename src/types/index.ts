export interface Prompt {
  id: string;
  category: CategoryType;
  title: string;
  prompt: string;
  youtubeLink?: string;
  dateAdded: string;
  isCustom?: boolean;
}

export interface Category {
  id: string;
  name: CategoryType;
  icon: string;
  description: string;
  color: string;
}

export type CategoryType = 
  | 'ads'
  | 'storytelling'
  | 'tutorial'
  | 'vlogging'
  | 'mobile-game'
  | 'street-interview'
  | 'tech-influencer'
  | 'my-prompts'
  | 'all'; // Special category for search results

export interface UserLibrary {
  savedPrompts: Prompt[];
  lastUpdated: string;
}

export interface AppState {
  activeCategory: CategoryType | null;
  view: 'browse' | 'my-prompts' | 'search';
}

export interface GPTModifyRequest {
  prompt: string;
  instruction: string;
}