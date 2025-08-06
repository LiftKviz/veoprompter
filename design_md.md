# Design Document - Veo 3 Prompt Assistant MVP
## Epic 1: Core Prompt Management

### Design Philosophy
- **Minimalist Interface**: Clean, uncluttered design focusing on prompt discovery and usage
- **Quick Access**: Maximum 2 clicks to copy any prompt
- **Visual Hierarchy**: Clear categorization with visual previews
- **Consistent Branding**: Professional look that complements Veo 3's interface
- **Cohesive Color System**: Systematic color usage with semantic meaning

---

## 🎨 Color System Design

### Brand Colors
- **Primary Brand**: `#8A42FF` (Purple) - Main brand color for CTAs, focus states
- **Secondary Brand**: `#D320B8` (Pink) - Accent color for highlights, gradients
- **Tertiary Brand**: `#6366F1` (Indigo) - Supporting brand color

### Category Color Palette
**Unified color family for visual consistency:**
- **Purple** `#8B5CF6` - Primary categories (Storytelling, Tech)
- **Indigo** `#6366F1` - Secondary categories (Street Interview)
- **Blue** `#3B82F6` - Tertiary categories (Ads) 
- **Teal** `#14B8A6` - Special categories
- **Green** `#10B981` - User content (My Prompts, Tutorial)
- **Amber** `#F59E0B` - Creative content (Vlogging, Mobile Game)

### Semantic Colors
**Only for system feedback - never mixed with categories:**
- **Success**: `#10B981` - Confirmations, completed states
- **Error**: `#EF4444` - Errors, destructive actions
- **Warning**: `#F59E0B` - Cautions, pending states
- **Info**: `#3B82F6` - Information, neutral notifications

### Neutral Scale
**Consistent grays for text, borders, backgrounds:**
- **Text Primary**: `#111827` - Main headings
- **Text Secondary**: `#6B7280` - Body text
- **Text Muted**: `#9CA3AF` - Supporting text
- **Border Light**: `#E5E7EB` - Subtle borders
- **Background**: `#F9FAFF` - Main app background

### Color Usage Rules
1. **Brand colors** (`--brand-*`) for buttons, links, brand elements only
2. **Category colors** (`--category-*`) for category identification only  
3. **Semantic colors** (`--status-*`) for system states only
4. **Neutral colors** (`--neutral-*`, `--text-*`, `--border-*`) for text, borders, backgrounds
5. **No mixing** of semantic and category colors
6. **Consistent naming** - all variables follow the new naming convention

### Implementation Status
✅ **Cohesive color palette** - 6 category colors from same family
✅ **Semantic separation** - status colors only for system feedback
✅ **Consistent naming** - all variables follow new convention
✅ **Premium feel** - unified visual hierarchy
✅ **Professional header** - Enhanced spacing, gradients, proper sizing
✅ **Premium search field** - Focus states, better contrast, professional styling
✅ **Enhanced action buttons** - Proper shadows, hover effects, premium gradients
✅ **Improved notification badges** - Brand colors instead of jarring red
✅ **Better spacing system** - Consistent padding and margins throughout
✅ **Visual hierarchy** - Clear separation between sections with subtle gradients

### Visual Improvements Made

#### Header Section
- **Increased padding**: `20px` for better breathing room
- **Subtle gradient background**: Linear gradient for depth
- **Enhanced logo**: Larger `32px` with better shadow
- **Professional tier badge**: Improved padding, colors, and typography
- **Button styling**: Card-like buttons with shadows and hover effects

#### Search Field
- **Larger size**: `44px` height for better touch targets
- **Focus states**: Brand color borders with subtle shadows
- **Better typography**: Improved font sizes and contrast
- **Professional styling**: White background with subtle borders

#### Action Buttons
- **Premium gradients**: Brand gradient with enhanced hover effects
- **Better spacing**: Increased padding and consistent sizing
- **Professional shadows**: Branded shadows that enhance on hover
- **Improved notifications**: Brand-colored badges instead of jarring red

