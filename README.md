# Material Request Tracker

A production-grade Material Request Tracker for construction projects built with React, TypeScript, Supabase, and TanStack.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/anirban12d/material-tracker&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&envDescription=Supabase%20credentials%20required&envLink=https://supabase.com/dashboard/project/_/settings/api)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/anirban12d/material-tracker)


## Features

- **Authentication**: Secure user authentication with Supabase Auth
- **Multi-tenancy**: Row Level Security (RLS) ensures users only see data from their company
- **Material Request CRUD**: Create, read, update, and delete material requests
- **Status Management**: Workflow-based status transitions (pending → approved/rejected → fulfilled)
- **Optimistic Updates**: Instant UI feedback with React Query optimistic updates
- **Filtering & Search**: Filter by status, priority, and search by material name
- **Export**: Export data to CSV or Excel formats
- **Responsive Design**: Mobile-friendly UI with shadcn/ui components

## Tech Stack

- **Framework**: [React 18+](https://react.dev/) with [TanStack Start](https://tanstack.com/start)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query) (React Query)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **Tables**: [TanStack Table](https://tanstack.com/table)
- **Forms**: react-hook-form + zod validation
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## Project Structure

```
src/
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Layout components (AppLayout, Header, PageHeader)
│   └── common/                 # Shared components (StatusBadge, PriorityBadge)
├── features/
│   ├── auth/                   # Authentication feature
│   │   ├── components/         # LoginForm, SignupForm, AuthGuard
│   │   ├── context/            # AuthProvider
│   │   └── hooks/              # useAuth
│   ├── material-requests/      # Material Requests feature
│   │   ├── components/
│   │   │   ├── table/          # Table, TableColumns, TablePagination, TableSkeleton
│   │   │   ├── form/           # MaterialRequestForm
│   │   │   └── common/         # StatusUpdateDropdown, Filters
│   │   ├── hooks/              # CRUD hooks with optimistic updates
│   │   ├── types/              # TypeScript types & Zod schemas
│   │   └── constants/          # Status, Priority, Unit options
│   └── export-feature/         # Export functionality
│       ├── components/         # ExportButton, ExportDialog
│       ├── hooks/              # useExportData
│       ├── types/              # Export types
│       └── utils/              # CSV/Excel export utilities
├── hooks/                      # Shared hooks (useDebounce)
├── lib/
│   ├── supabase/               # Supabase client & database types
│   └── errors/                 # Error handling utilities
├── routes/                     # TanStack Router file-based routes
│   ├── material-requests/      # Protected routes
│   ├── login.tsx
│   └── signup.tsx
└── integrations/               # TanStack Query setup
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account

### 1. Clone and Install

```bash
git clone <repository-url>
cd material-tracker
pnpm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)

2. Go to **SQL Editor** and run the migration script:

   ```bash
   # Copy contents from:
   supabase/migration.sql
   ```

   This creates all required tables, indexes, RLS policies, and triggers.

3. **(Optional) Seed the Database**

   After creating an account in the app, you can populate the database with 50 sample material requests for testing:
   1. First, sign up for an account in the app (this creates your user and company)
   2. Go to **SQL Editor** in Supabase and run:
      ```bash
      # Copy contents from:
      supabase/seed.sql
      ```

   This will create:
   - 3 sample projects (Highway Bridge, Commercial Building, Residential Complex)
   - 50 material requests across various categories (concrete, steel, aggregates, bricks, timber, waterproofing, pipes, electrical, finishing materials)
   - Realistic data with different statuses, priorities, and dates

4. Go to **Project Settings > API** and copy:
   - Project URL
   - anon/public key

### 3. Environment Variables

Create a `.env` file (or `.env.local`):

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 5. Build for Production

```bash
pnpm build
pnpm preview  # Preview production build locally
```

## Database Schema

### Tables

| Table               | Description                        |
| ------------------- | ---------------------------------- |
| `companies`         | Multi-tenant company records       |
| `profiles`          | User profiles (extends auth.users) |
| `projects`          | Projects within a company          |
| `material_requests` | Main material request records      |

### Material Request Fields

