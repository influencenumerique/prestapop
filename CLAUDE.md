# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PrestaPop is a B2B transport marketplace platform built with Next.js 15, connecting companies (COMPANY) with independent drivers (DRIVER) for delivery missions. The platform handles job postings, booking management, real-time GPS tracking, payment processing via Stripe, and driver feedback/rating systems.

## Technology Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth v5 (JWT strategy)
- **Payments**: Stripe (PaymentIntents, Subscriptions, Connect)
- **File Storage**: Cloudinary (document uploads)
- **Real-time**: Pusher (messaging, GPS tracking)
- **Email**: Resend
- **UI**: Radix UI + Tailwind CSS

## Development Commands

```bash
# Development
npm run dev                 # Start dev server (port 3000, Turbopack enabled)
npm run dev:fresh          # Kill existing Next processes and start fresh

# Build & Deploy
npm run build              # Build for production (runs prisma generate first)
npm start                  # Start production server

# Database
npx prisma migrate dev     # Create and apply migrations
npx prisma generate        # Generate Prisma Client
npx prisma studio          # Open Prisma Studio GUI
npx prisma db seed         # Run seed script (prisma/seed.ts)

# Utilities
npm run lint               # Currently disabled (skips lint)
npx tsx scripts/create-test-booking.ts  # Create test bookings
```

## Core Architecture

### Authentication & Authorization

The app uses a custom role-based auth system built on NextAuth v5:

- **Roles**: `USER` (default), `COMPANY`, `DRIVER`, `ADMIN`
- **Session Strategy**: JWT (stored in tokens, not database)
- **Auth Helpers**: Located in `src/lib/api-auth/index.ts`
  - `requireAuth()`: Ensures user is authenticated
  - `requireRole(role)`: Ensures user has specific role
  - `requireAnyRole([roles])`: Ensures user has one of multiple roles
  - `getAuthenticatedUser(session)`: Returns full user with company/driverProfile

**Important**: The JWT callback in `src/lib/auth.ts` always fetches the current role from the database to handle role changes after onboarding. Users start as `USER`, then become `COMPANY` or `DRIVER` after completing onboarding.

### API Route Protection Pattern

All API routes follow this pattern:

```typescript
import { requireRole, requireAuth } from "@/lib/api-auth"

export async function POST(req: Request) {
  // Option 1: Require specific role
  const authResult = await requireRole("COMPANY")
  if ("error" in authResult) return authResult.error
  const { user } = authResult // user.company is guaranteed to exist

  // Option 2: Require authentication only
  const authResult = await requireAuth()
  if ("error" in authResult) return authResult.error
  const { user } = authResult

  // Business logic here...
}
```

### Database Schema Overview

**User System**:
- `User`: Base user table with role field
- `Company`: Company profile (1:1 with User)
- `DriverProfile`: Driver profile (1:1 with User)
- `Document` / `VerificationDoc`: Document verification system

**Job & Booking System**:
- `Job`: Mission posted by companies (status: DRAFT → OPEN → ASSIGNED → IN_PROGRESS → DELIVERED → COMPLETED)
- `Booking`: Application/assignment of driver to job (unique constraint: jobId + driverId)
- `Review`: Company reviews driver after mission completion
- `DriverFeedback`: Detailed feedback with tags (PUNCTUAL, CAREFUL, FAST, etc.)

**Subscription System**:
- `SubscriptionPlan`: Available plans (FREE, PRO, BUSINESS, ENTERPRISE)
- `Subscription`: Active user subscriptions with usage tracking
- `Invoice`: Stripe invoice records
- Usage limits enforced via `src/lib/subscription-limits.ts`

**Messaging & Tracking**:
- `Conversation` + `ConversationParticipant` + `Message`: Internal messaging
- `LocationUpdate`: GPS tracking data for deliveries

### Key Business Logic

**Vehicle Volume Pricing**:
Jobs have minimum day rates based on vehicle volume (enforced in `src/app/api/jobs/route.ts`):
- CUBE_6M: 120€
- CUBE_9M: 122.50€
- CUBE_12M: 125€
- CUBE_15M: 127.50€
- CUBE_20M: 130€

**Mission Types**:
- `DAY`: Full day mission
- `HALF_DAY`: Half day mission
- `WEEK`: Week-long mission

**Mission Flow**:
1. Company creates Job (status: OPEN)
2. Driver applies → creates Booking (status: ASSIGNED)
3. Driver starts mission → status: IN_PROGRESS
4. Driver marks delivered → status: DELIVERED
5. Company validates → status: COMPLETED
6. Company submits feedback/review