#### Overall Polish
- **Consistent spacing**: `20px` base padding system
- **Subtle backgrounds**: Gradient overlays for visual depth
- **Enhanced shadows**: Multi-layer shadows for premium feel
- **Better contrast**: Improved text and border contrasts throughout

---

## User Interface Design

### 1. Extension Popup (400x600px)

#### Header Section (60px height)
```
┌─────────────────────────────────────┐
│ [🎬] Veo 3 Prompt Assistant    [⚙️] │
│ ─────────────────────────────────── │
└─────────────────────────────────────┘
```

#### Navigation Tabs (40px height)
```
┌─────────────────────────────────────┐
│ [📚 Browse] [💾 My Library] [🔍]    │
└─────────────────────────────────────┘
```

#### Main Content Area (500px height)
- **Browse Tab**: Category grid + prompt list
- **My Library Tab**: Saved prompts with search/filter
- **Search**: Global search across all prompts

### 2. Browse Tab Layout

#### Category Grid (8 categories, 2x4 grid)
```
┌──────────────┬──────────────┐
│   📺 Ads     │ 📖 Story     │
│   (25 prompts)│ (30 prompts) │
├──────────────┼──────────────┤
│ 🎓 Tutorial  │ 🎤 Vlogging  │
│ (22 prompts) │ (28 prompts) │
├──────────────┼──────────────┤
│ 👤 Portrait  │ 😴 ASMR      │
│ (20 prompts) │ (26 prompts) │
├──────────────┼──────────────┤
│ 🎤 Interviews│ 🎭 Skits     │
│ (24 prompts) │ (27 prompts) │
└──────────────┴──────────────┘
```

#### Category Detail View
When category is selected:
```
┌─────────────────────────────────────┐
│ ← Back to Categories | 📺 Ads (25)  │
│ ─────────────────────────────────── │
│ 🎬 Preview Video                    │
│ [YouTube Embed - 300x169px]         │
│                                     │
│ 📝 Prompt Templates:                │
│ ┌─────────────────────────────────┐ │
│ │ "Product showcase ad..."    [📋]│ │
│ │ ⭐⭐⭐⭐⭐ (124 uses)            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ "Lifestyle brand video..."  [📋]│ │
│ │ ⭐⭐⭐⭐⭐ (89 uses)             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 3. Prompt Card Design
```
┌─────────────────────────────────────┐
│ "Create a 30-second product         │
│  showcase video featuring..."       │
│                                     │
│ 🏷️ Tags: product, commercial, 30s   │
│ ⭐⭐⭐⭐⭐ (124 uses) 💾Save   📋Copy│
│                                     │
│ 📊 Success Rate: 87%                │
└─────────────────────────────────────┘
```

### 4. My Library Tab
```
┌─────────────────────────────────────┐
│ 🔍 Search my prompts...              │
│ ─────────────────────────────────── │
│ 🏷️ Filter: [All] [Ads] [Story]...   │
│ 📅 Sort: [Recent] [Rating] [Usage]   │
│ ─────────────────────────────────── │
│                                     │
│ My Saved Prompts (12):              │
│ ┌─────────────────────────────────┐ │
│ │ "Product demo video..."    [📋] │ │
│ │ Used 5 times | Added 2 days ago │ │
│ │ 🏷️ ads, product, demo      [🗑️]│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Visual Design System

### Color Palette
- **Primary**: #4285F4 (Google Blue)
- **Secondary**: #34A853 (Google Green)
- **Accent**: #FBBC04 (Google Yellow)
- **Error**: #EA4335 (Google Red)
- **Background**: #FFFFFF / #202124 (Light/Dark)
- **Text**: #3C4043 / #E8EAED (Light/Dark)
- **Border**: #DADCE0 / #5F6368 (Light/Dark)

### Typography
- **Primary Font**: Roboto (matches Google ecosystem)
- **Headers**: Roboto Medium, 16px
- **Body**: Roboto Regular, 14px
- **Caption**: Roboto Regular, 12px
- **Monospace**: Roboto Mono (for prompts)

