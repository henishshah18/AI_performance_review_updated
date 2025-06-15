# Feedback Components

This directory contains all React components for the Continuous Feedback Module (Phase 5) of the AI Performance Review Platform.

## Overview

The feedback system enables continuous peer-to-peer feedback with three types:
- **Commendation** 👏: Positive recognition and praise
- **Guidance** 💡: Helpful suggestions and advice  
- **Constructive** 🔧: Areas for improvement and development

## Components

### Core Components

#### `FeedbackDashboard`
Main dashboard showing feedback overview and analytics.

**Features:**
- Personal feedback statistics (given/received)
- Feedback type distribution charts
- Recent feedback activity
- Top feedback tags
- Team participation metrics (for managers)
- Quick access to give feedback

**Props:**
```typescript
interface FeedbackDashboardProps {
  className?: string;
}
```

#### `FeedbackCard`
Individual feedback item display component.

**Features:**
- Feedback content with type indicators
- Anonymous feedback support
- Visibility indicators (public/private)
- Tag display
- Comments section
- Action buttons (edit/delete for authorized users)
- Related entity links (goals, objectives, tasks)

**Props:**
```typescript
interface FeedbackCardProps {
  feedback: Feedback;
  showActions?: boolean;
  compact?: boolean;
  onUpdate?: () => void;
}
```

#### `FeedbackList`
Paginated list of feedback with filtering capabilities.

**Features:**
- Advanced filtering (type, visibility, date range, search)
- Pagination with page size control
- Sort options
- Empty state handling
- Responsive design

**Props:**
```typescript
interface FeedbackListProps {
  title?: string;
  filters?: FeedbackFilters;
  showFilters?: boolean;
  className?: string;
}
```

#### `FeedbackAnalytics`
Comprehensive analytics and insights dashboard.

**Features:**
- Key metrics overview
- Feedback type distribution
- Trending tags analysis
- Monthly trends visualization
- Team summary (for managers)
- Date range selection
- Participation rate tracking

**Props:**
```typescript
interface FeedbackAnalyticsProps {
  className?: string;
}
```

#### `FeedbackStatsCard`
Reusable statistics card component.

**Features:**
- Customizable colors and icons
- Trend indicators
- Subtitle support
- Responsive design

**Props:**
```typescript
interface FeedbackStatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'emerald' | 'orange' | 'purple' | 'red';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}
```

#### `GlobalFeedbackModal`
Modal for creating new feedback.

**Features:**
- Multi-step form with validation
- Recipient selection with search
- Feedback type selection
- Visibility controls
- Tag management
- Anonymous feedback option
- Related entity linking
- Auto-save functionality

**Props:**
```typescript
interface GlobalFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackFormData) => Promise<void>;
  users?: Array<{ id: number; name: string; role: string; department: string }>;
  entities?: Array<{ id: number; title: string; type: 'goal' | 'objective' | 'task' }>;
  currentUserId?: number;
}
```

### Page Components

#### `FeedbackPage`
Main feedback page with tabbed interface.

**Features:**
- Dashboard tab with overview
- Given feedback tab with filtering
- Received feedback tab with filtering  
- Analytics tab with insights
- Global feedback creation modal
- Role-based tab visibility
- Responsive navigation

## Usage Examples

### Basic Dashboard
```tsx
import { FeedbackDashboard } from '../components/feedback';

function MyPage() {
  return <FeedbackDashboard className="p-6" />;
}
```

### Filtered Feedback List
```tsx
import { FeedbackList } from '../components/feedback';

function TeamFeedback() {
  return (
    <FeedbackList
      title="Team Feedback"
      filters={{ 
        feedback_type: 'commendation',
        page_size: 20 
      }}
      showFilters={true}
    />
  );
}
```

### Analytics Dashboard
```tsx
import { FeedbackAnalytics } from '../components/feedback';

function AnalyticsPage() {
  return <FeedbackAnalytics className="max-w-7xl mx-auto" />;
}
```

