# Implementation Plan: DayByDay Couple App

## Overview

This plan implements Phase 1 of the DayByDay couple application — a private two-user web app with meeting countdown, shared calendar, digital diary, and photo gallery. The monorepo uses Strapi 5 (backend) and Next.js 14 with TypeScript strict mode (frontend), styled in an all-pink theme. Tasks are ordered to build foundational scaffolding first, then layer features incrementally with each step integrating into the prior work.

## Tasks

- [x] 1. Project scaffolding and configuration
  - [x] 1.1 Initialize backend Strapi 5 project with PostgreSQL and Cloudinary
    - Create `backend/` directory with Strapi 5 project
    - Configure `backend/config/database.ts` for PostgreSQL connection via `DATABASE_URL`
    - Configure `backend/config/plugins.ts` with Cloudinary upload provider
    - Configure `backend/config/server.ts` and `backend/config/middlewares.ts` with CORS for frontend origin
    - Create `backend/.env.example` with all required environment variables (DATABASE_URL, CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET, APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET, JWT_SECRET)
    - _Requirements: 8.1, 8.5, 8.6, 8.7_

  - [x] 1.2 Initialize frontend Next.js 14 project with TypeScript strict mode
    - Create `frontend/` directory with Next.js 14 App Router project
    - Configure `tsconfig.json` with `strict: true`
    - Install dependencies: tailwindcss, framer-motion, @fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/interaction, js-cookie
    - Configure `frontend/tailwind.config.ts` with pink theme colors (50-950 shades, background, foreground, accent, muted)
    - Create `frontend/app/globals.css` with Tailwind directives and base pink styles
    - Create `frontend/.env.example` with NEXT_PUBLIC_STRAPI_URL and STRAPI_API_TOKEN placeholders
    - Set up route group structure: `app/(auth)/` and `app/(protected)/`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7, 7.1, 7.2_

  - [x] 1.3 Create shared TypeScript types and API client utility
    - Create `frontend/types/index.ts` with all interfaces: MeetingDate, CalendarAnnotation, DiaryEntry, Photo, Album, User, LoginResponse, ApiResponse<T>
    - Create `frontend/lib/api.ts` with base fetch wrapper that attaches JWT from cookies and handles errors
    - Create `frontend/lib/utils.ts` with common utility functions (date formatting, startOfDay)
    - _Requirements: 8.3, 8.8_

- [x] 2. Authentication system
  - [x] 2.1 Implement Strapi user seeding (bootstrap lifecycle)
    - Create `backend/src/index.ts` with bootstrap function that seeds two users (user1@daybyday.app / SecurePass1!, user2@daybyday.app / SecurePass2!) if no users exist
    - Extend User content type with fields: diaryPin (string, nullable), pinFailedAttempts (integer, default 0), pinLockedUntil (datetime, nullable), avatar (media), displayName (string)
    - _Requirements: 1.4, 1.8_

  - [x] 2.2 Implement login page and auth server actions
    - Create `frontend/actions/auth.actions.ts` with `login(identifier, password)` server action that POSTs to Strapi `/api/auth/local` and sets JWT in HTTP-only cookie
    - Create `logout()` server action that clears the JWT cookie and redirects to `/login`
    - Create `frontend/app/(auth)/login/page.tsx` with identifier + password form, error display, pink-themed styling
    - Create `frontend/app/(auth)/layout.tsx` with centered layout and pink gradient background
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

  - [x] 2.3 Implement auth guard and protected layout
    - Create `frontend/lib/auth.ts` with `getAuthToken()` and `requireAuth()` helper functions
    - Create `frontend/app/(protected)/layout.tsx` that calls `requireAuth()` and renders Navigation + page content
    - Create `frontend/components/Navigation.tsx` with bottom nav bar (Home, Calendar, Diary, Gallery, Settings) in pink theme
    - Verify unauthenticated access to any protected route redirects to `/login`
    - _Requirements: 1.5, 1.7, 7.3, 7.4_

  - [ ]* 2.4 Write property tests for authentication
    - **Property 3: Protected route access control** — For any route in protected group, absence of JWT always redirects to login
    - **Property 4: Invalid credentials always rejected** — Any credentials not matching pre-seeded accounts never produce a JWT
    - **Validates: Requirements 1.3, 1.7**

