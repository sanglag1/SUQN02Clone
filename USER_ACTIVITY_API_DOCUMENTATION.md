# User Activity Management API & UI Documentation

## Overview

This module provides comprehensive user activity tracking and management capabilities for admin users. It includes APIs for data retrieval, management, and analytics, plus React components for the admin interface.

## API Endpoints

### 1. List All User Activities

**GET** `/api/admin/user-activities`

**Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)
- `search` (optional): Search users by name, email, skills, or goals
- `sortBy` (optional): Sort field (default: 'lastActive')
- `sortOrder` (optional): 'asc' or 'desc' (default: 'desc')
- `skill` (optional): Filter by skill name
- `goalStatus` (optional): Filter by goal status ('completed', 'in-progress', 'pending')

**Response:**

```json
{
  "activities": [
    /* Array of user activities with stats */
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  },
  "summary": {
    "totalUsers": 150,
    "activeUsersToday": 45,
    "totalActivities": 1250,
    "totalCompletedGoals": 89,
    "averageStudyTime": 245
  }
}
```

### 2. Get User Activity Details

**GET** `/api/admin/user-activities/[userId]`

**Parameters:**

- `timeRange` (optional): Number of days to look back (default: 30)
- `activityType` (optional): Filter by activity type ('all', 'interview', 'quiz', 'practice', 'learning')

**Response:**

```json
{
  "user": {
    /* User details */
  },
  "stats": {
    /* Detailed statistics */
  },
  "activities": [
    /* Filtered activities */
  ],
  "skills": [
    /* User skills with scores */
  ],
  "goals": [
    /* User goals with status */
  ],
  "learningStats": {
    /* Study time, streak, etc */
  },
  "dailyActivity": {
    /* Daily breakdown */
  },
  "recentTimeline": [
    /* Recent activity timeline */
  ]
}
```

### 3. Manage User Activity Data

**PATCH** `/api/admin/user-activities/[userId]/manage`

**Body Operations:**

```json
{
  "operation": "addGoal",
  "goal": {
    "title": "Learn React",
    "description": "Master React fundamentals",
    "targetDate": "2025-02-01",
    "type": "skill"
  }
}
```

**Available Operations:**

- `addGoal`: Add new goal
- `updateGoal`: Update existing goal
- `removeGoal`: Remove goal by ID
- `addSkill`: Add new skill
- `updateSkill`: Update skill score/level
- `removeSkill`: Remove skill by name
- `resetProgress`: Clear all activities and progress
- `updateStats`: Update learning statistics

### 4. Delete User Activity Data

**DELETE** `/api/admin/user-activities/[userId]/manage`

**Parameters:**

- `type`: Type of data to delete ('activities', 'goals', 'skills', 'recommendations', 'stats', 'all')
- `confirm`: Must be 'true' to proceed

### 5. Analytics Dashboard

**GET** `/api/admin/user-activities/analytics`

**Parameters:**

- `days` (optional): Time range in days (default: 30)
- `charts` (optional): Include chart data (default: false)

**Response:**

```json
{
  "summary": {
    "totalUsers": 150,
    "activeUsers": 45,
    "activationRate": 30,
    "totalActivities": 1250,
    "averageScore": 75
  },
  "activityBreakdown": {
    "interviews": 450,
    "quizzes": 350,
    "practice": 450
  },
  "goalMetrics": {
    /* Goal completion stats */
  },
  "topSkills": [
    /* Most popular skills */
  ],
  "engagement": {
    /* User engagement metrics */
  },
  "charts": {
    /* Optional chart data */
  }
}
```

## React Components

### 1. UserActivitiesList

**File:** `/src/components/admin/UserActivitiesList.tsx`

**Props:**

```typescript
interface UserActivitiesListProps {
  onViewDetails: (userId: string) => void;
  onEditUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}
```

**Features:**

- Paginated list of user activities
- Search and filter capabilities
- Sort by various fields
- Summary statistics cards
- Action buttons for each user

### 2. UserActivityDetailView

**File:** `/src/components/admin/UserActivityDetailView.tsx`

**Props:**

```typescript
interface UserActivityDetailViewProps {
  userId: string;
  onBack: () => void;
}
```

**Features:**

