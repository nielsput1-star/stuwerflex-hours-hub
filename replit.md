# Overview

Stuwflex is a comprehensive employee time tracking and workforce management system designed for logistics and warehouse operations. The application enables employees to log work hours across different tasks (warehouse, logistics, maintenance, administrative) while providing administrators with tools to manage employees, departments, tasks, and view detailed work reports. The system features role-based access control with distinct interfaces for employees and administrators.

## Recent Migration (August 19, 2025)

Successfully migrated from Lovable/Supabase environment to Replit with PostgreSQL and Drizzle ORM:
- ✅ Replaced Supabase authentication with JWT-based system
- ✅ Migrated from Supabase database to PostgreSQL with Drizzle ORM
- ✅ Created comprehensive database schema with sample data
- ✅ Implemented React Query for client-side data fetching
- ✅ Created demo accounts: admin@stuwflex.com, manager@stuwflex.com, employee@stuwflex.com (password: demo123)
- ✅ Removed all Supabase dependencies and updated imports

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend uses React 18 with TypeScript in a single-page application (SPA) architecture. The UI is built with shadcn/ui components providing a consistent design system based on Radix UI primitives and styled with Tailwind CSS. The application implements client-side routing using React Router for navigation between different views.

State management is handled through React Query (TanStack Query) for server state management and caching, combined with React Context for authentication state. The component structure follows a modular approach with reusable UI components, layout components, and page-specific components.

## Backend Architecture
The backend follows an Express.js REST API architecture with TypeScript. The server implements a layered structure with:
- Route handlers for API endpoints in `/server/routes.ts`
- Storage layer abstraction in `/server/storage.ts` 
- Database configuration and connection in `/server/db.ts`

Authentication is implemented using JWT tokens with bcrypt for password hashing. The API includes middleware for token verification and role-based access control.

## Database Design
The system uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema includes:
- Users table for authentication credentials
- Profiles table for user information and roles
- Employees table linking profiles to employment data
- Departments table for organizational structure
- Tasks table defining available work types
- Work hours table for time tracking records

The database schema supports role-based permissions (admin, employee, manager) and tracks employee status (active, inactive, on_leave).

## Authentication & Authorization
JWT-based authentication system with role-based access control:
- Token-based session management stored in localStorage
- Middleware protection for authenticated routes
- Role-specific UI components and page access
- Automatic token refresh and logout on expiration

## Development Environment
The project uses Vite for development with hot module replacement. The monorepo structure separates client and server code while sharing TypeScript types through a shared directory. Build process includes TypeScript compilation and static asset bundling.

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting service accessed via `@neondatabase/serverless`
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect

## UI & Styling
- **Radix UI**: Headless component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Pre-built component library based on Radix UI
- **Lucide React**: Icon library for consistent iconography

## Authentication & Security
- **bcrypt**: Password hashing for secure credential storage
- **jsonwebtoken**: JWT token generation and verification
- **express-session**: Session management middleware

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production builds
- **React Query**: Server state management and caching

## Additional Services
- **WebSocket support**: Via `ws` package for real-time database connections
- **Form handling**: React Hook Form with Zod validation
- **Date handling**: Built-in JavaScript Date APIs