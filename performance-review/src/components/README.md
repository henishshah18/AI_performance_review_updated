# UI Components Library - Phase 1.5

This directory contains all the reusable UI components for the AI Performance Review Management platform. These components form the foundation for building consistent, accessible, and maintainable user interfaces.

## 📁 Directory Structure

```
src/components/
├── common/          # Shared UI components
├── forms/           # Form-related components
├── feedback/        # Feedback-specific components
├── layout/          # Layout components (future)
└── README.md        # This file
```

## 🧩 Component Categories

### Common Components (`/common`)

#### StatusBadge
Visual indicator for different status types with color coding and accessibility features.
- **Props**: `status`, `size`, `showTooltip`, `className`
- **Variants**: 8 status types (not-started, draft, in-progress, active, completed, blocked, overdue, cancelled)
- **Features**: Hover tooltips, ARIA labels, responsive sizing

#### Toast
Notification system for user feedback with auto-dismiss functionality.
- **Props**: `type`, `message`, `duration`, `onDismiss`, `action`
- **Types**: success, error, warning, info
- **Features**: Auto-dismiss, manual dismiss, action buttons, animations

#### Modal
Accessible modal dialog with focus management and keyboard navigation.
- **Props**: `isOpen`, `onClose`, `title`, `size`, `children`, `showCloseButton`
- **Features**: Focus trap, escape key handling, backdrop click, scroll lock
- **Sizes**: sm, md, lg, xl

#### LoadingSpinner
Animated loading indicator with customizable appearance.
- **Props**: `size`, `color`, `className`, `label`
- **Variants**: Multiple sizes and colors
- **Features**: Accessibility labels, smooth animations

#### LoadingSkeleton
Content placeholder for loading states with multiple variants.
- **Props**: `variant`, `width`, `height`, `lines`, `animate`
- **Variants**: text, circular, rectangular, card
- **Includes**: Predefined components (SkeletonText, SkeletonCircle, etc.)

#### ErrorBoundary
React error boundary for graceful error handling.
- **Props**: `children`, `fallback`, `onError`
- **Features**: Development error details, user-friendly fallback UI

#### ErrorMessage
Consistent error display component with retry functionality.
- **Props**: `title`, `message`, `variant`, `onRetry`, `onDismiss`
- **Variants**: inline, card, banner
- **Features**: Dismissible, retry actions, icon support

#### EmptyState
User-friendly empty state displays for various scenarios.
- **Props**: `title`, `description`, `icon`, `action`, `variant`
- **Includes**: Predefined states (NoObjectives, NoGoals, SearchNoResults, etc.)
- **Features**: Custom icons, action buttons, contextual messaging

#### ProgressBar
Linear progress indicator with animations and labeling.
- **Props**: `value`, `max`, `size`, `color`, `showLabel`, `animated`
- **Features**: Smooth animations, accessibility, color variants

#### CircularProgress
Circular progress indicator using SVG for crisp rendering.
- **Props**: `value`, `max`, `size`, `color`, `showText`, `thickness`
- **Features**: SVG-based, customizable thickness, percentage display

### Form Components (`/forms`)

#### FormField
Standard text input with consistent styling and validation.
- **Props**: `name`, `label`, `type`, `required`, `error`, `helpText`
- **Features**: Error states, help text, accessibility labels

#### FormSelect
Dropdown selection with option groups and validation.
- **Props**: `name`, `label`, `options`, `multiple`, `placeholder`, `error`
- **Features**: Single/multiple selection, disabled options, validation

#### FormTextarea
Multi-line text input with character counting.
- **Props**: `name`, `label`, `rows`, `maxLength`, `showCharCount`, `error`
- **Features**: Character limit, visual feedback, auto-resize

#### FormCheckbox
Checkbox input with description support.
- **Props**: `name`, `label`, `description`, `checked`, `error`
- **Features**: Description text, error states, proper labeling

#### FormDatePicker
Date selection input with validation and formatting.
- **Props**: `name`, `label`, `min`, `max`, `error`, `helpText`
- **Features**: Date validation, min/max constraints, calendar icon

### Feedback Components (`/feedback`)

#### GlobalFeedbackModal
Comprehensive feedback submission form with validation.
- **Props**: `isOpen`, `onClose`, `onSubmit`, `users`, `entities`
- **Features**: 
  - Multiple feedback types (commendation, guidance, constructive)
  - Visibility controls (private/public)
  - Tag selection for skills/areas
  - Entity relationships (goals, objectives, tasks)
  - Anonymous submission option
  - Form validation with Yup schema

## 🎨 Design System Integration

All components follow the established design system with:

### Color Palette
- **Primary**: #5E35B1 (Purple)
- **Secondary**: #00897B (Teal)
- **Accent**: #FF9800 (Orange)
- **Status Colors**: 8 distinct colors for different states
- **Semantic Colors**: Success, Warning, Error variants

### Typography
- Consistent font sizing and weights
- Proper heading hierarchy
- Accessible contrast ratios

### Spacing
- 4px base unit system
- Consistent padding and margins
- Responsive spacing scales

### Animations
- Smooth transitions (300-500ms)
- Easing functions for natural motion
- Reduced motion support

## ♿ Accessibility Features

All components include:
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliant
- **Screen Reader Support**: Semantic HTML and ARIA attributes

## 🔧 Usage Examples

### Basic Form
```tsx
import { FormField, FormSelect, FormTextarea } from '../components/forms';

<form>
  <FormField
    name="title"
    label="Objective Title"
    required
    error={errors.title}
  />
  
  <FormSelect
    name="priority"
    label="Priority Level"
    options={priorityOptions}
    error={errors.priority}
  />
  
  <FormTextarea
    name="description"
    label="Description"
    maxLength={500}
    showCharCount
  />
</form>
```

### Status Display
```tsx
import { StatusBadge, ProgressBar } from '../components/common';

<div>
  <StatusBadge status="in-progress" size="md" showTooltip />
  <ProgressBar value={75} showLabel animated />
</div>
```

### Loading States
```tsx
import { LoadingSpinner, LoadingSkeleton } from '../components/common';

// Spinner for actions
<LoadingSpinner size="md" color="primary" />

// Skeleton for content
<LoadingSkeleton variant="card" height="200px" />
```

## 🚀 Future Enhancements

### Phase 2 Additions
- Layout components (Header, Sidebar, Navigation)
- Data display components (Tables, Cards, Lists)
- Advanced form components (Multi-step forms, File uploads)

### Phase 3 Additions
- Chart and visualization components
- Advanced interaction components
- Mobile-optimized variants

## 📝 Development Guidelines

### Component Creation
1. Follow TypeScript interfaces for props
2. Include proper JSDoc comments
3. Implement accessibility features
4. Add error boundaries where appropriate
5. Include loading and error states

### Styling
1. Use Tailwind CSS classes
2. Follow the design system tokens
3. Ensure responsive design
4. Test with different screen sizes

### Testing
1. Unit tests for component logic
2. Accessibility testing with screen readers
3. Visual regression testing
4. Cross-browser compatibility

## 🔗 Related Documentation

- [Design System Guide](../docs/design-system.md)
- [Accessibility Guidelines](../docs/accessibility.md)
- [Component Testing](../docs/testing.md)
- [Tailwind Configuration](../tailwind.config.js) 