- [x] 3. Checkpoint - Ensure authentication flow works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Pink theme and component library
  - [x] 4.1 Create pink-themed reusable components
    - Create `frontend/components/PinkButton.tsx` with variants (primary, secondary, ghost) using pink color palette
    - Create `frontend/components/PinkCard.tsx` with subtle pink border/shadow and white background
    - Create `frontend/components/PageTransition.tsx` with Framer Motion fade + slide animation
    - Create `frontend/components/Toast.tsx` for pink-themed error/success notifications
    - Apply pink theme globally: body background white, text foreground (pink-900), accent elements (pink-500)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5. Meeting date configuration and home screen countdown
  - [x] 5.1 Create meeting-date content type and API in Strapi
    - Create `backend/src/api/meeting-date/` content type with schema (date, startDate, setBy relation to User)
    - Configure routes and controllers for CRUD operations
    - Set permissions so authenticated role can create, read, and update meeting dates
    - _Requirements: 9.1, 9.2_

  - [x] 5.2 Implement meeting date settings page
    - Create `frontend/actions/meeting.actions.ts` with `setMeetingDate(date)` and `getMeetingDate()` server actions
    - Create `frontend/app/(protected)/settings/page.tsx` with date picker for setting/updating meeting date
    - Both users can update the date; the latest set date is the active meeting date
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 5.3 Implement countdown utility functions
    - Create `frontend/lib/countdown.ts` with `calculateDaysRemaining(meetingDate, currentDate)` and `calculatePhotoPosition(startDate, meetingDate, currentDate)` functions
    - Implement `startOfDay()` and `daysBetween()` helpers
    - Countdown returns ceiling of day difference, minimum 0
    - Photo position returns value in [0, 1] range proportional to elapsed days
    - _Requirements: 2.1, 2.3_

  - [ ]* 5.4 Write property tests for countdown calculations
    - **Property 1: Countdown days remaining is non-negative and proportional to date difference** — For any future meeting date, result equals ceil of day difference and is never negative
    - **Property 2: Photo position bounded between 0 and 1** — For any valid date triplet (start <= current, start <= meeting), result is in [0, 1]
    - **Validates: Requirements 2.1, 2.3**

  - [x] 5.5 Implement home screen with photo animation and confetti
    - Create `frontend/app/(protected)/home/page.tsx` displaying days remaining, two photos, and prompt if no meeting date set
    - Create `frontend/components/CountdownDisplay.tsx` showing the numeric countdown
    - Create `frontend/components/PhotoAnimation.tsx` with Framer Motion: two photos positioned based on `calculatePhotoPosition()` output, animating toward center
    - Create `frontend/components/ConfettiEffect.tsx` that triggers confetti + heart animation when countdown reaches 0
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 5.6 Write property test for meeting date shared accessibility
    - **Property 16: Meeting date shared accessibility** — Any meeting date set by either user is retrievable by the other user with the same value
    - **Validates: Requirements 9.2**

