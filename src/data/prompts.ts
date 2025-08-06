import { Prompt } from '@/types';

export const samplePrompts: Prompt[] = [
  // Ads
  {
    id: 'ad-1',
    category: 'ads',
    title: 'Product Launch Teaser',
    prompt: 'Create a 30-second teaser video for a new tech product launch. Start with a mysterious close-up shot, gradually revealing the product with dramatic lighting. Include fast-paced cuts, modern electronic music, and end with the product logo and release date.',
    youtubeLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    dateAdded: '2024-01-15'
  },
  {
    id: 'ad-2',
    category: 'ads',
    title: 'Lifestyle Brand Commercial',
    prompt: 'Film a lifestyle commercial showing people using the product in everyday situations. Use natural lighting, authentic moments, upbeat background music. Focus on emotions and experiences rather than product features.',
    youtubeLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    dateAdded: '2024-01-15'
  },
  
  // Storytelling
  {
    id: 'story-1',
    category: 'storytelling',
    title: 'Mystery Short Film Opening',
    prompt: 'Create an opening scene for a mystery short film. Start with an establishing shot of a foggy street at night, slow zoom into a window where a silhouette appears and disappears. Use suspenseful music and ambient street sounds.',
    youtubeLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    dateAdded: '2024-01-16'
  },
  {
    id: 'story-2',
    category: 'storytelling',
    title: 'Time-lapse Story',
    prompt: 'Tell a story through time-lapse: Show a day in the life of a busy coffee shop from opening to closing. Capture the changing crowd, light throughout the day, and small human moments in fast motion.',
    dateAdded: '2024-01-16'
  },
  
  // Tutorial
  {
    id: 'tut-1',
    category: 'tutorial',
    title: 'Cooking Tutorial Style',
    prompt: 'Film a cooking tutorial with overhead shots of ingredients and preparation. Use close-up shots of key techniques, smooth transitions between steps, and text overlays for measurements and timing.',
    youtubeLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    dateAdded: '2024-01-17'
  },
  {
    id: 'tut-2',
    category: 'tutorial',
    title: 'DIY Project Guide',
    prompt: 'Create a DIY tutorial showing step-by-step assembly. Use multiple angles, slow-motion for complex parts, clear lighting on the work surface, and picture-in-picture for detailed views.',
    dateAdded: '2024-01-17'
  },
  
  // Vlogging
  {
    id: 'vlog-1',
    category: 'vlogging',
    title: 'Day in My Life',
    prompt: 'Film a "day in my life" vlog with handheld camera movement. Include morning routine, work/study moments, meals, and evening activities. Use natural lighting, conversational tone, and background music during transitions.',
    youtubeLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    dateAdded: '2024-01-18'
  },
  {
    id: 'vlog-2',
    category: 'vlogging',
    title: 'Travel Vlog Montage',
    prompt: 'Create a travel vlog montage: Quick cuts of different locations, local food, cultural experiences. Mix wide establishing shots with close-up details. Upbeat music, natural sound breaks, and smooth transitions.',
    dateAdded: '2024-01-18'
  }
];