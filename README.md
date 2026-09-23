# Study Buddy Pro

# MEGA PROMPT: MY STUDY COMPANION (SPRINT 1 MVP) — LOVABLE.DEV EXECUTION BLUEPRINT

> **Role & Execution Directive for Lovable.dev:**

> You are an elite Full-Stack Software Engineer, Principal UX/UI Architect, and Supabase Database Specialist. Your mission is to build **My Study Companion**, a production-grade, mobile-first web application designed to help students establish consistent study habits. Execute this complete specification accurately, ensuring modularity, type safety, responsiveness, performance, accessibility, and clean state handling.

> 

## 1. PRODUCT VISION & OVERVIEW

### Vision Statement

To help students build consistent study habits through a simple, motivating, and AI-assisted study companion that transforms studying into an enjoyable daily routine.

### Tagline

*"Build the Habit. Achieve the Dream."*

### Value Proposition

Existing apps focus strictly on logging study hours without encouraging habit formation, goal progression, or long-term consistency. **My Study Companion** eliminates friction with fast session tracking, real-time goal feedback, daily streak visualization, and immediate positive reinforcement.

### Target Users

 * Intermediate & High School Students

 * Undergraduate & Graduate Degree Students

 * Engineering & Technology Students

 * Competitive Exam Aspirants (EAPCET, JEE, NEET, UPSC, SSC, Banking, GRE, GATE, etc.)

 * Self-learners tracking certification goals or personal skill development

## 2. SPRINT 1 SCOPE & ROADMAP BOUNDARIES

### Sprint 1 Scope (Minimum Viable Product - MVP)

Build a fully interactive, mobile-first web app with:

 * Supabase Authentication & Profile Onboarding

 * Real-Time Active Study Session Engine with Persistence

 * Daily, Weekly, and Monthly Goal Tracking

 * Weekly Study Activity Heatmaps & Analytical Reports

 * Automated Notifications & Achievement Badge System

 * 24-Hour Soft-Delete Recovery (Session Restore)

 * Mobile-Optimized Dashboard & Fixed Bottom Navigation

### Out of Scope for Sprint 1 (Strictly Excluded)

 * Timetable & Timetable Reminders (Sprint 2)

 * Focus Mode & Session Notes (Sprint 2)

 * AI Insights & Smart Recommendations (Sprint 3)

 * Virtual Companion Interactive Animations & Leaderboards (Sprint 4)

> **UI Reservation Rule:** Sprint 1 **MUST** render a dedicated, beautifully styled placeholder card on the Dashboard explicitly reserved for the future Virtual Study Companion to avoid layout refactoring in Sprint 4.

> 

## 3. ARCHITECTURE, TECH STACK & SYSTEM CONSTRAINTS

 * **Target Platform:** Mobile-First Web Application (Fully responsive on Android Web, iOS Safari, Desktop).

 * **Frontend Framework:** React 18+ with Vite and TypeScript (Strict Mode enabled).

 * **Styling & UI:** Tailwind CSS, Shadcn/UI primitives, Lucide React icons, and Framer Motion for smooth micro-interactions.

 * **Backend & Auth:** Supabase (PostgreSQL, Supabase Auth, Row Level Security, Realtime subscriptions).

 * **State Management:** Zustand with persist middleware for atomic state updates and local fallback synchronization.

 * **Data Visualization:** Recharts (accessible, responsive charts and heatmaps).

 * **Date Manipulation:** date-fns or dayjs for reliable timezone and date calculations.