- [x] 6. Checkpoint - Ensure countdown and meeting date work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Shared calendar
  - [x] 7.1 Create calendar-annotation content type in Strapi
    - Create `backend/src/api/calendar-annotation/` content type with schema (date, completed boolean, emojis JSON string, user relation)
    - Configure routes for CRUD with filters by date range
    - Set permissions for authenticated role
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 7.2 Implement calendar server actions and page
    - Create `frontend/actions/calendar.actions.ts` with `markDate()`, `addEmoji()`, `getAnnotations(month, year)`, `getMonthSummary(month, year)` server actions
    - Create `frontend/app/(protected)/calendar/page.tsx` with FullCalendar monthly view
    - Render crossed-out dates for completed days, emoji badges on annotated dates
    - Highlight anniversary dates with pink badge, meeting dates in deep pink
    - Implement month navigation showing monthly memories summary for past months
    - Tapping a past date opens marking/emoji annotation modal
    - Both users' annotations visible on the same view
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 7.3 Write property tests for calendar
    - **Property 5: Calendar annotation round-trip persistence** — Any annotation created/updated is retrievable with matching date, emojis, and completion status
    - **Property 6: Calendar merges both users' annotations** — Both users' annotations appear in the same month query
    - **Property 7: Monthly memories summary completeness** — Summary contains exactly all annotations for the queried month
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.8**

- [ ] 8. Digital diary with PIN lock
  - [ ] 8.1 Create diary-entry content type in Strapi
    - Create `backend/src/api/diary-entry/` content type with schema (date, content richtext, mood string, weather string, images media multiple, voiceNote media single, user relation)
    - Configure routes for CRUD with filters by user and keyword search ($containsi)
    - Set permissions for authenticated role
    - _Requirements: 4.1, 4.9_

  - [ ] 8.2 Implement PIN validation custom controller in Strapi
    - Create `backend/src/api/pin/` with custom routes: POST `/api/pin/validate` and PUT `/api/pin/set`
    - Implement bcrypt hash comparison for PIN validation
    - Implement lockout logic: increment pinFailedAttempts on failure, set pinLockedUntil after 3 failures, reset on success
    - Hash new PIN with bcrypt before storage
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

  - [ ] 8.3 Implement PIN gate component and server actions
    - Create `frontend/actions/pin.actions.ts` with `validatePin(pin)`, `setPin(pin, currentPin?)`, `checkLockout()` server actions
    - Create `frontend/components/PinGate.tsx` with 4-digit input, lockout countdown display, and error messages
    - Create `frontend/lib/pin.ts` with `isLocked()` and `processPinAttempt()` client-side state logic
    - If user has no PIN set, redirect to PIN setup on first diary access
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 8.4 Write property tests for PIN lockout
    - **Property 11: PIN lockout after three consecutive failures** — Three wrong PINs in sequence triggers lockout, rejecting further attempts for 30 seconds
    - **Property 12: PIN hash validation round-trip** — Hashing then validating the same PIN returns true; any different PIN returns false
    - **Validates: Requirements 5.3, 5.6**

  - [ ] 8.5 Implement diary entry page with multimedia support
    - Create `frontend/actions/diary.actions.ts` with `createEntry()`, `updateEntry()`, `searchEntries(keyword)`, `getEntries()` server actions
    - Create `frontend/app/(protected)/diary/page.tsx` with PIN gate, entry list in reverse chronological order, and search bar
    - Create `frontend/app/(protected)/diary/[date]/page.tsx` with entry form: text area, MoodSelector, WeatherSelector, image upload, voice note recorder
    - Create `frontend/components/MoodSelector.tsx` with 5+ mood emoji options
    - Create `frontend/components/WeatherSelector.tsx` with weather condition emoji options
    - Implement Cloudinary image and voice note upload via Strapi media endpoint
    - Create `frontend/lib/diary-search.ts` with `searchDiaryEntries()` and `sortEntriesDescending()` utility functions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 8.6 Write property tests for diary search and sorting
    - **Property 8: Diary search returns all and only matching entries** — For any keyword, result contains exactly entries with case-insensitive substring match
    - **Property 9: Diary entries sorted in reverse chronological order** — For all consecutive pairs, date[i] >= date[i+1]
    - **Property 10: Diary entry ownership invariant** — Created entry always has correct user ID and date
    - **Validates: Requirements 4.7, 4.8, 4.9**

