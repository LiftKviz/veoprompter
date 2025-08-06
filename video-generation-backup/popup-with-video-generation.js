// Veo 3 Prompt Assistant - Template Customization System
console.log('Popup script loading...');

// Prompts data - now acting as templates
var promptsData = [
  {
    id: 'ad-1',
    category: 'ads',
    title: 'Product Launch Teaser',
    prompt: '8-second cinematic product launch teaser. Close-up shot of sleek tech product on minimalist white surface with dramatic side lighting creating shadows. Product slowly rotates 360 degrees revealing key features. High-contrast lighting with cool blue accent lights. Static camera with shallow depth of field. Background shows subtle tech environment with blurred LED panels. Action: product rotates smoothly, subtle light reflections on surface, final pause showing logo. Audio: modern electronic pulse music building to crescendo, subtle tech sounds. Mysterious, premium, cutting-edge mood. Text overlay appears: "Innovation Redefined" and release date. Perfect for social media and web campaigns.',
    youtubeLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    customFields: ['Product Name', 'Product Type', 'Key Feature', 'Target Audience', 'Other']
  },
  {
    id: 'ad-2',
    category: 'ads',
    title: 'Lifestyle Brand Commercial',
    prompt: '8-second lifestyle brand commercial. Medium shot of attractive young woman in her late 20s with natural makeup and flowing hair, sitting in bright modern café with large windows. Wearing casual chic outfit while using branded product naturally. Handheld camera with slight movement for authentic feel. Golden hour lighting streaming through windows creating warm ambience. Background shows blurred café patrons, plants, modern décor. Action: naturally interacts with product, genuine smile, looks up with satisfied expression. Audio: upbeat acoustic music, natural café ambience, soft laughter. Authentic, aspirational, relatable mood focusing on lifestyle enhancement rather than product features. Perfect for millennial and Gen-Z targeting.',
    youtubeLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    customFields: ['Brand Name', 'Product Type', 'Lifestyle Setting', 'Target Emotion', 'Other']
  },
  {
    id: 'ad-3',
    category: 'ads',
    title: 'Social Media Ad',
    prompt: '8-second vertical social media ad (9:16 aspect ratio). Dynamic overhead shot of energetic content creator in her early 20s with vibrant colored hair and trendy streetwear, demonstrating product on clean white desk. Ring light providing even lighting with colorful LED strips in background. Fast-paced handheld camera with quick zoom transitions. Background shows modern creative workspace with plants, aesthetic décor. Action: picks up product enthusiastically, demonstrates key feature in 3 seconds, points directly at camera. Audio: upbeat trending music, no dialogue (optimized for silent viewing). Bold text overlays: "You NEED this!" and clear CTA button. Energetic, Gen-Z focused, scroll-stopping visual style perfect for TikTok, Instagram Reels.',
    youtubeLink: null,
    customFields: ['Product Name', 'Social Platform', 'Call to Action', 'Visual Style', 'Other']
  },
  {
    id: 'ad-4',
    category: 'ads',
    title: 'IKEA Empty Room Assembly',
    prompt: 'Create a cinematic, photorealistic 4K video in 16:9 aspect ratio. Fixed wide-angle shot of empty Scandinavian room with white walls, light wood floors. Sealed IKEA box trembles (0-1s), bursts open with cardboard dust (1-2s), furniture pieces fly out in hyper-lapse assembly creating bed, tables, lamps, wardrobe (2-6s), yellow throw blanket lands softly on bed (6-8s). Audio: rumbling, cardboard pop, fast ASMR assembly sounds, final soft landing. No people, text, or distracting music.',
    youtubeLink: null,
    customFields: ['Product Type', 'Brand Name', 'Assembly Components', 'Final Result', 'Other']
  },
  {
    id: 'story-1',
    category: 'storytelling',
    title: 'Mystery Short Film Opening',
    prompt: '8-second cinematic mystery opening. Wide establishing shot of empty Victorian street at night with thick fog rolling between vintage lampposts. Slow zoom toward second-floor window of old brick building where mysterious silhouette appears briefly then vanishes. Handheld camera with subtle movement, shallow depth of field. Moody lighting with amber streetlights cutting through fog, creating dramatic shadows. Background shows period details: cobblestones, vintage architecture, bare tree branches. Action: fog drifts mysteriously, silhouette moves across window, curtain falls. Audio: suspenseful orchestral strings, distant footsteps echoing, wind through trees, subtle creak. Dark, atmospheric, film noir mood building tension and intrigue. Perfect for thriller and mystery content.',
    youtubeLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    customFields: ['Setting', 'Time Period', 'Main Character', 'Mystery Element', 'Other']
  },
  {
    id: 'story-2',
    category: 'storytelling',
    title: 'Time-lapse Story',
    prompt: '8-second time-lapse story of bustling coffee shop from dawn to dusk. Fixed wide-angle shot from corner position showing entire café interior with large windows. Time-lapse captures changing natural light from blue morning to golden sunset streaming through windows. Background shows urban coffee shop with exposed brick, hanging plants, wooden tables, barista counter. Action: staff arrives and prepares (fast motion), morning rush with business people, afternoon laptop workers, evening couples, closing routine. Customers flow in accelerated motion creating human patterns. Audio: upbeat indie acoustic music, layered with accelerated coffee shop sounds - grinding, steaming, chatter. Warm, community-focused, slice-of-life mood showing human connections and daily rhythms.',
    youtubeLink: null,
    customFields: ['Location Type', 'Time Span', 'Main Focus', 'Story Theme', 'Other']
  },
  {
    id: 'story-3',
    category: 'storytelling',
    title: 'Emotional Reunion',
    prompt: '8-second emotional airport reunion scene. Medium shot of young woman in her 20s with long brown hair and casual travel clothes, standing in bright modern airport terminal near arrival gates. Handheld camera with slight movement, transitioning to slow motion for climactic moment. Natural fluorescent airport lighting with large windows showing tarmac in background. Background shows travelers with luggage, arrival boards, busy terminal atmosphere. Action: woman checks phone nervously, looks around anxiously, suddenly lights up with pure joy, runs toward camera, arms outstretched for embrace (slow motion). Audio: soft piano melody building to emotional crescendo, ambient airport announcements, footsteps echoing. Heartwarming, genuine, uplifting mood capturing raw human emotion and connection.',
    youtubeLink: null,
    customFields: ['Location', 'Relationship Type', 'Emotion Style', 'Background Music', 'Other']
  },
  {
    id: 'tutorial-1',
    category: 'tutorial',
    title: 'Cooking Tutorial Style',
    prompt: '8-second cooking tutorial with professional overhead shot of marble kitchen counter. Skilled hands with manicured nails demonstrating knife technique chopping fresh herbs. Fixed camera positioned directly above workspace with even studio lighting eliminating shadows. Background shows organized ingredients in glass bowls, wooden cutting board, chef knife, and fresh produce artfully arranged. Action: precise knife work in steady rhythm, herbs being finely chopped, hands moving with professional confidence. Audio: rhythmic chopping sounds, subtle kitchen ambience, no music to focus on technique. Clean text overlays appear: "Pro Tip: Rock the knife" and ingredient measurements. Professional, educational, ASMR-style mood perfect for social media cooking content.',
    youtubeLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    customFields: ['Dish Name', 'Cuisine Type', 'Skill Level', 'Special Technique', 'Other']
  },
  {
    id: 'tutorial-2',
    category: 'tutorial',
    title: 'DIY Project Guide',
    prompt: '8-second DIY tutorial showing succulent terrarium assembly. Medium shot of creative workspace with hands wearing aesthetic rings assembling glass terrarium. Static camera with professional lighting setup using softbox lights eliminating harsh shadows. Background shows organized craft supplies: glass containers, succulents, decorative stones, soil, small tools on white desk. Action: hands carefully place layer of stones, add soil, gently position succulents, final decorative touches. Audio: gentle instrumental music, subtle sounds of materials - stones clinking, soil rustling. Clean text overlays: "Step 3: Add drainage layer" with timer. Satisfying, creative, accessible mood inspiring viewers to try DIY projects.',
    youtubeLink: null,
    customFields: ['Project Name', 'Materials', 'Difficulty Level', 'End Result', 'Other']
  },
  {
    id: 'tutorial-3',
    category: 'tutorial',
    title: 'Tech Tutorial',
    prompt: '8-second tech tutorial with screen recording of smartphone interface and picture-in-picture of presenter. Clean male presenter in his early 30s with glasses and casual polo shirt in modern home office setup. Fixed camera on presenter with professional ring lighting. Screen recording shows crisp mobile app interface with highlighted touch interactions and smooth transitions. Background shows contemporary desk setup with monitor, plants, minimal décor. Action: presenter gestures while explaining, finger taps on phone screen are highlighted with subtle animation circles. Audio: clear, confident voiceover with slight tech enthusiasm, subtle app notification sounds. Helpful text overlays: "Swipe left to access settings" with arrow animations. Professional, accessible, step-by-step educational mood.',
    youtubeLink: null,
    customFields: ['Software/App', 'Task/Goal', 'User Level', 'Platform', 'Other']
  },
  {
    id: 'tutorial-4',
    category: 'tutorial',
    title: 'Makeup Tutorial',
    prompt: '8-second makeup tutorial featuring close-up of beauty influencer in her mid-20s with flawless skin and half-completed makeup look. Fixed camera positioned at eye level with professional ring light creating even, shadow-free lighting. Background shows aesthetic vanity setup with organized makeup collection, brushes, and soft pink décor. Action: applies eyeshadow with precision using fluffy brush, blends seamlessly, looks directly at camera with confident smile. Audio: upbeat background music, subtle brush sounds, clear voiceover: "This shade is perfect for everyday glam - blend upward for that lifted effect!" Helpful text overlays: "Use shade #3" with product name. Aspirational, beauty-focused, tutorial mood perfect for makeup education content.',
    youtubeLink: null,
    customFields: ['Makeup Look', 'Skill Level', 'Products Used', 'Skin Tone', 'Other']
  },
  {
    id: 'vlog-1',
    category: 'vlogging',
    title: 'Professional Service Vlog',
    prompt: '8-second realistic vlogging-style video. Medium shot of a male mechanic in his early 30s standing by an open-hood car inside a well-lit auto repair shop. Friendly face with slight stubble, dark brown tousled hair, hazel eyes, medium athletic build. Navy blue coveralls with business name embroidered on chest, oil-stained hands. Static camera, medium shot framing with natural lighting from open bay doors. Background shows car lifts, toolboxes, equipment. Action: gestures toward engine, looks directly at camera with confident nod, wipes hands on shop rag. Dialogue: "Been fixing cars for fifteen years. Your engine troubles? We\'ll get you back on the road fast and affordable." Professional, trustworthy, authentic mood with natural shop ambience.',
    youtubeLink: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    customFields: ['Profession/Service', 'Business Name', 'Key Message', 'Professional Appearance', 'Other']
  },
  {
    id: 'vlog-2',
    category: 'vlogging',
    title: 'IG Influencer Hotel Vlog',
    prompt: '8-second realistic influencer-style hotel room vlog. Medium shot of stylish female influencer in her mid-20s sitting on luxury hotel bed with city skyline visible through floor-to-ceiling windows. Perfectly styled blonde hair, natural glam makeup, wearing trendy casual outfit. Handheld camera with slight movement for authentic feel. Bright natural lighting from windows with warm hotel room ambience. Action: adjusts hair, gestures toward view, looks at camera with bright smile. Dialogue: "Just checked into this incredible suite! The view is absolutely stunning - can\'t wait to explore the city!" Upbeat, aspirational, lifestyle-focused mood with soft background music. Perfect for travel and lifestyle content.',
    youtubeLink: null,
    customFields: ['Hotel Type', 'Location/City', 'Influencer Style', 'Content Focus', 'Other']
  },
  {
    id: 'vlog-3',
    category: 'vlogging',
    title: 'Tech Product Review Vlog',
    prompt: '8-second realistic tech review vlog. Close-up shot of enthusiastic male tech reviewer in his late 20s at modern desk setup with RGB lighting and multiple monitors in background. Clean-cut appearance, black-framed glasses, wearing casual tech company t-shirt. Holds latest smartphone with confident grip. Static camera with shallow depth of field focusing on reviewer and product. Professional studio lighting with warm LED strips. Action: examines phone, rotates it to show different angles, looks directly at camera with excited expression. Dialogue: "This new flagship just dropped and I\'ve been testing it for a week. The camera quality is absolutely game-changing!" Energetic, informative, authentic tech enthusiast mood with subtle electronic background music.',
    youtubeLink: null,
    customFields: ['Product Category', 'Review Focus', 'Reviewer Style', 'Key Features', 'Other']
  },
  {
    id: 'street-1',
    category: 'street-interview',
    title: 'Nighttime City Interview',
    prompt: 'A nighttime man-on-the-street interview scene outside a trendy, bustling city restaurant. Documentary realism with handheld cinema verité style. Young male interviewer in casual streetwear holds wireless microphone, chatting with three stylish young women dressed for night out. Handheld camera with slight movement, shallow depth of field on expressions. Nighttime urban lighting with amber and magenta restaurant glow, wet pavement reflections, neon signage. Background shows pedestrians, passing cars with headlight streaks, diners through windows. Dialogue: "Veo 3. Worth it or not?" - "Yeah!" - "For sure!" - "Yeah, all of this feels so real... even though it isn\'t!" Lively, unscripted, authentic mood with vibrant urban realism.',
    youtubeLink: null,
    customFields: ['Interview Question/Dialogue', 'Time of Day', 'Location Type', 'Target Demographic', 'Other']
  }
];