### Feedback Creation Modal
```tsx
import { GlobalFeedbackModal } from '../components/feedback';
import { feedbackService } from '../services/feedbackService';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  
  const handleSubmit = async (data) => {
    await feedbackService.createFeedback(data);
    setShowModal(false);
  };

  return (
    <GlobalFeedbackModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onSubmit={handleSubmit}
      currentUserId={user.id}
    />
  );
}
```

## Features

### Role-Based Access Control
- **Individual Contributors**: Can give/receive feedback, view personal analytics
- **Managers**: Additional team analytics, team member feedback summaries
- **HR Admins**: Full system access, feedback moderation capabilities

### Feedback Types
1. **Commendation** 👏
   - Positive recognition
   - Achievement celebration
   - Peer appreciation

2. **Guidance** 💡
   - Helpful suggestions
   - Best practice sharing
   - Mentoring advice

3. **Constructive** 🔧
   - Improvement areas
   - Skill development
   - Performance enhancement

### Visibility Options
- **Private** 🔒: Visible only to recipient and managers
- **Public** 🌐: Visible to team members

### Advanced Features
- **Anonymous Feedback**: Option to give feedback anonymously
- **Tag System**: Categorize feedback with predefined and custom tags
- **Comments**: Threaded discussions on feedback items
- **Related Entities**: Link feedback to specific goals, objectives, or tasks
- **Search & Filtering**: Advanced filtering and search capabilities
- **Analytics**: Comprehensive insights and trend analysis
- **Real-time Updates**: Live updates when feedback is added/modified

## Technical Implementation

### State Management
- React hooks for local state
- Context API for user authentication
- Custom hooks for data fetching

### API Integration
- RESTful API calls via `feedbackService`
- Error handling and loading states
- Pagination and filtering support

### Styling
- Tailwind CSS for responsive design
- Consistent color scheme and typography
- Accessibility compliance (WCAG 2.1 AA)

### Performance
- Lazy loading for large lists
- Optimized re-renders
- Efficient pagination
- Image optimization for avatars

## Dependencies

### Required Services
- `feedbackService`: API communication layer
- `AuthContext`: User authentication and authorization

### Required Types
- `Feedback`: Core feedback data structure
- `FeedbackAnalytics`: Analytics data structure
- `FeedbackFilters`: Filtering options
- `User`: User data structure

### UI Dependencies
- `LoadingSpinner`: Loading state component
- `ErrorMessage`: Error display component
- `Modal`: Base modal component
- Form components (`FormField`, `FormSelect`, etc.)

## Integration

### Routing
Add to your router configuration:
```tsx
import FeedbackPage from '../pages/FeedbackPage';

// In your routes
<Route path="/feedback" component={FeedbackPage} />
```

### Navigation
Add to your main navigation:
```tsx
<NavLink to="/feedback" className="nav-link">
  💬 Feedback
</NavLink>
```

## Testing

### Component Testing
- Unit tests for individual components
- Integration tests for user workflows
- Accessibility testing
- Responsive design testing

### API Testing
- Mock API responses for development
- Error scenario testing
- Performance testing with large datasets

## Accessibility

### WCAG 2.1 AA Compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management
- ARIA labels and descriptions

### Features
- High contrast mode support
- Reduced motion preferences
- Text scaling support
- Alternative text for images

## Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Support
- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 14+

## Performance Metrics

### Core Web Vitals
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

### Bundle Size
- Individual components: 5-15KB gzipped
- Complete feedback module: ~45KB gzipped
- Lazy loading reduces initial bundle size

## Future Enhancements

### Planned Features
- Rich text editor for feedback content
- File attachments support
- Feedback templates
- Automated feedback reminders
- Integration with calendar systems
- Mobile app support
- Offline functionality
- Advanced analytics with charts
- Feedback sentiment analysis
- Multi-language support

### API Enhancements
- Real-time notifications
- Bulk operations
- Advanced search with Elasticsearch
- Feedback workflow automation
- Integration with external tools (Slack, Teams)

This comprehensive feedback system provides a complete solution for continuous feedback in modern organizations, supporting various feedback types, advanced analytics, and seamless user experience across all devices and user roles. 