## 4. CODE QUALITY & ARCHITECTURE STANDARDS

 * **Clean Architecture:** Strictly separate UI presentation components, custom hooks for business logic, and backend service modules.

 * **TypeScript Integrity:** No implicit any. Define complete interfaces/types for all database schemas, API responses, and component props inside src/types/.

 * **SOLID Principles:** Single-responsibility components; DRY (Don't Repeat Yourself) database query helpers and calculation utilities.

 * **Component Design:** Modular, highly reusable Shadcn/UI primitives (Button, Card, Dialog, Progress, Tabs, Toast).

## 5. PROJECT STRUCTURE

Construct the workspace using the following production-ready folder hierarchy:

```text

src/

├── assets/             # Brand logos, default avatars, empty state graphics

├── components/         # Reusable React components

│   ├── ui/             # Shadcn/UI primitive design components

│   ├── common/         # BottomNav, Header, LoadingSpinner, ErrorBoundary

│   ├── dashboard/      # GoalCard, HeatmapCard, RecentSessionsCard, CompanionPlaceholderCard

│   ├── session/        # TimerDisplay, ActiveTimerControls, RestoreModal

│   ├── reports/        # AnalyticsBarChart, SubjectSummaryCards

│   └── profile/        # CancelledSessionsAccordion, GoalSettingsForm

├── database/           # Supabase SQL migrations, seed scripts, generated types

├── hooks/              # Custom React hooks (useAuth, useTimer, useGoals, useReports, useStreaks)

├── pages/              # Route level view containers

│   ├── SplashPage.tsx

│   ├── AuthPage.tsx

│   ├── OnboardingPage.tsx

│   ├── DashboardPage.tsx

│   ├── SessionPage.tsx

│   ├── ReportsPage.tsx

│   ├── NotificationsPage.tsx

│   └── ProfilePage.tsx

├── services/           # Supabase client, queries, mutations, auth APIs

├── types/              # Global TypeScript declarations (database, UI states, parameters)

└── utilities/          # Formatters (timeFormatters.ts), goalCalculators.ts, streakUtils.ts

```

## 6. DATABASE SCHEMA, MIGRATIONS & SECURITY (SUPABASE / POSTGRESQL)

Execute the following standard PostgreSQL schema. All tables must have Row Level Security (RLS) policies enforced so users can **ONLY** query and mutate their own records.

```sql

-- ENABLE EXTENSIONS

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE

CREATE TABLE public.profiles (

    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    full_name TEXT NOT NULL,

    email TEXT UNIQUE NOT NULL,

    mobile_number TEXT,

    avatar_url TEXT DEFAULT 'default_avatar.png',

    timezone TEXT DEFAULT 'UTC',

    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()

);

-- 2. STUDY_SESSIONS TABLE

CREATE TABLE public.study_sessions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    subject_name TEXT NOT NULL,

    start_time TIMESTAMP WITH TIMEZONE NOT NULL,

    end_time TIMESTAMP WITH TIMEZONE,

    duration_seconds INTEGER DEFAULT 0,

    paused_duration_seconds INTEGER DEFAULT 0,

    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),

    notes TEXT,

    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),

    cancelled_at TIMESTAMP WITH TIMEZONE,

    restored_at TIMESTAMP WITH TIMEZONE

);

-- 3. GOALS TABLE

CREATE TABLE public.goals (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    daily_goal_minutes INTEGER NOT NULL DEFAULT 120,

    weekly_goal_minutes INTEGER NOT NULL DEFAULT 840,

    monthly_goal_minutes INTEGER NOT NULL DEFAULT 3600,

    updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()

);

-- 4. STUDY_STREAKS TABLE

CREATE TABLE public.study_streaks (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    current_streak INTEGER DEFAULT 0,

    longest_streak INTEGER DEFAULT 0,

    last_study_date DATE,

    updated_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()

);

-- 5. ACHIEVEMENT_BADGES TABLE

CREATE TABLE public.achievement_badges (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    badge_key TEXT NOT NULL,

    badge_name TEXT NOT NULL,

    badge_level TEXT NOT NULL,

    unlocked_at TIMESTAMP WITH TIMEZONE DEFAULT NOW(),

    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_key)

);

-- 6. NOTIFICATIONS TABLE

CREATE TABLE public.notifications (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    notification_type TEXT NOT NULL,

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIMEZONE DEFAULT NOW()

);

-- INDEXES FOR PERFORMANCE

CREATE INDEX idx_study_sessions_user_status ON public.study_sessions(user_id, status);

CREATE INDEX idx_study_sessions_created ON public.study_sessions(user_id, created_at);

CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);

-- ROW LEVEL SECURITY POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.study_streaks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.achievement_badges ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS RULES (APPLY FOR ALL TABLES)

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own study_sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study_sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study_sessions" ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own streaks" ON public.study_streaks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update own streaks" ON public.study_streaks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own badges" ON public.achievement_badges FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON public.achievement_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

```

## 7. DETAILED BUSINESS LOGIC & SYSTEM ENGINES

### A. Authentication & Automated Profile Bootstrapping

 1. **Registration Flow:** Supports Email/Password or Phone Login via Supabase Auth.

 2. **Database Trigger or Hook:** Upon successful registration, automatically create standard default records in public.profiles, public.goals, and public.study_streaks.

 3. **Onboarding Guard:** If a user profile is missing full_name or initial goals, force redirect to /onboarding.

### B. Active Study Session Engine & State Persistence

 1. **Session Lifecycle:**

   * **Start:** Creates record with status = 'ACTIVE', start_time = NOW(). Store activeSessionId in local state.

   * **Pause:** Sets status = 'PAUSED'. Freezes ticking counter. Records timestamp to compute total paused_duration_seconds.

   * **Resume:** Sets status = 'ACTIVE'. Resumes timer counter.

   * **End:** Sets status = 'COMPLETED', records end_time = NOW(), computes duration_seconds = (end_time - start_time) - paused_duration_seconds. Triggers streak updates, goal updates, badge evaluation, and notification triggers.

   * **Cancel:** Asks for confirmation. Sets status = 'CANCELLED', sets cancelled_at = NOW().

 2. **Timer State Persistence:** To withstand web browser refreshes, tab closures, or app crashes:

   * Write active timer state (sessionId, subjectName, startTime, pausedSeconds, status, lastTickTime) to localStorage every 3 seconds.

   * On page mount, if localStorage contains an ACTIVE or PAUSED session state, reconstruct current elapsed time seamlessly and resume.

### C. 24-Hour Session Restoration (Soft-Delete Recovery)

 1. **Visibility:** Cancelled sessions created within the past 24 hours (NOW() - cancelled_at <= INTERVAL '24 hours') display in the Profile screen under "Recently Cancelled Sessions".

 2. **Restore Execution:**

   * Clicking **Restore** sets status back to its valid completed state (COMPLETED), sets restored_at = NOW().

   * Automatically re-triggers all dependent metrics: recalculates daily/weekly/monthly goals, re-evaluates streak counts for that date, checks badge rules, and refreshes report visualizers.

### D. Goal & Progress Calculation Engine

 * **Daily Goal %:** (\text{Sum of COMPLETED duration\_seconds today} / 60) / \text{daily\_goal\_minutes} \times 100.

 * **Weekly Goal %:** (\text{Sum of COMPLETED duration\_seconds Monday-Sunday current week} / 60) / \text{weekly\_goal\_minutes} \times 100.

 * **Monthly Goal %:** (\text{Sum of COMPLETED duration\_seconds current calendar month} / 60) / \text{monthly\_goal\_minutes} \times 100.

 * Progress bars visually clip at 100%, but textual feedback displays actual percentage (e.g., "125% Completed!").

### E. Streak Calculation Rules

 1. A calendar date is qualifying if total completed study time on that date is \ge 1 minute.

 2. When a qualifying session ends:

   * If last_study_date was yesterday, current_streak = current_streak + 1.

   * If last_study_date was today, current_streak remains unchanged.

   * If last_study_date was prior to yesterday, current_streak = 1.

 3. Set longest_streak = GREATEST(current_streak, longest_streak). Update last_study_date = CURRENT_DATE.

### F. Automated Badge & Notification Logic

 * **First Step Badge (first_step):** Triggers on the completion of user's 1st study session.

 * **Consistency Master Badge (consistency_master):** Triggers when current_streak >= 7.

 * **Goal Crusher Badge (goal_crusher):** Triggers when daily study target reaches \ge 100\%.

 * When triggered, create a row in achievement_badges, generate a record in notifications, and display an animated Toast component.

## 8. UI/UX GUIDELINES, COLOR PALETTE & BRANDING SPECIFICATIONS

### Visual Branding & Logo

 * **Logo Elements:** Student + AI Robot + Shared Open Book + Shining Star.

 * **Placement:** Centered on Splash screen; left-aligned in Top Navigation Header across main screens.

### Design Tokens & Color System (Dark Theme First)

 * **Primary Accent:** Electric Blue (#0066FF / #1A73E8)

 * **App Background:** Deep Off-Black (#0D0E12)

 * **Card & Surface BG:** Dark Slate (#1E2028 / #252836)

 * **Primary Text:** Crisp White (#FFFFFF)

 * **Secondary Text:** Slate Gray (#94A3B8)

 * **Success / Streak:** Emerald Green (#10B981)

 * **Warning / Alert:** Amber Gold (#F59E0B)

 * **Destructive / Cancel:** Crimson Red (#EF4444)

### Layout Principles

 * **Mobile-First:** Container restricted max-width max-w-md centered on desktop screens for native mobile app feel.

 * **Touch Optimization:** Touch targets, buttons, and bottom nav tabs must have a minimum height/width of 48px.

## 9. SCREEN-BY-SCREEN REQUIREMENTS & UI LAYOUT

### 1. Splash Screen (/splash)

 * Centered App Logo, Title, Tagline ("Build the Habit. Achieve the Dream."), and a sleek animated loading bar. Auto-routes to /dashboard if authenticated, or /auth if unauthenticated.

### 2. Auth & Onboarding (/auth & /onboarding)

 * Form tabs for Login / Sign Up. Input fields for Email/Phone and Password with instant validation.

 * Onboarding Step-Modal: Prompts user for Full Name, Avatar Icon selection, and target goal inputs (Daily hrs, Weekly hrs, Monthly hrs).

### 3. Mobile-First Dashboard (/dashboard)

Vertical stacked card system:

 1. **Top Bar Card:** User Avatar, "Welcome back, [Name]!", Bell icon with unread indicator badge.

 2. **Virtual Companion Reservation Card:** Styled card container with gradient background: *"Virtual Study Companion arriving in Sprint 4"*.

 3. **Today's Overview Card:** Displays formatted total time studied today (e.g., 2h 15m) and Streak Badge (🔥 5 Days Streak).

 4. **Goal Progress Card:** 3 progress bars showing percentage completion for Daily, Weekly, and Monthly targets.

 5. **Weekly Activity Heatmap Card:** 7-day visual activity squares colored by intensity level.

 6. **Recent Sessions Card:** Last 3 completed study sessions with subject name, timestamp, and duration.

 7. **Floating CTA Button:** Fixed "Start Study Session" button pinned bottom-center above bottom nav.

### 4. Active Study Session Screen (/session)

 * Subject selector with quick-select history chips or custom text input.

 * Large digital stopwatch display (00:00:00).

 * Dynamic control buttons: Start, Pause, Resume, End Session, and Cancel Session (triggers confirmation dialog detailing 24h restore ability).

### 5. Reports & Analytics Screen (/reports)

 * Time Filter Tabs: Daily | Weekly | Monthly.

 * Total study time stat callout card.

 * Recharts Bar/Pie Chart illustrating subject distribution.

 * Insight Summary Cards: **Most Studied Subject** and **Recommended Focus Subject** (least studied).

### 6. Notifications Screen (/notifications)

 * List view of system alerts (Goal achievements, Badge unlocks, Streak updates).

 * "Mark All as Read" header button.

### 7. Profile Screen (/profile)

 * Editable Profile Details & Avatar picker.

 * Goal adjustment inputs (Update daily/weekly/monthly targets).

 * **"Recently Cancelled Sessions" Accordion:** Displays sessions cancelled within the last 24 hours with a functional "Restore" button.

 * Logout button.

### Bottom Navigation Bar (Fixed)

Fixed 5-item mobile bottom navigation bar present on all primary views:

 1. Dashboard (/dashboard)

 2. Timer (/session)

 3. Reports (/reports)

 4. Notifications (/notifications)

 5. Profile (/profile)

## 10. ERROR HANDLING & USER FEEDBACK REQUIREMENTS

 * **State Handling:** Every user-initiated operation (Sign in, Start session, End session, Restore, Goal update) must explicitly manage loading, success, and error states.

 * **Network Failures:** Show clear toast notices when Supabase connection drops, auto-retrying mutations where appropriate.

 * **Form Validation:** Validate input fields in real time (e.g., prevent non-numeric inputs for goal minutes or blank subject names).

## 11. STRICT DEVELOPMENT CONSTRAINTS (WHAT YOU MUST NEVER DO)

 1. **NEVER** alter or redesign the core product vision or target user definition.

 2. **NEVER** shift features from Sprints 2, 3, or 4 (e.g., Timetables, AI Insights, Gamified Companion) into Sprint 1.

 3. **NEVER** remove or combine screens; maintain strict navigation separating Dashboard, Active Timer, Reports, Notifications, and Profile.

 4. **NEVER** break mobile-first responsiveness. Do not use fixed pixel layouts that overflow mobile viewports.

 5. **NEVER** discard the cards-based layout design on the Dashboard.

 6. **NEVER** remove the dedicated visual reservation card slot on the Dashboard reserved for the Virtual Study Companion.

 7. **NEVER** purge cancelled sessions immediately; enforce the 24-hour restore window requirement.

 8. **NEVER** use dark text on dark backgrounds or compromise WCAG AA contrast standards.

## 12. ACCEPTANCE CRITERIA FOR SPRINT 1 COMPLETION

 * [x] Users can successfully register, log in, and complete setup.

 * [x] Active study sessions accurately track start, pause, resume, end, and cancel states.

 * [x] Cancelled sessions can be restored within 24 hours, correctly updating streaks, goals, badges, and analytics.

 * [x] Daily, Weekly, and Monthly goal progress bars compute and display accurate percentage metrics.

 * [x] Heatmaps and reports accurately highlight Most Studied and Least Studied subjects.

 * [x] Dashboard cards display real-time persistent data stored securely in Supabase.

 * [x] Mobile UI navigation is fully functional, touch-friendly, and responsive across viewports.

 * [x] All database tables have Row Level Security (RLS) enabled and enforce single-user access rules.

 * [x] Active study session state persists seamlessly across browser reloads or accidental app closures.

## 13. GENERAL EXECUTION DIRECTIVE

If any implementation detail is not explicitly specified, make the most maintainable engineering decision while preserving the product vision, Sprint scope, and user experience. Never change functionality without a valid technical reason.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://my-study-companion-2147.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/68946722-e927-4f33-8260-a49a4dcdfb22).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
