# Development Rules - Veo 3 Prompt Assistant MVP
## Epic 1: Core Prompt Management

### Code Quality Standards

#### CQ-1: TypeScript Implementation
**Rule**: All JavaScript code must be written in TypeScript with strict mode enabled.

**Rationale**: Type safety prevents runtime errors and improves maintainability.

**Implementation**:
- `tsconfig.json` with `"strict": true`
- No `any` types allowed without explicit justification
- All function parameters and return types must be typed
- Interface definitions for all data structures
- Generic types used where appropriate

**Enforcement**:
- ESLint rules: `@typescript-eslint/no-explicit-any`, `@typescript-eslint/strict-boolean-expressions`
- Build process fails on TypeScript errors
- Code review checklist includes type safety verification

---

#### CQ-2: Code Organization and Structure
**Rule**: Follow consistent file and folder structure with clear separation of concerns.

**Directory Structure**:
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   ├── prompt/         # Prompt-specific components
│   └── library/        # Library-specific components
├── services/           # Business logic and API calls
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # CSS and styling
├── assets/             # Images, icons, fonts
└── tests/              # Test files
```

**File Naming Conventions**:
- Components: `PascalCase.tsx` (e.g., `PromptCard.tsx`)
- Services: `camelCase.ts` (e.g., `storageService.ts`)
- Types: `camelCase.types.ts` (e.g., `prompt.types.ts`)
- Utils: `camelCase.ts` (e.g., `formatText.ts`)
- Tests: `[filename].test.ts` (e.g., `PromptCard.test.tsx`)

---

#### CQ-3: Component Architecture
**Rule**: All UI components must follow React functional component patterns with proper prop typing.

**Component Structure**:
```typescript
interface ComponentProps {
  // All props must be explicitly typed
  property: string;
  optional?: boolean;
}

const ComponentName: React.FC<ComponentProps> = ({ 
  property, 
  optional = false 
}) => {
  // Hooks at the top
  const [state, setState] = useState<Type>(initialValue);
  
  // Event handlers
  const handleEvent = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // Render
  return (
    <div className="component-name">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

**Enforcement**:
- All components must have proper TypeScript interfaces
- No inline styles (use CSS classes)
- Maximum 200 lines per component file
- Extract complex logic into custom hooks

---

### Performance Standards

#### PS-1: Load Time Requirements
**Rule**: Extension must meet strict performance benchmarks.

**Benchmarks**:
- Initial popup load: < 2 seconds
- Tab switching: < 200ms
- Search results: < 300ms
- Copy action: < 100ms
- YouTube embed load: < 3 seconds

**Implementation**:
- Lazy loading for non-critical components
- Image optimization and compression
- Bundle size optimization with tree shaking
- Efficient data structures and algorithms
- Debounced user inputs (300ms delay)

**Monitoring**:
- Performance tracking in development
- Automated performance testing in CI/CD
- User-facing performance metrics collection
- Regular performance audits using Chrome DevTools

---

#### PS-2: Memory Management
**Rule**: Extension memory usage must stay within defined limits.

**Limits**:
- Total memory usage: < 50MB
- Storage quota: < 5MB per user
- DOM nodes: < 1000 active elements
- Event listeners: Proper cleanup required

**Implementation**:
- Event listener cleanup in `useEffect` cleanup functions
- Efficient data structures (avoid deep object nesting)
- Image and media optimization
- Garbage collection friendly coding patterns

**Code Example**:
```typescript
useEffect(() => {
  const handleEvent = (event: Event) => {
    // Handle event
  };
  
  element.addEventListener('click', handleEvent);
  
  // Cleanup is mandatory
  return () => {
    element.removeEventListener('click', handleEvent);
  };
}, []);
```

---

### Security and Privacy Rules

#### SP-1: Data Privacy Protection
**Rule**: User data must be protected and handled according to privacy regulations.

**Requirements**:
- No personal data sent to external servers without consent
- All data stored locally in Chrome extension storage
- YouTube embeds use `youtube-nocookie.com` domain
- No tracking pixels or analytics without user consent
- Secure data transmission (HTTPS only)

**Implementation**:
- Chrome storage API with encryption for sensitive data
- Content Security Policy (CSP) headers
- Input sanitization for all user data
- No eval() or innerHTML usage
- Secure random ID generation

---

#### SP-2: Chrome Extension Security
**Rule**: Follow Chrome extension security best practices.

**Manifest V3 Compliance**:
- Minimal permissions requested
- Host permissions only for required domains
- Service worker instead of background pages
- Content Security Policy implemented
- External scripts loaded from approved CDNs only

**Content Security Policy**:
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src https://youtube-nocookie.com https://api.anthropic.com"
  }
}
```

---

### Accessibility Standards

#### AS-1: WCAG 2.1 AA Compliance
**Rule**: All interface elements must meet WCAG 2.1 AA accessibility standards.

**Requirements**:
- Color contrast ratio: minimum 4.5:1
- Keyboard navigation support for all interactive elements
- Screen reader compatibility (ARIA labels)
- Focus indicators visible and consistent
- Text alternatives for all images

**Implementation**:
```typescript
// Example of accessible button
<button
  type="button"
  className="prompt-copy-btn"
  onClick={handleCopy}
  onKeyDown={handleKeyDown}
  aria-label={`Copy prompt: ${promptTitle}`}
  aria-pressed={isCopied}
