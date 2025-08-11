// Type declarations for firebaseService.js
import { Prompt } from '@/types';

export declare function uploadPrompts(prompts: Prompt[]): Promise<void>;
export declare function enablePersistentCaching(): Promise<void>;
export declare function onPromptsChanged(callback: (prompts: Prompt[]) => void): () => void;
export declare function initialize(): Promise<void>;
export declare function subscribeToPrompts(callback: (prompts: Prompt[]) => void): () => void;
export declare function unsubscribeFromPrompts(): void;

declare const firebaseService: {
  uploadPrompts: typeof uploadPrompts;
  enablePersistentCaching: typeof enablePersistentCaching;
  onPromptsChanged: typeof onPromptsChanged;
  initialize: typeof initialize;
  subscribeToPrompts: typeof subscribeToPrompts;
  unsubscribeFromPrompts: typeof unsubscribeFromPrompts;
};

export default firebaseService;