// Categories
var categories = [
  { id: '1', name: 'ads', icon: '📺', description: 'Commercial and advertising prompts', color: '#FF6B6B' },
  { id: '2', name: 'storytelling', icon: '📖', description: 'Narrative and story-driven content', color: '#4ECDC4' },
  { id: '3', name: 'tutorial', icon: '🎓', description: 'Educational and how-to content', color: '#45B7D1' },
  { id: '4', name: 'vlogging', icon: '📹', description: 'Personal vlog and lifestyle content', color: '#96CEB4' },
  { id: '5', name: 'street-interview', icon: '🎤', description: 'Street interviews and public reactions', color: '#9B59B6' },
  { id: '6', name: 'my-prompts', icon: '⭐', description: 'Your saved and custom prompts', color: '#FECA57' }
];

var currentView = 'categories';
var currentCategory = null;
var savedPrompts = [];
var showSettings = false;
var isCustomizing = false;
var currentPromptForCustomization = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');
  loadSavedPrompts();
  renderApp();
});

function loadSavedPrompts() {
  chrome.storage.local.get(['savedPrompts'], function(result) {
    savedPrompts = result.savedPrompts || [];
  });
}

function renderApp() {
  var app = document.getElementById('root');
  if (!app) {
    console.error('Root element not found');
    return;
  }
  
  app.innerHTML = '';
  
  // Header
  var header = document.createElement('header');
  header.className = 'header';
  
  var headerContent = document.createElement('div');
  headerContent.className = 'header-content';
  
  var title = document.createElement('h1');
  title.className = 'header-title';
  title.textContent = 'Veo 3 Prompt Assistant';
  
  var settingsBtn = document.createElement('button');
  settingsBtn.className = 'icon-button';
  settingsBtn.title = 'Settings';
  settingsBtn.textContent = '⚙️';
  settingsBtn.addEventListener('click', toggleSettings);
  
  headerContent.appendChild(title);
  headerContent.appendChild(settingsBtn);
  header.appendChild(headerContent);
  app.appendChild(header);

  // Settings modal
  if (showSettings) {
    renderSettings(app);
  }

  // Customization modal
  if (isCustomizing && currentPromptForCustomization) {
    renderCustomizationModal(app);
  }

  // Main content
  var main = document.createElement('main');
  main.className = 'app-content';
  
  if (currentView === 'categories') {
    main.appendChild(renderCategories());
  } else if (currentView === 'prompts') {
    main.appendChild(renderPrompts());
  }
  
  app.appendChild(main);
}

