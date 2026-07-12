# Design Document — DayByDay Couple App

## Overview

This document defines the architecture, component structure, data models, interfaces, and correctness properties for the DayByDay couple application. The system is a private two-user web app with a meeting countdown, shared calendar, digital diary, and photo gallery, all wrapped in a pink-themed UI.

## Architecture

The application follows a monorepo structure with clearly separated frontend and backend concerns:

```
daybyday/
├── backend/          # Strapi 5 headless CMS (REST API)
│   ├── config/       # Database, plugins, server, middlewares
│   ├── src/
│   │   ├── api/      # Content-type APIs (diary-entry, calendar-annotation, meeting-date, photo, album)
│   │   └── extensions/  # users-permissions extensions
│   ├── database/
│   │   └── seeds/    # Two pre-seeded user accounts
│   └── package.json
├── frontend/         # Next.js 14 App Router
│   ├── app/
│   │   ├── (auth)/       # Login page (public)
│   │   ├── (protected)/  # All authenticated routes
│   │   │   ├── home/         # Meeting countdown
│   │   │   ├── calendar/     # Shared calendar
│   │   │   ├── diary/        # Digital diary
│   │   │   ├── gallery/      # Photo gallery
│   │   │   └── settings/     # PIN setup, meeting date config
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── actions/      # Server actions for mutations
│   ├── components/   # Shared UI components
│   ├── lib/          # Utilities, API client, auth helpers
│   ├── types/        # TypeScript type definitions
│   └── package.json
└── .env.example
```

## Components and Interfaces

### Frontend Components

```typescript
// Route Group: (auth) — Public routes
app/(auth)/login/page.tsx         // Login form with identifier + password

// Route Group: (protected) — Requires JWT
app/(protected)/layout.tsx        // Auth guard, nav bar, pink theme wrapper
app/(protected)/home/page.tsx     // Meeting countdown + photo animation
app/(protected)/calendar/page.tsx // FullCalendar with annotations
app/(protected)/diary/page.tsx    // Diary entry list + PIN gate
app/(protected)/diary/[date]/page.tsx  // Single diary entry view/edit
app/(protected)/gallery/page.tsx  // Photo grid organized by month/event
app/(protected)/settings/page.tsx // PIN management, meeting date picker
```

### Shared Components

```typescript
// components/
AuthGuard.tsx          // Wraps protected layout, redirects if no JWT
CountdownDisplay.tsx   // Days remaining + photo position calculator
PhotoAnimation.tsx     // Framer Motion animated photos approaching
ConfettiEffect.tsx     // Confetti burst on meeting day
MoodSelector.tsx       // Emoji mood picker (5+ options)
WeatherSelector.tsx    // Weather condition emoji picker
PinGate.tsx            // 4-digit PIN input with lockout logic
Lightbox.tsx           // Full-screen photo viewer
PinkButton.tsx         // Themed button component
PinkCard.tsx           // Themed card component
Navigation.tsx         // Bottom/side nav with pink theme
```

### Server Actions

```typescript
// actions/
auth.actions.ts        // login, logout
diary.actions.ts       // createEntry, updateEntry, searchEntries
calendar.actions.ts    // markDate, addEmoji, getAnnotations, getMonthSummary
gallery.actions.ts     // uploadPhoto, uploadBatch, createAlbum, getPhotos
meeting.actions.ts     // setMeetingDate, getMeetingDate
pin.actions.ts         // setPin, validatePin, checkLockout
```

## Data Models

### Strapi Content Types