- [ ] 9. Checkpoint - Ensure diary and PIN lock work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Photo gallery
  - [ ] 10.1 Create photo and album content types in Strapi
    - Create `backend/src/api/photo/` content type with schema (image media, uploadDate, eventTag nullable string, user relation)
    - Create `backend/src/api/album/` content type with schema (name string, photos relation to Photo many)
    - Configure routes and permissions for authenticated role
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 10.2 Implement gallery server actions and page
    - Create `frontend/actions/gallery.actions.ts` with `uploadPhoto()`, `uploadBatch()`, `createAlbum()`, `getPhotos()`, `getAlbums()` server actions
    - Create `frontend/app/(protected)/gallery/page.tsx` with responsive photo grid grouped by month (section headers showing month/year)
    - Create `frontend/lib/gallery.ts` with `groupPhotosByMonth()` utility function
    - Implement batch upload (multiple file selection in single operation)
    - Show photos from both users in the same organized view
    - Support custom event album creation with user-defined name
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7_

  - [ ] 10.3 Implement lightbox component
    - Create `frontend/components/Lightbox.tsx` with full-screen photo viewer, navigation arrows, close button
    - Integrate into gallery page: tapping a photo opens lightbox
    - Use Framer Motion for lightbox enter/exit transitions
    - _Requirements: 6.5, 7.5_

  - [ ]* 10.4 Write property tests for gallery
    - **Property 13: Gallery photos grouped by month** — Every photo in a group has upload date within that group's month/year, no photo omitted or duplicated
    - **Property 14: Gallery merges both users' photos** — All photos from both users appear without omission
    - **Property 15: Batch upload count invariant** — N files submitted produces exactly N photo records with valid URLs
    - **Validates: Requirements 6.1, 6.6, 6.7**

- [ ] 11. Final integration and polish
  - [ ] 11.1 Wire all navigation and page transitions together
    - Ensure Navigation component links to all protected routes (home, calendar, diary, gallery, settings)
    - Apply `PageTransition` wrapper to all page components for Framer Motion transitions
    - Verify logout button in navigation clears JWT and redirects
    - Confirm expired meeting dates show prompt to set new date
    - _Requirements: 7.5, 1.6, 9.3_

  - [ ] 11.2 Create root page redirect and error handling
    - Create `frontend/app/page.tsx` that redirects to `/home` if authenticated or `/login` if not
    - Implement global error boundary with pink-themed error display
    - Ensure all server actions return `{ success, error?, data? }` pattern consistently
    - _Requirements: 1.7, 8.2_

  - [ ]* 11.3 Write integration tests for end-to-end flows
    - Test login → JWT stored → protected route accessible
    - Test diary PIN gate → entry creation → search returns entry
    - Test photo upload → gallery displays photo in correct month group
    - Test meeting date set by user1 → visible to user2
    - _Requirements: 1.2, 1.7, 4.7, 6.3, 9.2_

- [ ] 12. Final checkpoint - Ensure all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between major feature areas
- Property tests validate universal correctness properties from the design document (16 total)
- Unit tests validate specific examples and edge cases
- The implementation language is TypeScript throughout (Next.js frontend + Strapi backend)
- All mutations use Next.js server actions per Requirement 8.8
- The pink theme (Requirement 7) is established early and applied across all subsequent components

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.1"] },
    { "id": 3, "tasks": ["2.4", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4", "5.5", "7.1"] },
    { "id": 6, "tasks": ["5.6", "7.2", "8.1"] },
    { "id": 7, "tasks": ["7.3", "8.2"] },
    { "id": 8, "tasks": ["8.3", "8.5"] },
    { "id": 9, "tasks": ["8.4", "8.6", "10.1"] },
    { "id": 10, "tasks": ["10.2"] },
    { "id": 11, "tasks": ["10.3", "10.4"] },
    { "id": 12, "tasks": ["11.1", "11.2"] },
    { "id": 13, "tasks": ["11.3"] }
  ]
}
```
