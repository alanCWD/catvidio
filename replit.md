# catvid.io

## Overview

catvid.io is a mobile-first video sharing platform focused on cat content, styled after YouTube's UI patterns. Users can upload cat videos which get processed with an intro/outro sequence and optionally uploaded to YouTube. The platform features a feed of videos, a "Zoomies" shorts player (vertical video format), user profiles, leaderboards, and a virtual wallet/earnings system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for transitions and micro-interactions
- **UI Components**: Radix UI primitives wrapped with shadcn/ui, Vaul for drawer components
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful JSON API endpoints under `/api/*`
- **File Uploads**: Multer for handling video file uploads (500MB limit)
- **Video Processing**: FFmpeg for video concatenation (adds intro/outro) and thumbnail generation

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` - contains users, videos, upvotes, comments, subscriptions, notifications tables
- **Migrations**: Drizzle Kit with `db:push` command for schema sync

### Authentication
- **Provider**: Replit Auth (supports Google, email/password, GitHub, Apple, X)
- **Flow**: Sign in → Create Profile (if new user) → Access creator features
- **Tables**: `auth_users` (Replit Auth managed), `users` (cat profiles linked via `authUserId`)
- **Session**: PostgreSQL-backed session store with `connect-pg-simple`
- **Middleware**: `isAuthenticated` for protected routes, `getAuthenticatedUserId` helper for profile lookup

### Key Data Models
- **Auth Users**: Replit Auth managed (id, email, firstName, lastName, profileImageUrl)
- **Users**: Cat profiles with username, tagline, avatar, wallet balance, total views (linked to auth_users via authUserId)
- **Videos**: Supports both regular videos and shorts, tracks processing status (pending → processing → uploaded → approved), stores YouTube ID after upload
- **Social Features**: Upvotes, comments, subscriptions, notifications
- **YouTube Video Creators**: Maps YouTube video IDs to creator profiles for multi-creator support

### Creator Management
- **Creator Directory**: Admin page at `/admin/creators` for managing creator profiles
- **Video Assignment**: Assign imported YouTube videos to specific creators
- **Author Display**: Videos show assigned creator's avatar and profile in UI
- **Fallback System**: Unassigned videos show channel name with generated avatar

### External Integrations
- **YouTube Data API v3**: OAuth2 flow for uploading processed videos to YouTube AND fetching channel videos
  - `GET /api/youtube/channel-videos` - Fetches all videos from the connected YouTube channel (works in both dev and production)
- **Video Processing Pipeline**: Raw upload → FFmpeg processing (resize, add intro/outro) → YouTube upload
- **Video Type Sync**: Automatic sync on `/api/videos` that detects Shorts vs regular videos using HEAD requests to `youtube.com/shorts/{id}` with `redirect: manual`. HTTP 200 = Short, 302/303 = regular video. Updates database if mismatch detected.

### Build & Deployment
- **Development**: Vite dev server on port 5000 with HMR
- **Production Build**: esbuild bundles server code, Vite builds client to `dist/public`
- **Static Serving**: Express serves built client files in production

## External Dependencies

### Third-Party Services
- **YouTube API**: OAuth2 authentication for video uploads, requires `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` environment variables
- **Google APIs**: `googleapis` package for YouTube integration

### Database
- **PostgreSQL**: Required, connection via `DATABASE_URL` environment variable
- **Session Store**: `connect-pg-simple` for Express sessions

### Media Processing
- **FFmpeg**: Required system dependency for video processing (concatenation, resizing, thumbnail generation)

### Key NPM Packages
- `drizzle-orm` + `drizzle-zod`: Database ORM with Zod validation
- `@tanstack/react-query`: Server state management
- `framer-motion`: Animations
- `vaul`: Drawer components
- `multer`: File upload handling
- `googleapis`: YouTube API integration