function renderCategories() {
  var container = document.createElement('div');
  container.className = 'category-grid';
  
  for (var i = 0; i < categories.length; i++) {
    var category = categories[i];
    var card = document.createElement('div');
    card.className = 'category-card';
    card.style.borderColor = category.color;
    card.addEventListener('click', (function(categoryName) {
      return function() { selectCategory(categoryName); };
    })(category.name));
    
    var iconDiv = document.createElement('div');
    iconDiv.className = 'category-icon';
    iconDiv.style.backgroundColor = category.color + '20';
    iconDiv.textContent = category.icon;
    
    var nameH3 = document.createElement('h3');
    nameH3.className = 'category-name';
    nameH3.textContent = category.name.charAt(0).toUpperCase() + category.name.slice(1).replace('-', ' ');
    
    var descP = document.createElement('p');
    descP.className = 'category-description';
    descP.textContent = category.description;
    
    var countSpan = document.createElement('span');
    countSpan.className = 'category-count';
    countSpan.textContent = 'View templates';
    
    card.appendChild(iconDiv);
    card.appendChild(nameH3);
    card.appendChild(descP);
    card.appendChild(countSpan);
    
    container.appendChild(card);
  }
  
  return container;
}

function renderPrompts() {
  var container = document.createElement('div');
  container.className = 'prompt-list';
  
  // Header
  var header = document.createElement('div');
  header.className = 'prompt-list-header';
  
  var backBtn = document.createElement('button');
  backBtn.className = 'back-button';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', goBack);
  
  var categoryTitle = document.createElement('h2');
  categoryTitle.className = 'category-title';
  categoryTitle.textContent = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1).replace('-', ' ');
  
  header.appendChild(backBtn);
  header.appendChild(categoryTitle);
  container.appendChild(header);
  
  // Prompts
  var promptsContainer = document.createElement('div');
  promptsContainer.className = 'prompts-grid';
  
  var prompts = currentCategory === 'my-prompts' ? savedPrompts : 
    promptsData.filter(function(p) { return p.category === currentCategory; });
  
  if (prompts.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'empty-state';
    var emptyText = document.createElement('p');
    emptyText.textContent = currentCategory === 'my-prompts' ? 
      'No saved prompts yet. Browse categories and customize templates!' :
      'No prompts available for this category.';
    empty.appendChild(emptyText);
    promptsContainer.appendChild(empty);
  } else {
    for (var i = 0; i < prompts.length; i++) {
      promptsContainer.appendChild(createPromptCard(prompts[i]));
    }
  }
  
  container.appendChild(promptsContainer);
  return container;
}