| Field         | Type      | Description                                              |
| ------------- | --------- | -------------------------------------------------------- |
| id            | UUID      | Primary key                                              |
| project_id    | UUID      | Optional project reference                               |
| material_name | text      | Name of the material                                     |
| quantity      | numeric   | Amount needed                                            |
| unit          | text      | kg, m, pieces, liters, tons, cubic_meters, square_meters |
| status        | text      | pending, approved, rejected, fulfilled                   |
| priority      | text      | low, medium, high, urgent                                |
| requested_by  | UUID      | User who created the request                             |
| requested_at  | timestamp | When the request was created                             |
| notes         | text      | Optional notes                                           |
| company_id    | UUID      | Company for multi-tenancy                                |

### Row Level Security

All tables have RLS enabled. Users can only:

- View/create/update material requests within their company
- Delete their own material requests
- View their own profile and company

## Key Implementation Details

### Custom Hooks Pattern

Each data operation has its own hook with optimistic updates:

```typescript
// hooks/use-update-status.ts
export function useUpdateStatus() {
  return useMutation({
    mutationFn: updateStatus,
    onMutate: async ({ id, status }) => {
      // Cancel queries, snapshot, update optimistically
    },
    onError: (error, variables, context) => {
      // Rollback on error
    },
    onSettled: () => {
      // Invalidate and refetch
    },
  })
}
```

### Status Transitions

The app enforces valid status transitions:

```
pending → approved OR rejected
approved → fulfilled OR rejected
rejected → pending (resubmit)
fulfilled → (terminal state)
```

### Feature-Based Architecture

Code is organized by feature (domain) rather than by type:

- Each feature owns its components, hooks, types, and utilities
- Promotes co-location and maintainability
- Easy to understand and navigate

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm test         # Run tests
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier
pnpm check        # Format and lint
```

## Deployment

This is a static SPA that can be deployed to any static hosting service. Use the one-click deploy buttons at the top of this README, or follow the manual steps below.

### Vercel (Recommended)

Click the **Deploy with Vercel** button above, or:

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy (Vercel auto-detects Vite projects)

### Netlify

Click the **Deploy to Netlify** button above, or:

1. Push your code to GitHub
2. Import the repository in [Netlify](https://netlify.com)
3. Set build command: `pnpm build`
4. Set publish directory: `dist`
5. Add environment variables in Site Settings > Environment Variables
6. Deploy

### Manual Deployment

```bash
pnpm build
# Upload the `dist` folder to your hosting provider
```

## AI Tools Used

This project was developed with assistance from Claude (Anthropic), which was used for:

- Documentation writing
- Debugging and error resolution

## Approach & Decisions

1. **Feature-Based Architecture**: Chose feature-based organization over traditional MVC for better scalability and maintainability, following patterns used by companies like Vercel and Airbnb.

2. **TanStack Ecosystem**: Leveraged TanStack's cohesive suite (Router, Query, Table, Form) for type-safe, modern React development with excellent DX.

3. **Server-Side Pagination**: Implemented proper server-side pagination with URL state sync for bookmarkable/shareable filtered views. Uses Supabase's `.range()` with `count: "exact"` for efficient data fetching.

4. **Optimistic Updates**: Implemented optimistic updates for status changes to provide instant feedback, with automatic rollback on errors.

5. **Supabase RLS**: Used Row Level Security for multi-tenancy rather than application-level filtering, ensuring security at the database level.

6. **Export Feature**: Configurable CSV/Excel export with filters, date range, and record limit. Uses a separate feature module for clean separation of concerns.

7. **shadcn/ui**: Chose shadcn/ui for UI components as they're customizable, accessible, and integrate well with Tailwind CSS.

8. **Form Validation**: Used react-hook-form with zod for type-safe form validation with excellent performance.

## Future Improvement Scopes

- [ ] Real-time updates with Supabase subscriptions
- [ ] Project management features
- [ ] User role-based permissions (admin, manager, user)
- [ ] Dashboard with analytics and charts
- [ ] Email notifications for status changes
- [ ] AI-powered material suggestions based on project type