- Detailed user activity analysis
- Time range and activity type filters
- Skills breakdown with progress bars
- Goals tracking with status indicators
- Activity timeline
- Strengths, weaknesses, and recommendations

### 3. AdminAnalytics

**File:** `/src/components/admin/AdminAnalytics.tsx`

**Features:**

- Platform-wide analytics dashboard
- Key metrics summary
- Activity breakdown charts
- Goal completion metrics
- Top skills analysis
- User engagement distribution
- Performance trends (optional)

### 4. AdminUserActivitiesPage

**File:** `/src/app/admin/user-activities/page.tsx`

**Features:**

- Main admin page with tabbed interface
- Analytics overview tab
- User activities management tab
- System management tools
- Bulk operations interface

## Data Models

### UserActivity Model

```typescript
interface IUserActivity {
  userId: ObjectId;
  activities: IActivity[];
  skills: ISkill[];
  goals: IGoal[];
  learningStats: ILearningStats;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  lastActive: Date;
  progressHistory: Array<{
    date: Date;
    overallScore: number;
    skillScores: Record<string, number>;
  }>;
}
```

### Activity Types

- `interview`: Interview practice sessions
- `quiz`: Quiz completions
- `practice`: General practice sessions
- `learning`: Learning activities
- `goal_completed`: Goal completion events
- `goal_started`: Goal initiation events

### Skill Levels

- `beginner`: 0-59%
- `intermediate`: 60-74%
- `advanced`: 75-89%
- `expert`: 90-100%

### Goal Statuses

- `pending`: Not started
- `in-progress`: Currently working on
- `completed`: Successfully finished

## Services

### UserActivityService

**File:** `/src/services/userActivityService.ts`

**Key Methods:**

- `initializeUserActivity()`: Create initial activity record
- `trackInterviewActivity()`: Record interview completion
- `updateSkillsFromInterview()`: Update skills based on interview results
- `updateLearningStats()`: Update study time and streaks
- `addGoal()` / `updateGoalStatus()`: Goal management
- `generateRecommendations()`: AI-generated recommendations
- `getProgressReport()`: Comprehensive progress analysis

### TrackingIntegrationService

**File:** `/src/services/trackingIntegrationService.ts`

**Key Methods:**

- `trackInterviewCompletion()`: Full interview completion workflow
- `trackQuizCompletion()`: Quiz completion with skill updates
- `trackPracticeSession()`: Practice session recording
- `trackGoalProgress()`: Goal progress updates
- `getProgressOverview()`: User progress summary

## Security

All API endpoints require:

1. Valid Clerk authentication
2. Admin role verification
3. Rate limiting (if implemented)
4. Input validation and sanitization

## Usage Examples

### Initialize User Activity Tracking

```typescript
// When a new user signs up
await UserActivityService.initializeUserActivity(userId);
```

### Track Interview Completion

```typescript
// After an interview is completed
await TrackingIntegrationService.trackInterviewCompletion(userId, interview);
```

### Get User Analytics for Admin

```typescript
// In admin dashboard
const analytics = await fetch(
  "/api/admin/user-activities/analytics?days=30&charts=true"
);
```

### View User Details

```typescript
// In admin interface
const userDetails = await fetch(
  `/api/admin/user-activities/${userId}?timeRange=90`
);
```

## Performance Considerations

1. **Database Indexing**: Indexes on userId, activity timestamps, and skill names
2. **Pagination**: All list endpoints support pagination
3. **Aggregation**: Complex analytics use MongoDB aggregation pipelines
4. **Caching**: Consider implementing Redis cache for frequently accessed data
5. **Background Jobs**: Heavy operations (like recommendations) could be moved to background jobs

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live activity tracking
2. **Advanced Analytics**: Machine learning for personalized recommendations
3. **Export Features**: CSV/PDF export functionality
4. **Notification System**: Alerts for admin on user milestones
5. **Bulk Operations**: Mass user management capabilities
6. **Advanced Filtering**: More sophisticated search and filter options
7. **Data Visualization**: Charts and graphs for better insights

## Testing

Each API endpoint should have:

- Unit tests for service functions
- Integration tests for API routes
- Mock data for consistent testing
- Performance tests for large datasets

## Error Handling

All endpoints implement:

- Proper HTTP status codes
- Descriptive error messages
- Logging for debugging
- Graceful fallbacks for missing data