function createPromptCard(prompt) {
  var card = document.createElement('div');
  card.className = 'prompt-card';
  
  var header = document.createElement('div');
  header.className = 'prompt-header';
  header.addEventListener('click', (function(promptId) {
    return function() { togglePrompt(promptId); };
  })(prompt.id));
  
  var title = document.createElement('h3');
  title.className = 'prompt-title';
  title.textContent = prompt.title;
  
  var templateLabel = document.createElement('span');
  templateLabel.className = 'template-label';
  templateLabel.textContent = prompt.isCustom ? 'Custom' : 'Template';
  
  var icon = document.createElement('span');
  icon.className = 'expand-icon';
  icon.id = 'icon-' + prompt.id;
  icon.textContent = '▶';
  
  header.appendChild(title);
  header.appendChild(templateLabel);
  header.appendChild(icon);
  
  var content = document.createElement('div');
  content.className = 'prompt-content';
  content.id = 'content-' + prompt.id;
  content.style.display = 'none';
  
  var text = document.createElement('p');
  text.className = 'prompt-text';
  text.textContent = prompt.prompt;
  
  var actions = document.createElement('div');
  actions.className = 'prompt-actions';
  
  // Copy button
  var copyBtn = document.createElement('button');
  copyBtn.className = 'action-button';
  copyBtn.textContent = '📋 Copy';
  copyBtn.addEventListener('click', (function(promptId) {
    return function() { copyPrompt(promptId); };
  })(prompt.id));
  actions.appendChild(copyBtn);
  
  // Customize button (only for templates, not custom prompts)
  if (!prompt.isCustom) {
    var customizeBtn = document.createElement('button');
    customizeBtn.className = 'action-button primary';
    customizeBtn.textContent = '✨ Customize';
    customizeBtn.addEventListener('click', (function(promptId) {
      return function() { startCustomization(promptId); };
    })(prompt.id));
    actions.appendChild(customizeBtn);
  }
  
  // Preview button
  if (prompt.youtubeLink) {
    var previewBtn = document.createElement('button');
    previewBtn.className = 'action-button';
    previewBtn.textContent = '▶️ Preview';
    previewBtn.addEventListener('click', (function(link) {
      return function() { previewPrompt(link); };
    })(prompt.youtubeLink));
    actions.appendChild(previewBtn);
  }
  
  // Save button (only for templates in browse mode)
  if (currentCategory !== 'my-prompts' && !prompt.isCustom) {
    var saveBtn = document.createElement('button');
    saveBtn.className = 'action-button';
    saveBtn.textContent = '⭐ Save Template';
    saveBtn.addEventListener('click', (function(promptId) {
      return function() { savePrompt(promptId); };
    })(prompt.id));
    actions.appendChild(saveBtn);
  }
  
  // Generate Video button
  var generateBtn = document.createElement('button');
  generateBtn.className = 'action-button primary';
  generateBtn.textContent = '🎬 Generate Video';
  generateBtn.addEventListener('click', (function(promptId) {
    return function() { startVideoGeneration(promptId); };
  })(prompt.id));
  actions.appendChild(generateBtn);
  
  content.appendChild(text);
  content.appendChild(actions);
  
  card.appendChild(header);
  card.appendChild(content);
  
  return card;
}