>
  <span className="sr-only">Copy to clipboard</span>
  <CopyIcon aria-hidden="true" />
</button>
```

**Testing**:
- Automated accessibility testing with axe-core
- Manual keyboard navigation testing
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Color contrast validation tools

---

#### AS-2: Keyboard Navigation
**Rule**: All functionality must be accessible via keyboard navigation.

**Navigation Patterns**:
- Tab order follows logical flow
- Arrow keys for grid navigation
- Enter/Space for activation
- Escape for cancellation/closing
- Ctrl+shortcuts for common actions

**Implementation**:
```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      handleAction();
      break;
    case 'Escape':
      handleCancel();
      break;
    case 'ArrowUp':
    case 'ArrowDown':
      event.preventDefault();
      handleArrowNavigation(event.key);
      break;
  }
};
```

---

### Testing Requirements

#### TR-1: Test Coverage Standards
**Rule**: Maintain minimum 90% test coverage with meaningful tests.

**Test Types Required**:
- Unit tests for all utility functions
- Component tests for UI components
- Integration tests for Chrome extension APIs
- End-to-end tests for critical user paths
- Accessibility tests for all interfaces

**Test Structure**:
```typescript
describe('PromptCard Component', () => {
  const mockPrompt: Prompt = {
    id: 'test-prompt',
    title: 'Test Prompt',
    content: 'Test content',
    category: 'ads',
    tags: ['test'],
    rating: 4.5,
    usageCount: 100
  };

  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should render prompt information correctly', () => {
    // Test implementation
  });

  it('should handle copy action', async () => {
    // Test copy functionality
  });

  it('should be accessible', async () => {
    // Accessibility test
  });
});
```

---

#### TR-2: Error Handling Testing
**Rule**: All error scenarios must be tested and handled gracefully.

**Error Scenarios**:
- Network connectivity issues
- Storage quota exceeded
- Clipboard access denied
- YouTube embed failures
- Invalid data formats
- Chrome extension API failures

**Implementation**:
```typescript
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn('Clipboard API failed, falling back to selection', error);
    try {
      // Fallback method
      return fallbackCopy(text);
    } catch (fallbackError) {
      console.error('All copy methods failed', fallbackError);
      showErrorNotification('Copy failed. Please try again.');
      return false;
    }
  }
};
```

---

### Content and Data Rules

#### CD-1: Prompt Content Standards
**Rule**: All prompt content must meet quality and appropriateness standards.

**Content Requirements**:
- Family-friendly content only
- No copyrighted material
- Clear, actionable prompt instructions
- Proper grammar and formatting
- Relevant to assigned category
- Tested for effectiveness with Veo 3

**Quality Metrics**:
- Minimum prompt length: 10 characters
- Maximum prompt length: 2000 characters
- Required elements: subject, style, technical specs
- Success rate tracking for effectiveness
- User rating system for quality feedback

---

#### CD-2: YouTube Preview Standards
**Rule**: YouTube preview videos must meet content and technical standards.

**Content Standards**:
- Safe for work content only
- High production quality (720p minimum)
- Relevant to prompt category
- No copyrighted music without permission
- Duration: 30 seconds to 5 minutes optimal

**Technical Standards**:
- Use `youtube-nocookie.com` for privacy
- Fallback thumbnail for embed failures
- Lazy loading implementation
- Auto-pause when navigating away
- Error handling for blocked videos

---

### User Experience Rules

#### UX-1: Interaction Design Standards
**Rule**: All user interactions must provide immediate and clear feedback.

**Feedback Requirements**:
- Visual confirmation within 100ms of user action
- Loading states for operations > 200ms
- Error messages that explain the problem and solution
- Success confirmations that fade after 2 seconds
- Hover states for all interactive elements

**Animation Standards**:
- Transition duration: 200ms for state changes
- Easing function: `ease-in-out` for smooth feel
- No animations longer than 500ms
- Reduced motion support for accessibility
- 60fps performance for all animations

---

#### UX-2: Information Architecture
**Rule**: Information must be organized logically with clear hierarchy.

**Hierarchy Principles**:
- Most important actions prominently displayed
- Related functions grouped together
- Maximum 3 levels of navigation depth
- Consistent navigation patterns throughout
- Clear breadcrumbs for location awareness

**Content Organization**:
- Categories sorted by popularity/usage
- Prompts sorted by rating (default)
- Search results ranked by relevance
- Tags organized alphabetically
- Recent items easily accessible

---

### Development Workflow Rules

#### DW-1: Version Control Standards
**Rule**: Follow Git best practices with clear commit history.

**Commit Message Format**:
```
type(scope): description

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
**Scope**: Component or feature area being modified

