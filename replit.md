# Adams Junior Academy - School Management System

## Overview
A full-featured school management web application for Adams Junior Academy. Built with React + Vite + TypeScript on the frontend, using Supabase as the backend (auth, database, storage, edge functions).

## Architecture
- **Frontend**: React 18, TypeScript, Vite (port 5000)
- **UI**: Tailwind CSS, shadcn/ui components, Radix UI primitives
- **Routing**: React Router v6
- **State/Data**: TanStack React Query + Supabase client
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Forms**: React Hook Form + Zod validation

## Key Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key

## Project Structure
```
src/
  App.tsx              # Routes and app shell
  main.tsx             # Entry point
  contexts/
    AuthContext.tsx    # Auth state + role management
  integrations/
    supabase/
      client.ts        # Supabase client init
      types.ts         # Auto-generated DB types
  pages/
    Index.tsx          # Homepage
    Login.tsx, Register.tsx, ResetPassword.tsx
    dashboard/         # All dashboard pages (role-gated)
  components/
    ui/                # shadcn/ui components
    ProtectedRoute.tsx # Auth + role guard
    Navbar.tsx, Footer.tsx, etc.
  layouts/
    PublicLayout.tsx   # Public pages layout
    DashboardLayout.tsx # Dashboard shell
  hooks/               # Custom hooks
  lib/                 # Utilities
supabase/
  migrations/          # All DB migrations (applied to Supabase)
  functions/           # Edge Functions (create-admin, create-student)
```

## User Roles
- **student** — default role, can view courses, submit assignments, take quizzes
- **teacher** — can create courses/quizzes/assignments, manage attendance, send notifications
- **admin** — full access, user management, finance, site editor, announcements

## Running the App
```bash
npm run dev   # starts Vite dev server on port 5000
npm run build # production build -> dist/
```

## Deployment
Static site deployment. Build output goes to `dist/`. Environment variables must be set as secrets in Replit.

## Supabase Schema
The database has these main tables (managed via Supabase migrations):
- `profiles` — user profiles linked to auth.users
- `user_roles` — role assignments (student/teacher/admin)
- `courses`, `lessons`, `enrollments`, `lesson_progress`
- `quizzes`, `quiz_questions`, `quiz_attempts`, `quiz_feedback`
- `assignments`, `assignment_submissions`
- `classes`, `class_enrollments`, `attendance`
- `announcements`, `notifications`, `notification_recipients`
- `fee_structures`, `student_fees`, `fee_payments`
- `newsletter_subscribers`, `parent_contacts`
- `site_content` — CMS for homepage content