function renderCustomizationModal(app) {
  var overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  
  var modal = document.createElement('div');
  modal.className = 'customization-modal';
  modal.style.width = '450px';
  modal.style.maxHeight = '90vh';
  
  // Header
  var header = document.createElement('div');
  header.className = 'settings-header';
  
  var title = document.createElement('h2');
  title.textContent = 'Customize: ' + currentPromptForCustomization.title;
  
  var closeBtn = document.createElement('button');
  closeBtn.className = 'close-button';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', cancelCustomization);
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Content
  var content = document.createElement('div');
  content.className = 'settings-content';
  
  var instructions = document.createElement('p');
  instructions.style.marginBottom = '20px';
  instructions.style.color = 'var(--text-secondary)';
  instructions.textContent = 'Fill in your details below and AI will customize the template for you:';
  content.appendChild(instructions);
  
  // Custom fields form
  var form = document.createElement('div');
  form.className = 'custom-fields-form';
  
  for (var i = 0; i < currentPromptForCustomization.customFields.length; i++) {
    var field = currentPromptForCustomization.customFields[i];
    
    var fieldGroup = document.createElement('div');
    fieldGroup.className = 'field-group';
    
    var label = document.createElement('label');
    label.textContent = field + ':';
    label.style.display = 'block';
    label.style.marginBottom = '5px';
    label.style.fontWeight = '500';
    
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'custom-field-input';
    input.placeholder = 'Enter ' + field.toLowerCase();
    input.dataset.field = field;
    
    fieldGroup.appendChild(label);
    fieldGroup.appendChild(input);
    form.appendChild(fieldGroup);
  }
  
  content.appendChild(form);
  
  // Footer
  var footer = document.createElement('div');
  footer.className = 'settings-footer';
  
  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', cancelCustomization);
  
  var customizeBtn = document.createElement('button');
  customizeBtn.className = 'primary';
  customizeBtn.textContent = '✨ Generate Custom Prompt';
  customizeBtn.addEventListener('click', generateCustomPrompt);
  
  footer.appendChild(cancelBtn);
  footer.appendChild(customizeBtn);
  
  modal.appendChild(header);
  modal.appendChild(content);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  app.appendChild(overlay);
}

function startCustomization(promptId) {
  var prompts = promptsData.filter(function(p) { return p.category === currentCategory; });
  for (var i = 0; i < prompts.length; i++) {
    if (prompts[i].id === promptId) {
      currentPromptForCustomization = prompts[i];
      isCustomizing = true;
      renderApp();
      break;
    }
  }
}

function cancelCustomization() {
  isCustomizing = false;
  currentPromptForCustomization = null;
  renderApp();
}

function generateCustomPrompt() {
  var inputs = document.querySelectorAll('.custom-field-input');
  var customData = {};
  var hasData = false;
  
  for (var i = 0; i < inputs.length; i++) {
    var input = inputs[i];
    if (input.value.trim()) {
      customData[input.dataset.field] = input.value.trim();
      hasData = true;
    }
  }
  
  if (!hasData) {
    showToast('Please fill in at least one field');
    return;
  }
  
  // Show loading state
  var generateBtn = document.querySelector('.primary');
  generateBtn.textContent = '🤖 Generating...';
  generateBtn.disabled = true;
  
  // Call GPT API
  callGPTAPI(currentPromptForCustomization.prompt, customData)
    .then(function(customizedPrompt) {
      // Create and save the customized prompt
      var newPrompt = {
        id: 'custom-' + Date.now(),
        category: 'my-prompts',
        title: currentPromptForCustomization.title + ' (Customized)',
        prompt: customizedPrompt,
        youtubeLink: currentPromptForCustomization.youtubeLink,
        isCustom: true,
        dateAdded: new Date().toISOString(),
        originalTemplate: currentPromptForCustomization.title,
        customData: customData
      };
      
      savedPrompts.push(newPrompt);
      chrome.storage.local.set({ savedPrompts: savedPrompts }, function() {
        showToast('Custom prompt created and saved!');
        cancelCustomization();
      });
    })
    .catch(function(error) {
      console.error('GPT API Error:', error);
      showToast('Error: ' + error.message);
      generateBtn.textContent = '✨ Generate Custom Prompt';
      generateBtn.disabled = false;
    });
}