**Branch Strategy**:
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/[name]`: Individual feature development
- `hotfix/[name]`: Critical bug fixes

---

#### DW-2: Code Review Requirements
**Rule**: All code must be reviewed before merging to main branch.

**Review Checklist**:
- [ ] TypeScript types properly defined
- [ ] Tests written and passing
- [ ] Accessibility standards met
- [ ] Performance benchmarks met
- [ ] Security best practices followed
- [ ] Documentation updated
- [ ] Error handling implemented
- [ ] Code follows style guidelines

**Review Process**:
- Minimum one reviewer approval required
- Author must address all feedback
- CI/CD tests must pass
- Performance regression tests pass
- Security scan passes

---

### Deployment and Release Rules

#### DR-1: Chrome Web Store Preparation
**Rule**: Extension must meet all Chrome Web Store requirements before submission.

**Pre-submission Checklist**:
- [ ] Manifest V3 compliance verified
- [ ] Privacy policy published and linked
- [ ] Terms of service created
- [ ] High-quality screenshots (1280x800px)
- [ ] Promotional tile (440x280px)
- [ ] Detailed description with keywords
- [ ] Category selection appropriate
- [ ] Pricing and distribution configured

**Quality Requirements**:
- No critical bugs or crashes
- Loading time under 2 seconds
- 4.5+ star rating in beta testing
- Positive user feedback incorporated
- Legal compliance verified

---

#### DR-2: Version Management
**Rule**: Follow semantic versioning with clear release notes.

**Version Format**: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes or major feature additions
- MINOR: New features, backward compatible
- PATCH: Bug fixes and minor improvements

**Release Process**:
1. Code freeze 48 hours before release
2. Final testing and QA approval
3. Documentation update
4. Release notes preparation
5. Chrome Web Store submission
6. Post-release monitoring

---

### Monitoring and Analytics Rules

#### MA-1: Performance Monitoring
**Rule**: Continuously monitor extension performance and user experience.

**Metrics to Track**:
- Extension load time
- Memory usage patterns
- Error rates and types
- User action completion rates
- Feature adoption rates
- User retention metrics

**Implementation**:
- Client-side performance tracking
- Error logging with stack traces
- User flow analytics
- A/B testing framework
- Real user monitoring (RUM)

---

#### MA-2: Privacy-Compliant Analytics
**Rule**: Analytics must respect user privacy and comply with regulations.

**Privacy Requirements**:
- Anonymous data collection only
- User consent before tracking
- Data minimization principles
- No personally identifiable information
- Clear opt-out mechanisms
- GDPR compliance

**Data Collection Guidelines**:
- Aggregate data only
- No individual user tracking
- Local processing preferred
- Minimal data retention
- Secure data transmission

---

### Emergency Procedures

#### EP-1: Critical Bug Response
**Rule**: Critical bugs must be addressed within defined timeframes.

**Severity Levels**:
- **P0 (Critical)**: Extension unusable, security vulnerability - 4 hour response
- **P1 (High)**: Major feature broken, affects >50% users - 24 hour response
- **P2 (Medium)**: Minor feature issues, affects <50% users - 1 week response
- **P3 (Low)**: Enhancement requests, cosmetic issues - Next release

**Response Process**:
1. Issue triage and severity assignment
2. Immediate user communication for P0/P1
3. Hotfix development and testing
4. Emergency release deployment
5. Post-incident review and prevention

---

#### EP-2: Chrome Web Store Issues
**Rule**: Handle Chrome Web Store policy violations immediately.

**Response Protocol**:
- Acknowledge violation within 2 hours
- Develop compliance plan within 24 hours
- Submit corrected version within 72 hours
- Maintain user communication throughout
- Document lessons learned

**Prevention Measures**:
- Regular policy compliance audits
- Pre-submission legal review
- Community guidelines training
- Automated compliance checking
- Proactive policy monitoring

These rules ensure consistent, high-quality development while maintaining security, accessibility, and user experience standards throughout the MVP development process.