```typescript
// api::meeting-date/content-types/meeting-date/schema.json
interface MeetingDate {
  id: number;
  date: string;            // ISO date string (future date)
  startDate: string;       // Date when countdown started (for position calc)
  setBy: Relation<User>;   // Which user set this date
  createdAt: string;
  updatedAt: string;
}

// api::calendar-annotation/content-types/calendar-annotation/schema.json
interface CalendarAnnotation {
  id: number;
  date: string;            // ISO date string
  completed: boolean;      // Whether the day is marked as completed
  emojis: string;          // JSON array of emoji strings e.g. '["❤️","🎂"]'
  user: Relation<User>;    // Which user made this annotation
  createdAt: string;
  updatedAt: string;
}

// api::diary-entry/content-types/diary-entry/schema.json
interface DiaryEntry {
  id: number;
  date: string;            // ISO date string (entry date)
  content: string;         // Free-form text (richtext)
  mood: string;            // Emoji string representing mood
  weather: string;         // Emoji string representing weather
  images: Media[];         // Cloudinary image URLs
  voiceNote: Media | null; // Cloudinary audio URL
  user: Relation<User>;    // Owner of this entry
  createdAt: string;
  updatedAt: string;
}

// api::photo/content-types/photo/schema.json
interface Photo {
  id: number;
  image: Media;            // Cloudinary image URL
  uploadDate: string;      // ISO date string
  eventTag: string | null; // Optional event/album association
  user: Relation<User>;    // Who uploaded it
  createdAt: string;
  updatedAt: string;
}

// api::album/content-types/album/schema.json
interface Album {
  id: number;
  name: string;            // User-defined album name
  photos: Relation<Photo[]>;
  createdAt: string;
  updatedAt: string;
}
```

### User Extension (users-permissions)

```typescript
// Extend Strapi's built-in User content type
interface UserExtension {
  diaryPin: string | null;       // bcrypt-hashed 4-digit PIN
  pinFailedAttempts: number;     // Consecutive failed PIN attempts
  pinLockedUntil: string | null; // ISO datetime when lockout expires
  avatar: Media | null;          // User's profile photo for countdown
  displayName: string;           // Name shown in the app
}
```

## Interfaces & API Design

### Authentication Flow

```typescript
// POST /api/auth/local
interface LoginRequest {
  identifier: string;  // email or username
  password: string;
}

interface LoginResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    displayName: string;
    avatar: { url: string } | null;
  };
}
```

### Meeting Date API

```typescript
// GET /api/meeting-dates?sort=date:desc&pagination[limit]=1
// Returns the latest meeting date (shared between both users)

// POST /api/meeting-dates
interface SetMeetingDateRequest {
  data: {
    date: string;       // ISO date string
    startDate: string;  // Today's date (countdown start)
    setBy: number;      // User ID
  };
}
```

### Calendar Annotations API

```typescript
// GET /api/calendar-annotations?filters[date][$gte]=YYYY-MM-01&filters[date][$lte]=YYYY-MM-31
// Returns all annotations for a given month (from both users)

// POST /api/calendar-annotations
interface CreateAnnotationRequest {
  data: {
    date: string;
    completed: boolean;
    emojis: string;     // JSON stringified array
    user: number;
  };
}

// PUT /api/calendar-annotations/:id
interface UpdateAnnotationRequest {
  data: {
    completed?: boolean;
    emojis?: string;
  };
}
```

### Diary API

```typescript
// GET /api/diary-entries?filters[user]=:userId&sort=date:desc&populate=images,voiceNote
// Returns diary entries for the authenticated user in reverse chronological order

// GET /api/diary-entries?filters[user]=:userId&filters[content][$containsi]=keyword
// Search diary entries by keyword

// POST /api/diary-entries
interface CreateDiaryEntryRequest {
  data: {
    date: string;
    content: string;
    mood: string;
    weather: string;
    user: number;
  };
}
```

### PIN Validation API

```typescript
// POST /api/pin/validate (custom controller)
interface ValidatePinRequest {
  pin: string;  // 4-digit PIN in plaintext (validated server-side against hash)
}

interface ValidatePinResponse {
  valid: boolean;
  locked: boolean;
  lockExpiresAt: string | null;  // ISO datetime if locked
}

// PUT /api/pin/set (custom controller)
interface SetPinRequest {
  pin: string;       // New 4-digit PIN (will be hashed before storage)
  currentPin?: string; // Required if changing existing PIN
}
```

### Photo Gallery API