### Icons
- **Source**: Material Design Icons
- **Size**: 20px for navigation, 16px for actions
- **Style**: Outlined for inactive, filled for active states

### Animations
- **Transitions**: 200ms ease-in-out for state changes
- **Loading**: Skeleton screens for content loading
- **Feedback**: 100ms micro-interactions for button presses
- **Copy Success**: 2-second toast notification with checkmark

---

## Responsive Design

### Popup Sizes
- **Default**: 400x600px
- **Minimum**: 350x500px
- **Maximum**: 500x800px (if user resizes)

### Content Adaptation
- Category grid collapses to 1 column below 350px width
- Prompt cards stack vertically on narrow screens
- YouTube embeds maintain 16:9 aspect ratio

---

## Dark Mode Support

### Auto-Detection
- Follow Chrome's system preference
- Manual toggle in settings (future enhancement)

### Color Adjustments
- Background: #202124
- Cards: #303134
- Text: #E8EAED
- Borders: #5F6368

---

## Accessibility

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 minimum ratio
- **Keyboard Navigation**: Tab through all interactive elements
- **Screen Readers**: Proper ARIA labels and roles
- **Focus Indicators**: Visible focus states

### Keyboard Shortcuts
- `Enter`: Copy focused prompt
- `Ctrl+S`: Save focused prompt
- `Escape`: Close popup/go back
- `Ctrl+F`: Focus search bar

---

## Performance Considerations

### Load Time Optimization
- Lazy load YouTube embeds
- Cache category data locally
- Minimize DOM manipulation
- Use CSS transforms for animations

### Memory Management
- Limit concurrent YouTube embeds to 1
- Clean up event listeners on tab switches
- Efficient data structures for prompt storage

---

## Error States & Edge Cases

### Empty States
- **No saved prompts**: Encouraging illustration with CTA
- **Search no results**: "Try different keywords" with suggestions
- **Category loading**: Skeleton placeholder cards

### Error Handling
- **Copy failure**: Fallback to text selection
- **YouTube embed fail**: Show thumbnail with "Video unavailable"
- **Network issues**: Cached content with sync indicator

### Loading States
- **Initial load**: Progressive category loading
- **Search**: Debounced with loading spinner
- **Copy action**: Button state change with confirmation

---

## Data Display Patterns

### Prompt Categories
```javascript
{
  id: 'ads',
  name: 'Ads',
  icon: '📺',
  description: 'Commercial and promotional videos',
  previewVideo: 'dQw4w9WgXcQ', // YouTube ID
  promptCount: 25,
  color: '#FF6B6B'
}
```

### Prompt Template
```javascript
{
  id: 'prompt_001',
  category: 'ads',
  title: 'Product Showcase Ad',
  prompt: 'Create a 30-second product showcase video...',
  tags: ['product', 'commercial', '30s'],
  rating: 4.8,
  usageCount: 124,
  successRate: 87,
  dateAdded: '2025-07-20'
}
```

### User Interaction States
- **Default**: Neutral, ready for interaction
- **Hover**: Elevated shadow, color accent
- **Active**: Pressed state with visual feedback
- **Success**: Green checkmark with confirmation text
- **Error**: Red border with error message

---

## Component Specifications

### Category Card
- **Size**: 180x100px
- **Content**: Icon, name, prompt count
- **States**: Default, hover, selected
- **Animation**: Scale on hover (1.02x)

### Prompt Card
- **Height**: Variable (min 120px)
- **Actions**: Copy, save, rate
- **Truncation**: 2-line preview with "Show more"
- **Metadata**: Rating, usage, tags

### YouTube Embed
- **Size**: 300x169px (16:9 aspect ratio)
- **Controls**: Play/pause, no fullscreen in popup
- **Loading**: Thumbnail placeholder
- **Privacy**: youtube-nocookie.com domain

This design ensures a clean, efficient, and user-friendly experience that integrates seamlessly with the Veo 3 workflow while maintaining Google's design principles.