function callGPTAPI(template, customData) {
  return new Promise(function(resolve, reject) {
    chrome.storage.local.get(['gptApiKey'], function(result) {
      if (!result.gptApiKey) {
        reject(new Error('Please add your OpenAI API key in settings'));
        return;
      }
      
      var customDetails = Object.keys(customData).map(function(key) {
        return key + ': ' + customData[key];
      }).join('\n');
      
      var systemPrompt = 'You are a video creation prompt assistant. Take the template prompt and customize it with the user details provided. Keep the same structure and style, but incorporate the specific details naturally. Return only the customized prompt, no explanations.';
      
      var userPrompt = 'Template: ' + template + '\n\nCustomize with these details:\n' + customDetails;
      
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + result.gptApiKey
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      })
      .then(function(response) {
        if (!response.ok) {
          return response.json().then(function(error) {
            throw new Error(error.error?.message || 'API call failed');
          });
        }
        return response.json();
      })
      .then(function(data) {
        resolve(data.choices[0].message.content.trim());
      })
      .catch(function(error) {
        reject(error);
      });
    });
  });
}

function renderSettings(app) {
  var overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  overlay.addEventListener('click', function(e) { 
    if (e.target === overlay) toggleSettings(); 
  });
  
  var modal = document.createElement('div');
  modal.className = 'settings-modal';
  
  // Settings header
  var settingsHeader = document.createElement('div');
  settingsHeader.className = 'settings-header';
  
  var settingsTitle = document.createElement('h2');
  settingsTitle.textContent = 'Settings';
  
  var closeBtn = document.createElement('button');
  closeBtn.className = 'close-button';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', toggleSettings);
  
  settingsHeader.appendChild(settingsTitle);
  settingsHeader.appendChild(closeBtn);
  
  // Settings content
  var settingsContent = document.createElement('div');
  settingsContent.className = 'settings-content';
  
  // OpenAI API Key
  var openAIGroup = document.createElement('div');
  openAIGroup.className = 'setting-group';
  
  var openAILabel = document.createElement('label');
  openAILabel.setAttribute('for', 'api-key');
  openAILabel.textContent = 'OpenAI API Key (Required for Customization)';
  
  var openAIInputGroup = document.createElement('div');
  openAIInputGroup.className = 'api-key-input-group';
  
  var openAIInput = document.createElement('input');
  openAIInput.id = 'api-key';
  openAIInput.type = 'password';
  openAIInput.placeholder = 'sk-...';
  openAIInput.className = 'api-key-input';
  
  var openAIToggleBtn = document.createElement('button');
  openAIToggleBtn.className = 'toggle-visibility';
  openAIToggleBtn.textContent = '👁️';
  openAIToggleBtn.addEventListener('click', function() { toggleApiKeyVisibility('api-key'); });
  
  openAIInputGroup.appendChild(openAIInput);
  openAIInputGroup.appendChild(openAIToggleBtn);
  
  var openAIHelpText = document.createElement('p');
  openAIHelpText.className = 'setting-help';
  openAIHelpText.innerHTML = 'Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Dashboard</a><br><small>Used to customize prompt templates with your specific details</small>';
  
  openAIGroup.appendChild(openAILabel);
  openAIGroup.appendChild(openAIInputGroup);
  openAIGroup.appendChild(openAIHelpText);
  settingsContent.appendChild(openAIGroup);
  
  // Google GenAI API Key
  var genAIGroup = document.createElement('div');
  genAIGroup.className = 'setting-group';
  
  var genAILabel = document.createElement('label');
  genAILabel.setAttribute('for', 'genai-key');
  genAILabel.textContent = 'Gemini API Key (Required for Video Generation)';
  
  var genAIInputGroup = document.createElement('div');
  genAIInputGroup.className = 'api-key-input-group';
  
  var genAIInput = document.createElement('input');
  genAIInput.id = 'genai-key';
  genAIInput.type = 'password';
  genAIInput.placeholder = 'AIza...';
  genAIInput.className = 'api-key-input';
  
  var genAIToggleBtn = document.createElement('button');
  genAIToggleBtn.className = 'toggle-visibility';
  genAIToggleBtn.textContent = '👁️';
  genAIToggleBtn.addEventListener('click', function() { toggleApiKeyVisibility('genai-key'); });
  
  genAIInputGroup.appendChild(genAIInput);
  genAIInputGroup.appendChild(genAIToggleBtn);
  
  var genAIHelpText = document.createElement('p');
  genAIHelpText.className = 'setting-help';
  genAIHelpText.innerHTML = 'Get your Gemini API key from <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a><br><small>Note: Veo 2 requires @google/genai SDK - use Node.js script for generation</small>';
  
  genAIGroup.appendChild(genAILabel);
  genAIGroup.appendChild(genAIInputGroup);
  genAIGroup.appendChild(genAIHelpText);
  settingsContent.appendChild(genAIGroup);
  
  // Settings footer
  var settingsFooter = document.createElement('div');
  settingsFooter.className = 'settings-footer';
  
  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', toggleSettings);
  
  var saveBtn = document.createElement('button');
  saveBtn.className = 'primary';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', saveSettings);
  
  settingsFooter.appendChild(cancelBtn);
  settingsFooter.appendChild(saveBtn);
  
  modal.appendChild(settingsHeader);
  modal.appendChild(settingsContent);
  modal.appendChild(settingsFooter);
  overlay.appendChild(modal);
  app.appendChild(overlay);
  
  // Load existing API keys
  chrome.storage.local.get(['gptApiKey', 'genAIApiKey'], function(result) {
    if (result.gptApiKey) {
      openAIInput.value = result.gptApiKey;
    }
    if (result.genAIApiKey) {
      genAIInput.value = result.genAIApiKey;
    }
  });
}