```typescript
// GET /api/photos?sort=uploadDate:desc&populate=image
// Returns all photos from both users

// POST /api/photos (supports batch via repeated calls or custom batch endpoint)
interface UploadPhotoRequest {
  data: {
    uploadDate: string;
    eventTag?: string;
    user: number;
  };
  files: {
    image: File;
  };
}

// POST /api/albums
interface CreateAlbumRequest {
  data: {
    name: string;
  };
}
```

## Key Algorithms

### Countdown & Photo Position Calculation

```typescript
// lib/countdown.ts

/**
 * Calculates days remaining until meeting date.
 * Returns 0 if meeting date is today or in the past.
 */
export function calculateDaysRemaining(
  meetingDate: Date,
  currentDate: Date = new Date()
): number {
  const diffMs = meetingDate.getTime() - startOfDay(currentDate).getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculates photo position as a percentage (0 = edges, 1 = center).
 * Proportional to elapsed days since countdown started.
 */
export function calculatePhotoPosition(
  startDate: Date,
  meetingDate: Date,
  currentDate: Date = new Date()
): number {
  const totalDays = Math.max(1, daysBetween(startDate, meetingDate));
  const elapsedDays = daysBetween(startDate, currentDate);
  return Math.min(1, Math.max(0, elapsedDays / totalDays));
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  const diffMs = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
```

### PIN Lockout Logic

```typescript
// lib/pin.ts

interface PinState {
  failedAttempts: number;
  lockedUntil: Date | null;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

/**
 * Determines if PIN access is currently locked.
 */
export function isLocked(state: PinState, now: Date = new Date()): boolean {
  if (!state.lockedUntil) return false;
  return now.getTime() < state.lockedUntil.getTime();
}

/**
 * Processes a PIN attempt. Returns updated state and whether access is granted.
 */
export function processPinAttempt(
  state: PinState,
  isCorrect: boolean,
  now: Date = new Date()
): { newState: PinState; granted: boolean } {
  if (isLocked(state, now)) {
    return { newState: state, granted: false };
  }

  if (isCorrect) {
    return {
      newState: { failedAttempts: 0, lockedUntil: null },
      granted: true,
    };
  }

  const newAttempts = state.failedAttempts + 1;
  if (newAttempts >= MAX_ATTEMPTS) {
    return {
      newState: {
        failedAttempts: 0,
        lockedUntil: new Date(now.getTime() + LOCKOUT_DURATION_MS),
      },
      granted: false,
    };
  }

  return {
    newState: { failedAttempts: newAttempts, lockedUntil: null },
    granted: false,
  };
}
```

### Diary Search

```typescript
// lib/diary-search.ts

/**
 * Filters diary entries by keyword (case-insensitive substring match).
 */
export function searchDiaryEntries(
  entries: DiaryEntry[],
  keyword: string
): DiaryEntry[] {
  const lower = keyword.toLowerCase();
  return entries.filter((entry) =>
    entry.content.toLowerCase().includes(lower)
  );
}

/**
 * Sorts diary entries in reverse chronological order.
 */
export function sortEntriesDescending(entries: DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
```

### Gallery Grouping

```typescript
// lib/gallery.ts

interface PhotoGroup {
  label: string;     // e.g. "July 2026"
  month: number;
  year: number;
  photos: Photo[];
}

/**
 * Groups photos by month/year for display.
 */
export function groupPhotosByMonth(photos: Photo[]): PhotoGroup[] {
  const groups = new Map<string, PhotoGroup>();

  for (const photo of photos) {
    const date = new Date(photo.uploadDate);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!groups.has(key)) {
      groups.set(key, {
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        month: date.getMonth(),
        year: date.getFullYear(),
        photos: [],
      });
    }
    groups.get(key)!.photos.push(photo);
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.year - a.year || b.month - a.month
  );
}
```

## Error Handling

### Authentication Errors

| Scenario | Response | Client Behavior |
|----------|----------|-----------------|
| Invalid credentials | 401 + error message | Display "Invalid email or password" toast |
| Expired JWT | 401 | Redirect to login page, clear stored token |
| Missing JWT on protected route | N/A (client-side check) | Redirect to login page |

### PIN Errors

