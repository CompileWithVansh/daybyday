# Requirements Document

## Introduction

DayByDay is a private couple web application designed exclusively for two users. It serves as a relationship companion featuring a meeting countdown with animated photos, a shared calendar with emoji annotations, a digital diary with multimedia attachments, and a photo gallery. The application uses a pink-themed UI built with Next.js 14, React 18, TypeScript, and Tailwind CSS on the frontend, backed by Strapi 5 with PostgreSQL and Cloudinary for media storage. Authentication is handled via two pre-seeded accounts with no registration flow.

## Glossary

- **App**: The DayByDay couple web application system
- **User**: One of the two pre-seeded authenticated individuals using the application
- **Partner**: The other authenticated user in the couple relationship
- **Meeting_Date**: A future calendar date when both users plan to meet in person
- **Home_Screen**: The landing page displaying the countdown timer and photo animation
- **Shared_Calendar**: The calendar module where both users can annotate and view dates
- **Digital_Diary**: The private journal module with daily entries and multimedia support
- **Gallery**: The photo organization module categorized by month or event
- **Mood_Selector**: A UI component allowing the user to select an emoji representing their current mood
- **PIN_Lock**: A 4-digit numeric code protecting access to the Digital Diary
- **Cloudinary**: Third-party cloud service used for image and media file storage
- **Strapi_Backend**: The Strapi 5 headless CMS providing REST API endpoints
- **JWT**: JSON Web Token used for authenticating API requests
- **FullCalendar**: Third-party calendar library used to render the Shared Calendar

## Requirements

### Requirement 1: Fixed Two-User Authentication

**User Story:** As a user, I want to log in with my pre-assigned credentials, so that I can access the private couple application without a registration process.

#### Acceptance Criteria

1. THE App SHALL provide a login page accepting an identifier (email or username) and password.
2. WHEN a user submits valid credentials, THE Strapi_Backend SHALL return a JWT and user profile data.
3. WHEN a user submits invalid credentials, THE App SHALL display an error message indicating authentication failure.
4. THE Strapi_Backend SHALL contain exactly two pre-seeded user accounts configured via database seed script.
5. THE App SHALL store the JWT in an HTTP-only cookie or secure client-side storage for subsequent authenticated requests.
6. WHEN a user clicks the logout button, THE App SHALL clear the stored JWT and redirect the user to the login page.
7. THE App SHALL restrict access to all authenticated routes by redirecting unauthenticated users to the login page.
8. THE App SHALL NOT provide any user registration functionality.

### Requirement 2: Home Screen with Meeting Countdown

**User Story:** As a user, I want to see a countdown to our next meeting with an animated visual of our photos moving closer, so that I feel the anticipation of our reunion.

#### Acceptance Criteria

1. THE Home_Screen SHALL display the number of days remaining until the next Meeting_Date.
2. THE Home_Screen SHALL display two user photos positioned on opposite sides of the screen.
3. WHILE days remain until the Meeting_Date, THE Home_Screen SHALL animate the two photos closer together proportionally to the elapsed days since the countdown started.
4. WHEN the Meeting_Date countdown reaches zero, THE Home_Screen SHALL display both photos meeting in the center with a heart animation.
5. WHEN the Meeting_Date countdown reaches zero, THE Home_Screen SHALL trigger a confetti animation effect.
6. WHEN no future Meeting_Date is configured, THE Home_Screen SHALL display a message prompting the user to set a meeting date.
7. THE Home_Screen SHALL use Framer Motion for all photo movement and celebration animations.

### Requirement 3: Shared Calendar — Day Marking and Emoji Annotation

**User Story:** As a user, I want to mark completed days and add emojis to dates on our shared calendar, so that we can visually track our journey together.

#### Acceptance Criteria

1. THE Shared_Calendar SHALL render a monthly calendar view using FullCalendar.
2. WHEN a user taps a past date, THE Shared_Calendar SHALL allow the user to mark that date as completed with a visual cross-out indicator.
3. WHEN a user selects a date, THE Shared_Calendar SHALL allow the user to attach one or more emojis to that date.
4. THE Shared_Calendar SHALL persist all date markings and emoji annotations to the Strapi_Backend.
5. THE Shared_Calendar SHALL display annotations made by both users on the same calendar view.
6. THE Shared_Calendar SHALL highlight anniversary dates with a distinct visual style (pink badge).
7. THE Shared_Calendar SHALL render Meeting_Date entries in a different color (deep pink) from regular dates.
8. WHEN a user navigates to a past month, THE Shared_Calendar SHALL display a monthly memories summary showing all annotations and marked days for that month.

### Requirement 4: Digital Diary — Daily Journal Entry

**User Story:** As a user, I want to write daily journal entries with mood, weather, images, and voice notes, so that I can preserve my feelings and memories privately.

#### Acceptance Criteria