// Event handlers
function selectCategory(categoryName) {
  currentCategory = categoryName;
  currentView = 'prompts';
  renderApp();
}

function goBack() {
  currentView = 'categories';
  currentCategory = null;
  renderApp();
}

function togglePrompt(promptId) {
  var content = document.getElementById('content-' + promptId);
  var icon = document.getElementById('icon-' + promptId);
  
  if (content && icon) {
    if (content.style.display === 'none') {
      content.style.display = 'block';
      icon.textContent = '▼';
    } else {
      content.style.display = 'none';
      icon.textContent = '▶';
    }
  }
}

function copyPrompt(promptId) {
  var prompts = currentCategory === 'my-prompts' ? savedPrompts : 
    promptsData.filter(function(p) { return p.category === currentCategory; });
  
  for (var i = 0; i < prompts.length; i++) {
    if (prompts[i].id === promptId) {
      var prompt = prompts[i];
      navigator.clipboard.writeText(prompt.prompt).then(function() {
        showToast('Prompt copied to clipboard!');
      });
      break;
    }
  }
}

function previewPrompt(youtubeLink) {
  window.open(youtubeLink, '_blank');
}

function savePrompt(promptId) {
  var prompts = promptsData.filter(function(p) { return p.category === currentCategory; });
  
  for (var i = 0; i < prompts.length; i++) {
    if (prompts[i].id === promptId) {
      var prompt = prompts[i];
      var newPrompt = {
        id: 'saved-' + Date.now(),
        category: 'my-prompts',
        title: prompt.title + ' (Template)',
        prompt: prompt.prompt,
        youtubeLink: prompt.youtubeLink,
        isCustom: false,
        dateAdded: new Date().toISOString()
      };
      
      savedPrompts.push(newPrompt);
      chrome.storage.local.set({ savedPrompts: savedPrompts }, function() {
        showToast('Template saved to My Prompts!');
      });
      break;
    }
  }
}

function toggleSettings() {
  showSettings = !showSettings;
  renderApp();
}

function toggleApiKeyVisibility(inputId) {
  var input = document.getElementById(inputId);
  var button = input.nextElementSibling;
  
  if (input && button) {
    if (input.type === 'password') {
      input.type = 'text';
      button.textContent = '🙈';
    } else {
      input.type = 'password';
      button.textContent = '👁️';
    }
  }
}

function saveSettings() {
  var openAIKey = document.getElementById('api-key').value;
  var genAIKey = document.getElementById('genai-key').value;
  
  var settings = {};
  if (openAIKey) settings.gptApiKey = openAIKey;
  if (genAIKey) settings.genAIApiKey = genAIKey;
  
  if (Object.keys(settings).length > 0) {
    chrome.storage.local.set(settings, function() {
      showToast('Settings saved!');
      toggleSettings();
    });
  } else {
    showToast('Please enter at least one API key');
  }
}