| Scenario | Response | Client Behavior |
|----------|----------|-----------------|
| Incorrect PIN (attempt < 3) | `{ valid: false, locked: false }` | Show "Incorrect PIN" + remaining attempts |
| Lockout triggered | `{ valid: false, locked: true, lockExpiresAt }` | Show countdown timer until unlock |
| PIN not set | 404 on validate | Redirect to PIN setup flow |

### File Upload Errors

| Scenario | Response | Client Behavior |
|----------|----------|-----------------|
| File too large | 413 | Show "File exceeds size limit" message |
| Invalid file type | 400 | Show "Unsupported file type" message |
| Cloudinary error | 500 | Show "Upload failed, please try again" with retry option |

### General Error Strategy

- All server actions wrap API calls in try/catch and return `{ success: boolean; error?: string; data?: T }`
- Frontend displays errors via toast notifications (pink-themed)
- Network failures show a retry prompt
- Optimistic updates revert on failure

## Tailwind Theme Configuration

```typescript
// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        background: '#ffffff',
        foreground: '#831843',
        accent: '#ec4899',
        muted: '#fdf2f8',
      },
    },
  },
  plugins: [],
};

export default config;
```

## Backend Configuration

### Database Configuration (PostgreSQL)

```typescript
// backend/config/database.ts
export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      connectionString: env('DATABASE_URL'),
      ssl: env.bool('DATABASE_SSL', true) ? { rejectUnauthorized: false } : false,
    },
    pool: { min: 2, max: 10 },
  },
});
```

### Cloudinary Upload Provider

```typescript
// backend/config/plugins.ts
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: { folder: 'daybyday' },
      },
    },
  },
});
```

### Database Seed Script

```typescript
// backend/src/index.ts — bootstrap lifecycle
export default {
  async bootstrap({ strapi }) {
    // Seed two users if they don't exist
    const userService = strapi.plugin('users-permissions').service('user');
    const existingUsers = await userService.fetchAll({ filters: {} });

    if (existingUsers.length === 0) {
      const role = await strapi.plugin('users-permissions').service('role')
        .find({ type: 'authenticated' });

      await userService.add({
        username: 'user1',
        email: 'user1@daybyday.app',
        password: 'SecurePass1!',
        role: role.id,
        confirmed: true,
        displayName: 'Partner 1',
      });

      await userService.add({
        username: 'user2',
        email: 'user2@daybyday.app',
        password: 'SecurePass2!',
        role: role.id,
        confirmed: true,
        displayName: 'Partner 2',
      });
    }
  },
};
```

## Frontend Auth Guard Pattern

```typescript
// frontend/lib/auth.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get('jwt')?.value ?? null;
}

export async function requireAuth(): Promise<string> {
  const token = await getAuthToken();
  if (!token) {
    redirect('/login');
  }
  return token;
}

// frontend/app/(protected)/layout.tsx
import { requireAuth } from '@/lib/auth';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="pb-16">{children}</main>
    </div>
  );
}
```

## Framer Motion Page Transitions

```typescript
// components/PageTransition.tsx
'use client';
import { motion } from 'framer-motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}
```

## Testing Strategy

### Unit Tests
- Pure utility functions: `calculateDaysRemaining`, `calculatePhotoPosition`, `searchDiaryEntries`, `sortEntriesDescending`, `groupPhotosByMonth`
- PIN lockout logic: `processPinAttempt`, `isLocked`
- Specific edge cases: countdown at zero, empty diary search, no photos in gallery

### Property-Based Tests
- Countdown calculation correctness (Properties 1-2)
- Diary search and sorting invariants (Properties 8-9)
- PIN lockout state machine (Properties 11-12)
- Gallery grouping correctness (Property 13)

### Integration Tests
- Authentication flow with Strapi (login, JWT storage, logout)
- Cloudinary upload round-trip (image and voice note)
- Calendar annotation CRUD via Strapi REST API
- Meeting date shared between two users

### End-to-End Tests
- Full login → home screen countdown visible
- Diary PIN gate → entry creation → search
- Photo upload → gallery display → lightbox

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Countdown days remaining is non-negative and proportional to date difference

