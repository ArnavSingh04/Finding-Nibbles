# 🍽️ Finding Nibbles (Next.js + Node)

AI-driven dining recommendations — decide **what** and **where** to eat based on your
preferences, dietary needs, and location. This is the **Next.js + Node** rewrite of the
original Meteor application.

## Tech stack

| Layer | Technology |
|------|------------|
| Framework | **Next.js 14** (App Router) — full-stack React + Node route handlers |
| Language | TypeScript |
| UI | React 18, Material UI (MUI) v7, Tailwind CSS v4, Framer Motion |
| Charts | Recharts |
| Maps | `@react-google-maps/api` (Google Maps & Places) |
| Auth | **NextAuth (Auth.js)** — Credentials provider, bcrypt, JWT sessions |
| Database | **MongoDB** (official `mongodb` driver) |
| AI | Google Gemini API (dish suggestions), Hugging Face SDXL (image generation) |

## Architecture

```
finding-nibbles-next/
├── app/
│   ├── api/                 # Route Handlers — replace all Meteor methods & publications
│   │   ├── auth/            # NextAuth + register
│   │   ├── users/ dishes/ onboarding/
│   │   ├── plans/ meals/ saved-dishes/ saved-restaurants/ search-history/
│   │   ├── ai-suggestion/   # Gemini API (was /api/aiSuggestion)
│   │   └── generate-image/  # Hugging Face (was /api/generateImage)
│   ├── (pages)/             # map, discover, meal-planner, profile, travel-plans, …
│   ├── layout.tsx           # root layout + providers + NavBar
│   └── providers.tsx        # SessionProvider + MUI theme + Toasts
├── components/              # NavBar, Sidebar, MapScreen, popups, plans, profile
├── lib/
│   ├── db.ts                # shared MongoClient
│   ├── models.ts            # typed collections + interfaces + index setup
│   ├── auth.ts session.ts   # NextAuth config + route-handler auth guards
│   ├── api-client.ts        # typed browser client — replaces Meteor.call
│   ├── hooks.ts             # useResource — replaces useTracker/subscribe
│   ├── useCurrentUser.ts    # replaces Meteor.user()/userId()
│   └── gemini.ts            # Gemini API model factory
├── scripts/seed.ts          # seed a demo user
└── middleware.ts            # protects authenticated routes
```

### How Meteor concepts map over

| Meteor | Next.js |
|--------|---------|
| `Meteor.methods` | Route Handlers under `app/api/**/route.ts` |
| `Meteor.publish` / `subscribe` + Minimongo | REST `GET` endpoints + `useResource()` fetch hook |
| `Mongo.Collection` | `lib/models.ts` typed `mongodb` collections |
| Accounts (`accounts-password`) | NextAuth Credentials provider + bcrypt |
| `Meteor.userId()` (server) | `requireUserId()` from `lib/session.ts` |
| `Meteor.user()` (client) | `useCurrentUser()` |
| `Meteor.settings` | environment variables (`.env.local`) |

## Getting started

### Prerequisites
- Node.js **18.18+**
- A MongoDB instance (local `mongod` or MongoDB Atlas)

### 1. Install
```bash
cd finding-nibbles-next
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# then edit .env.local and fill in real values
```
All third-party keys are placeholders in `.env.example`. Required for full functionality:
- `MONGODB_URI` — your MongoDB connection string
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps/Places (client-side)
- `GEMINI_API_KEY` — Google AI Studio API key for dish suggestions (https://aistudio.google.com/apikey)
- `HF_TOKEN` — Hugging Face access token (image generation)

> The AI endpoints **gracefully fall back to mock data** when their keys are missing or
> quotas are exhausted, so the app runs end-to-end without them.

### 3. Seed a demo user (optional)
```bash
npm run seed        # creates SEED_USERNAME / SEED_PASSWORD (default: test / test)
```

### 4. Run
```bash
npm run dev         # http://localhost:3000
```

### Other scripts
```bash
npm run build       # production build
npm run start       # run the production build
npm run typecheck   # tsc --noEmit
```

## Security notes
- Real secrets live only in `.env.local`, which is git-ignored. Never commit them.
- Passwords are bcrypt-hashed; sessions are stateless JWTs signed with `NEXTAUTH_SECRET`.
- The Google Maps key is public (browser-exposed) — restrict it by HTTP referrer in GCP.
- Server-only secrets (Mongo URI, Gemini API key, HF token) are never sent to the client.

## Deployment
Deploy as a standard Next.js app (e.g. Vercel, or `npm run build && npm run start` behind a
Node process manager). Provide all `.env` values as platform environment variables and point
`MONGODB_URI` at your production database.