function showToast(message) {
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(function() {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 3000);
}

function startVideoGeneration(promptId) {
  var prompts = currentCategory === 'my-prompts' ? savedPrompts : 
    promptsData.filter(function(p) { return p.category === currentCategory; });
  
  var prompt = null;
  for (var i = 0; i < prompts.length; i++) {
    if (prompts[i].id === promptId) {
      prompt = prompts[i];
      break;
    }
  }
  
  if (!prompt) return;
  
  chrome.storage.local.get(['genAIApiKey'], function(result) {
    if (!result.genAIApiKey) {
      showToast('Please add your Google GenAI API key in settings');
      return;
    }
    
    // Show video generation modal
    showVideoGenerationModal(prompt, result.genAIApiKey);
  });
}

function showVideoGenerationModal(prompt, apiKey) {
  var overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  
  var modal = document.createElement('div');
  modal.className = 'settings-modal';
  modal.style.width = '500px';
  
  // Header
  var header = document.createElement('div');
  header.className = 'settings-header';
  
  var title = document.createElement('h2');
  title.textContent = '🎬 Generate Video with Veo 2';
  
  var closeBtn = document.createElement('button');
  closeBtn.className = 'close-button';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Content
  var content = document.createElement('div');
  content.className = 'settings-content';
  
  var promptInfo = document.createElement('div');
  promptInfo.style.marginBottom = '20px';
  promptInfo.innerHTML = '<strong>Prompt:</strong><br>' + prompt.prompt.substring(0, 200) + '...';
  
  // Status display
  var statusDiv = document.createElement('div');
  statusDiv.id = 'generation-status';
  statusDiv.style.marginTop = '20px';
  statusDiv.style.padding = '15px';
  statusDiv.style.backgroundColor = 'var(--surface)';
  statusDiv.style.borderRadius = 'var(--radius-md)';
  statusDiv.style.display = 'none';
  statusDiv.innerHTML = '<h4>Generation Status</h4><p id="status-text">Initializing...</p>';
  
  content.appendChild(promptInfo);
  content.appendChild(statusDiv);
  
  // Footer
  var footer = document.createElement('div');
  footer.className = 'settings-footer';
  
  var generateBtn = document.createElement('button');
  generateBtn.className = 'primary';
  generateBtn.id = 'generate-btn';
  generateBtn.textContent = '🎬 Generate Video';
  generateBtn.addEventListener('click', function() {
    generateVeo3Video(prompt.prompt, apiKey);
  });
  
  footer.appendChild(generateBtn);
  
  modal.appendChild(header);
  modal.appendChild(content);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

async function generateVeo3Video(promptText, apiKey) {
  var statusDiv = document.getElementById('generation-status');
  var statusText = document.getElementById('status-text');
  var generateBtn = document.getElementById('generate-btn');
  
  // Disable button and show status
  generateBtn.disabled = true;
  generateBtn.textContent = '⏳ Generating...';
  statusDiv.style.display = 'block';
  
  try {
    statusText.textContent = 'Note: Veo 2 is currently in limited preview...';
    
    // Show instructions for using the Node.js script instead
    setTimeout(function() {
      statusText.innerHTML = '<strong>Veo 2 Video Generation</strong><br><br>' +
        'Due to browser restrictions, please use one of these methods:<br><br>' +
        '<strong>Option 1: Node.js Script (Recommended)</strong><br>' +
        '1. Create a new folder for your project<br>' +
        '2. Run: <code>npm install @google/genai</code><br>' +
        '3. Copy the script below and save as <code>generate.js</code><br>' +
        '4. Run: <code>node generate.js</code><br><br>' +
        '<button class="action-button primary" id="show-script-btn">📋 Show Generation Script</button><br><br>' +
        '<strong>Option 2: Use Google AI Studio</strong><br>' +
        'Visit <a href="https://aistudio.google.com" target="_blank">Google AI Studio</a> for web-based generation';
      
      var scriptBtn = document.getElementById('show-script-btn');
      if (scriptBtn) {
        scriptBtn.addEventListener('click', function() {
          showPythonScript(promptText, apiKey);
        });
      }
    }, 1000);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = '🎬 Generate Video';
  }
}

function showPythonScript(promptText, apiKey) {
  var scriptContent = `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "${apiKey}" });

const prompt = \`${promptText.replace(/`/g, '\\`')}\`;

async function generateVideo() {
  console.log("Starting video generation with Veo 2...");
  
  // Start the video generation job
  let operation = await ai.models.generateVideos({
    model: "veo-2.0-generate-001",
    prompt: prompt,
  });
  
  console.log("Operation started:", operation.name);
  
  // Poll the operation status until done
  // Check every 10 seconds as per documentation
  while (!operation.done) {
    console.log("Waiting for video generation to complete...");
    await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds
    
    // Refresh the operation object to get latest status
    operation = await ai.operations.getVideosOperation({ 
      operation: operation 
    });
  }
  
  console.log("Video generation complete!");
  
  // Download the generated video
  if (operation.response && operation.response.generatedVideos) {
    await ai.files.download({
      file: operation.response.generatedVideos[0].video,
      downloadPath: "veo2_generated_video.mp4",
    });
    
    console.log("Generated video saved to veo2_generated_video.mp4");
  } else {
    console.error("No video found in response");
  }
}

generateVideo().catch(console.error);`;

  // Create modal to show script
  var overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  overlay.style.zIndex = '1002';
  
  var modal = document.createElement('div');
  modal.className = 'settings-modal';
  modal.style.width = '600px';
  
  var header = document.createElement('div');
  header.className = 'settings-header';
  
  var title = document.createElement('h2');
  title.textContent = 'Veo 2 JavaScript Script';
  
  var closeBtn = document.createElement('button');
  closeBtn.className = 'close-button';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  var content = document.createElement('div');
  content.className = 'settings-content';
  
  var instructions = document.createElement('p');
  instructions.innerHTML = '<strong>To use this script:</strong><br>' +
    '1. Create a new Node.js project<br>' +
    '2. Run: <code>npm install @google/genai</code><br>' +
    '3. Save the script as <code>generate.js</code><br>' +
    '4. Run: <code>node generate.js</code>';
  
  var pre = document.createElement('pre');
  pre.style.backgroundColor = '#f5f5f5';
  pre.style.padding = '15px';
  pre.style.borderRadius = '4px';
  pre.style.overflow = 'auto';
  pre.style.maxHeight = '300px';
  pre.textContent = scriptContent;
  
  content.appendChild(instructions);
  content.appendChild(pre);
  
  var footer = document.createElement('div');
  footer.className = 'settings-footer';
  
  var copyBtn = document.createElement('button');
  copyBtn.className = 'primary';
  copyBtn.textContent = '📋 Copy Script';
  copyBtn.addEventListener('click', function() {
    navigator.clipboard.writeText(scriptContent).then(function() {
      showToast('Script copied!');
    });
  });
  
  footer.appendChild(copyBtn);
  
  modal.appendChild(header);
  modal.appendChild(content);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}