*For any* meeting date in the future and any current date before it, `calculateDaysRemaining(meetingDate, currentDate)` SHALL equal the ceiling of the calendar day difference between currentDate and meetingDate, and SHALL never return a negative number.

**Validates: Requirements 2.1**

### Property 2: Photo position bounded between 0 and 1

*For any* valid start date, meeting date (where meeting >= start), and current date, `calculatePhotoPosition(startDate, meetingDate, currentDate)` SHALL return a value in the range [0, 1], where 0 means photos are at the edges and 1 means photos have met in the center.

**Validates: Requirements 2.3**

### Property 3: Protected route access control

*For any* route path in the protected route group, when no valid JWT is present in the request, the application SHALL redirect the user to the login page and never render the protected content.

**Validates: Requirements 1.7**

### Property 4: Invalid credentials always rejected

*For any* identifier and password combination that does not match one of the two pre-seeded accounts, the authentication endpoint SHALL return an error response and never issue a JWT.

**Validates: Requirements 1.3**

### Property 5: Calendar annotation round-trip persistence

*For any* date (past or present), any set of emojis, and any completion status, when a user creates or updates a calendar annotation and then retrieves annotations for that date's month, the returned data SHALL contain an annotation matching the original date, emojis, and completion status.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 6: Calendar merges both users' annotations

*For any* set of annotations created by user A and any set of annotations created by user B for the same month, when either user retrieves annotations for that month, the result SHALL contain all annotations from both users.

**Validates: Requirements 3.5**

### Property 7: Monthly memories summary completeness

*For any* past month with N total annotations across both users, the monthly memories summary for that month SHALL contain exactly N annotation entries representing all marked days and emoji annotations for that period.

**Validates: Requirements 3.8**

### Property 8: Diary search returns all and only matching entries

*For any* keyword string and any set of diary entries belonging to a user, `searchDiaryEntries(entries, keyword)` SHALL return exactly those entries whose content contains the keyword as a case-insensitive substring, and no others.

**Validates: Requirements 4.7**

### Property 9: Diary entries sorted in reverse chronological order

*For any* list of diary entries returned by `sortEntriesDescending(entries)`, for all consecutive pairs (entries[i], entries[i+1]), the date of entries[i] SHALL be greater than or equal to the date of entries[i+1].

**Validates: Requirements 4.8**

### Property 10: Diary entry ownership invariant

*For any* diary entry creation request with a given user ID and date, the resulting stored entry SHALL have its user field set to that user ID and its date field set to the provided date.

**Validates: Requirements 4.9**

### Property 11: PIN lockout after three consecutive failures

*For any* sequence of PIN validation attempts, if three consecutive incorrect PINs are submitted (without a correct PIN or lockout expiry in between), the system SHALL lock access and reject all subsequent attempts until 30 seconds have elapsed.

**Validates: Requirements 5.3**

### Property 12: PIN hash validation round-trip

*For any* 4-digit PIN string, after hashing and storing it, validating the same original PIN against the stored hash SHALL return true, and validating any different 4-digit PIN SHALL return false.

**Validates: Requirements 5.6**

### Property 13: Gallery photos grouped by month

*For any* set of photos with varying upload dates, `groupPhotosByMonth(photos)` SHALL produce groups where every photo in a group has an upload date within that group's month and year, and no photo is omitted or duplicated across groups.

**Validates: Requirements 6.1**

### Property 14: Gallery merges both users' photos

*For any* set of photos uploaded by user A and any set of photos uploaded by user B, the gallery view SHALL contain all photos from both users without omission.

**Validates: Requirements 6.6**

### Property 15: Batch upload count invariant

*For any* batch of N valid image files submitted in a single batch upload operation, the system SHALL store exactly N new photo records, each with a valid Cloudinary URL and correct metadata.

**Validates: Requirements 6.7**

### Property 16: Meeting date shared accessibility

*For any* meeting date set by either user, when the other user retrieves the current meeting date, they SHALL receive the same date value that was stored.

**Validates: Requirements 9.2**
