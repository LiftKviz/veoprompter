import { Prompt, CategoryType } from '@/types';

export async function loadPromptsFromFile(): Promise<Prompt[]> {
  try {
    const response = await fetch('/data/prompts.txt');
    const text = await response.text();
    return parsePrompts(text);
  } catch (error) {
    console.error('Error loading prompts:', error);
    return getHardcodedPrompts();
  }
}

export function parsePrompts(text: string): Prompt[] {
  const lines = text.split('\n');
  const prompts: Prompt[] = [];
  let idCounter = 1;

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      continue;
    }

    const parts = line.split('|');
    if (parts.length >= 3) {
      const [category, title, promptText, youtubeLink] = parts;
      
      // Validate category
      const validCategories: CategoryType[] = ['ads', 'storytelling', 'tutorial', 'vlogging', 'my-prompts'];
      if (!validCategories.includes(category.trim() as CategoryType)) {
        continue;
      }

      prompts.push({
        id: `prompt-${idCounter++}`,
        category: category.trim() as CategoryType,
        title: title.trim(),
        prompt: promptText.trim(),
        youtubeLink: youtubeLink?.trim() || undefined,
        dateAdded: new Date().toISOString(),
        isCustom: false
      });
    }
  }

  return prompts;
}

// For use in development - loads prompts from hardcoded string
export function getHardcodedPrompts(): Prompt[] {
  const promptsText = `# Veo 3 Prompts Database
# Format: category|title|prompt|youtubeLink (optional)
# Lines starting with # are comments
# Categories: ads, storytelling, tutorial, vlogging

ads|Product Launch Teaser|Create a 30-second teaser video for a new tech product launch. Start with a mysterious close-up shot, gradually revealing the product with dramatic lighting. Include fast-paced cuts, modern electronic music, and end with the product logo and release date.|https://youtube.com/watch?v=dQw4w9WgXcQ

ads|Lifestyle Brand Commercial|Film a lifestyle commercial showing people using the product in everyday situations. Use natural lighting, authentic moments, upbeat background music. Focus on emotions and experiences rather than product features.|https://youtube.com/watch?v=dQw4w9WgXcQ

ads|Social Media Ad|Create a 15-second vertical video ad for social media. Fast-paced, eye-catching opening, product demonstration, clear call-to-action. Optimized for mobile viewing without sound.|

storytelling|Mystery Short Film Opening|Create an opening scene for a mystery short film. Start with an establishing shot of a foggy street at night, slow zoom into a window where a silhouette appears and disappears. Use suspenseful music and ambient street sounds.|https://youtube.com/watch?v=dQw4w9WgXcQ

storytelling|Time-lapse Story|Tell a story through time-lapse: Show a day in the life of a busy coffee shop from opening to closing. Capture the changing crowd, light throughout the day, and small human moments in fast motion.|

storytelling|Emotional Reunion|Film an emotional reunion scene at an airport. Focus on facial expressions, use slow motion for the embrace, soft background music. Capture genuine emotions with close-ups and reaction shots.|

tutorial|Cooking Tutorial Style|Film a cooking tutorial with overhead shots of ingredients and preparation. Use close-up shots of key techniques, smooth transitions between steps, and text overlays for measurements and timing.|https://youtube.com/watch?v=dQw4w9WgXcQ

tutorial|DIY Project Guide|Create a DIY tutorial showing step-by-step assembly. Use multiple angles, slow-motion for complex parts, clear lighting on the work surface, and picture-in-picture for detailed views.|

tutorial|Tech Tutorial|Create a screen recording tutorial with picture-in-picture of presenter. Clear voiceover, highlight cursor movements, zoom in on important details. Add captions for key steps.|

vlogging|Day in My Life|Film a "day in my life" vlog with handheld camera movement. Include morning routine, work/study moments, meals, and evening activities. Use natural lighting, conversational tone, and background music during transitions.|https://youtube.com/watch?v=dQw4w9WgXcQ

vlogging|Travel Vlog Montage|Create a travel vlog montage: Quick cuts of different locations, local food, cultural experiences. Mix wide establishing shots with close-up details. Upbeat music, natural sound breaks, and smooth transitions.|

vlogging|Room Tour|Film a room tour with smooth camera movements. Start with a wide shot, then detail shots of interesting items. Natural lighting, personal commentary, and background music. Show personality through decor choices.|`;

  return parsePrompts(promptsText);
}