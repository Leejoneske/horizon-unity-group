# Horizon Unity Group

A comprehensive financial contribution management platform designed for organizations to track member contributions, manage group finances, and facilitate transparent community-based savings initiatives.

## Overview

Horizon Unity Group is a web-based application that enables administrators to manage member contributions, track payment histories, and maintain organized financial records for group-based financial systems. The platform supports user authentication, contribution tracking, and administrative oversight with a clean, modern interface.

## Features

- User Authentication: Secure login and registration system for both members and administrators
- Member Management: Add, edit, and manage member profiles with contact information
- Contribution Tracking: Record and monitor member contributions with detailed history
- Financial Dashboard: View contribution statistics and financial summaries
- Admin Dashboard: Comprehensive administrative control panel for oversight
- Message Center: Communication hub for group notifications and updates
- Responsive Design: Mobile-friendly interface that works across all devices

## Technologies

This project is built with:

- Frontend Framework: React 18.3 with TypeScript
- Build Tool: Vite 5.4
- UI Components: shadcn-ui with Radix UI
- Styling: Tailwind CSS 3.4
- State Management: TanStack React Query 5.83
- Form Handling: React Hook Form 7.61
- Backend/Database: Supabase
- Routing: React Router DOM 6.30
- Charts: Recharts 2.15
- Date Utilities: date-fns 3.6
- Testing: Vitest 3.2

## Project Structure

```
src/
  components/
    admin/              # Admin-specific components
    ui/                 # Reusable UI components
  pages/               # Route pages
  hooks/               # Custom React hooks
  lib/                 # Utilities and helpers
  integrations/        # Third-party service integrations (Supabase)
  assets/              # Static assets
  test/                # Test files
supabase/
  migrations/          # Database migration files
  functions/           # Serverless functions
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or Bun package manager
- Git

### Installation

1. Clone the repository:
```sh
git clone https://github.com/Leejoneske/horizon-unity-group.git
cd horizon-unity-group
```

2. Install dependencies:
```sh
npm install
# or using Bun
bun install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```sh
npm run dev
# or using Bun
bun run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Create production build
- `npm run build:dev` - Create development build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode

## Development

### Code Style

The project uses ESLint for code quality and TypeScript for type safety. All components use functional components with React hooks.

### Adding Components

New UI components should be added to the `src/components/ui/` directory and follow the shadcn-ui component structure.

### Database

Database migrations are stored in `supabase/migrations/` and should be applied in order. Use Supabase CLI to manage migrations:

```sh
supabase migration new <migration_name>
supabase db push
```

## Deployment

### Building for Production

```sh
npm run build
```

This generates an optimized production build in the `dist/` directory.

### Deployment Options

The application can be deployed to:
- Vercel (recommended for Vite projects)
- Netlify
- Docker
- Any static hosting service supporting SPA routing

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run linting and tests before committing
4. Submit a pull request with a clear description of changes

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

## Acknowledgments

This project uses the shadcn-ui component library which provides high-quality, accessible components built on Radix UI.