**Stripe Integration**:
- Payment flow: `createMissionPaymentIntent()` → PaymentIntent → Webhook confirms payment
- Subscriptions: Checkout Sessions → Webhook updates DB
- Driver payouts: Stripe Connect (Express accounts)

### File Structure

```
src/
├── app/
│   ├── (main)/           # Main app pages (with navbar/footer layout)
│   │   ├── page.tsx      # Homepage
│   │   ├── jobs/         # Job listing and detail pages
│   │   ├── dashboard/    # Company/Driver dashboards
│   │   └── onboarding/   # Company/Driver onboarding flows
│   ├── admin/            # Admin panel (separate layout)
│   ├── api/              # API routes
│   │   ├── jobs/         # Job CRUD + applications
│   │   ├── bookings/     # Booking management + payment
│   │   ├── stripe/       # Stripe checkout + webhooks
│   │   ├── subscriptions/ # Subscription management
│   │   ├── company/      # Company-specific endpoints
│   │   ├── driver/       # Driver-specific endpoints
│   │   └── admin/        # Admin endpoints
│   └── login/            # Login page
├── components/
│   ├── ui/               # Radix UI components (shadcn/ui style)
│   ├── tracking/         # GPS tracking components
│   └── chat/             # Messaging components
└── lib/
    ├── auth.ts           # NextAuth configuration
    ├── api-auth/         # API auth helpers
    ├── db.ts             # Prisma client singleton
    ├── stripe.ts         # Stripe helper functions
    └── subscription-limits.ts  # Subscription limit enforcement
```

### Environment Variables

Required variables in `.env` (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL` + `NEXTAUTH_SECRET`: NextAuth config
- `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET`: Stripe keys
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + upload preset: Cloudinary config
- `PUSHER_*` + `NEXT_PUBLIC_PUSHER_*`: Pusher credentials
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`: Google OAuth (optional)
- `RESEND_API_KEY`: Email sending (optional, logs to console if missing)

### Important Notes

**Password Security**: Currently using plain text password comparison for dev/test (`src/lib/auth.ts:48`). This needs bcrypt/argon2 hashing for production.

**Middleware**: `src/middleware.ts` redirects authenticated COMPANY/DRIVER users from homepage to dashboard.

**ESLint**: Disabled during builds (`next.config.js`). The `npm run lint` script is a no-op.

**Stripe API Version**: Using `2025-02-24.acacia` (`src/lib/stripe.ts:9`)

**Real-time Features**:
- GPS tracking uses Pusher channels named `booking-${bookingId}`
- Messaging uses Pusher for new message notifications

### MCP Servers

### context7

Le serveur MCP **context7** est configuré dans `.mcp.json` pour fournir du contexte supplémentaire lors des conversations.

**Utilisation recommandée** :
- Utiliser context7 pour récupérer des informations de contexte spécifiques au projet
- Consulter context7 avant de faire des modifications importantes à l'architecture
- Référencer context7 pour obtenir des guidelines et best practices du projet

**Quand utiliser context7** :
- Lorsque vous avez besoin de comprendre le contexte métier de PrestaPop (missions, chauffeurs, entreprises)
- Pour vérifier les règles de pricing et de gestion des missions
- Avant de modifier les flux d'authentification ou d'autorisation
- Pour comprendre les intégrations avec Stripe, Cloudinary, ou Pusher

**Commandes** :
Le serveur est automatiquement disponible une fois activé dans les paramètres de Claude Code. Il fournit des outils additionnels pour interroger le contexte du projet.

## Common Patterns

**Checking subscription limits**:
```typescript
import { checkMissionLimit, incrementMissionUsage } from "@/lib/subscription-limits"

const limitCheck = await checkMissionLimit(user.id)
if (!limitCheck.allowed) {
  return NextResponse.json({ error: limitCheck.reason }, { status: 403 })
}
// After creating mission:
await incrementMissionUsage(user.id)
```

**Creating Stripe payments**:
```typescript
import { createMissionPaymentIntent } from "@/lib/stripe"

const paymentIntent = await createMissionPaymentIntent(
  bookingId, jobId, driverId, companyId,
  agreedPrice, missionType, description
)
```

**Querying with relations**:
```typescript
// Always include necessary relations to avoid N+1 queries
const jobs = await db.job.findMany({
  include: {
    company: { include: { user: true } },
    _count: { select: { bookings: true } }
  }
})
```