1. THE Digital_Diary SHALL provide a daily journal entry form with a text area for free-form writing.
2. THE Digital_Diary SHALL include a Mood_Selector component offering at least 5 mood emoji options.
3. THE Digital_Diary SHALL include a weather selector allowing the user to choose current weather conditions via emoji or icon.
4. WHEN a user attaches an image to a diary entry, THE App SHALL upload the image to Cloudinary and store the returned URL in the diary entry record.
5. THE Digital_Diary SHALL allow the user to record and attach a voice note to a diary entry.
6. WHEN a user uploads a voice note, THE App SHALL upload the audio file to Cloudinary and store the returned URL in the diary entry record.
7. THE Digital_Diary SHALL provide a search function allowing the user to find past journal entries by keyword.
8. THE Digital_Diary SHALL display journal entries in reverse chronological order by default.
9. WHEN a user creates or edits a diary entry, THE Strapi_Backend SHALL associate the entry with the authenticated user and the entry date.

### Requirement 5: Digital Diary — PIN Lock Protection

**User Story:** As a user, I want to protect my diary with a PIN code, so that my private entries remain secure even if someone else accesses the device.

#### Acceptance Criteria

1. THE Digital_Diary SHALL prompt the user for a 4-digit PIN before granting access to diary entries.
2. WHEN the user enters the correct PIN, THE Digital_Diary SHALL grant access to all diary entries for the current session.
3. WHEN the user enters an incorrect PIN three consecutive times, THE Digital_Diary SHALL lock access for 30 seconds before allowing another attempt.
4. THE App SHALL allow each user to set and change their own diary PIN through a settings interface.
5. IF a user has not yet set a PIN, THEN THE App SHALL prompt the user to create a PIN on first diary access.
6. THE App SHALL store the PIN in hashed form on the Strapi_Backend and validate it server-side.

### Requirement 6: Photo Gallery

**User Story:** As a user, I want to upload and organize photos by month or event, so that we can revisit our shared memories in an organized way.

#### Acceptance Criteria

1. THE Gallery SHALL display photos organized by month with section headers showing month and year.
2. THE Gallery SHALL allow the user to create custom event albums with a user-defined name.
3. WHEN a user uploads a photo, THE App SHALL upload the image to Cloudinary and store the returned URL with metadata (upload date, uploader, optional event tag) in the Strapi_Backend.
4. THE Gallery SHALL display photos in a responsive grid layout.
5. WHEN a user taps a photo, THE Gallery SHALL display the photo in a full-screen lightbox view.
6. THE Gallery SHALL show photos uploaded by both users in the same organized view.
7. THE Gallery SHALL support uploading multiple photos in a single batch operation.

### Requirement 7: Pink Theme and Visual Design

**User Story:** As a user, I want the entire application styled in shades of pink and white, so that the app feels romantic and personal.

#### Acceptance Criteria

1. THE App SHALL use a color palette consisting exclusively of pink shades (ranging from light blush to deep pink) and white.
2. THE App SHALL define the pink theme as Tailwind CSS custom colors in the tailwind configuration file.
3. THE App SHALL apply the pink theme consistently across all pages, components, and interactive states (hover, focus, active).
4. THE App SHALL use white as the primary background color with pink accents for interactive elements, headers, and highlights.
5. THE App SHALL use Framer Motion for all page transitions and micro-interactions.

### Requirement 8: Project Architecture and Tech Stack

**User Story:** As a developer, I want a well-structured monorepo with clearly separated frontend and backend, so that development and deployment remain organized.

#### Acceptance Criteria

1. THE App SHALL be structured as a monorepo with a `backend/` folder containing the Strapi 5 application and a `frontend/` folder containing the Next.js 14 application.
2. THE frontend SHALL use Next.js 14 App Router with route groups and server components by default.
3. THE frontend SHALL use TypeScript in strict mode for all source files.
4. THE frontend SHALL use Tailwind CSS for styling and Framer Motion for animations.
5. THE Strapi_Backend SHALL use PostgreSQL as the database.
6. THE Strapi_Backend SHALL use the Cloudinary upload provider for all media storage.
7. THE App SHALL include a `.env.example` file in both `backend/` and `frontend/` directories documenting all required environment variables with placeholder values and instructions for obtaining API keys (Strapi, Cloudinary, PostgreSQL connection).
8. THE frontend SHALL use server actions for all data mutation operations.

### Requirement 9: Meeting Date Configuration

**User Story:** As a user, I want to set and update the next meeting date, so that the countdown and calendar features reflect our plans.

#### Acceptance Criteria

1. THE App SHALL provide an interface for setting the next Meeting_Date with a date picker.
2. WHEN a user sets a new Meeting_Date, THE Strapi_Backend SHALL store the date and make it accessible to both users.
3. WHEN a Meeting_Date passes, THE App SHALL prompt the user to set a new Meeting_Date or allow the countdown to show zero.
4. THE App SHALL allow either user to update the Meeting_Date at any time.
