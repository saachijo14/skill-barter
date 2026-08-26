**SkillSwap**

SkillSwap is a full-stack peer-to-peer skill barter marketplace where users trade expertise using time-credits instead of money. Built with the listed tech stack and PostgreSQL/PostGIS for real-time geospatial discovery, it lets users offer or request skills, find nearby matches on an interactive map, and safely exchange time-credits through atomic database transactions.

🔗 **Live demo:** skill-swap-virid-tau.vercel.app 
📦 **Repo:** github.com/saachijo14/skill-barter

**Features**

Time-credit economy — no money changes hands; users earn and spend credits by helping each other
Geospatial discovery — PostGIS-powered radius search (ST_DWithin, ST_Distance) to find nearby offers/requests on a live Leaflet map
Atomic credit transfers — multi-step database transactions (prisma.$transaction) guarantee credits move safely between users with no partial-failure states
Full swap lifecycle — request → provider confirms (credits locked) → provider certifies completion → optional 15-minute cancellation window with automatic refund
Post-swap chat — a 24-hour messaging window opens between requester and provider once a swap is confirmed
Independent two-sided reviews — each party leaves their own rating/comment per transaction
JWT authentication with bcrypt password hashing
Profile setup with browser geolocation for accurate distance-based matching.

**Tech Stack**

**Frontend:** React (Vite), Tailwind CSS, Framer Motion, React Router, React Leaflet 
**Backend:** Node.js — Vercel Serverless Functions 
**Database:** PostgreSQL + PostGIS extension, hosted on Neon 
**ORM:** Prisma (with @prisma/adapter-pg driver adapter) 
**Auth:** JWT, bcrypt
**Deployment:** Vercel (monorepo — static frontend + serverless API)

**Architecture Highlights**

Geospatial search — listings are matched to a user's location using PostGIS GEOGRAPHY columns and GIST indexing, returning real distances and coordinates rather than city-level approximations.
Atomic transactions — confirming, completing, or cancelling a swap all run as grouped Prisma transactions, so credit balances can never end up in an inconsistent state even if a request fails mid-way.
Time-boxed actions — a swap's cancellation window (15 minutes post-completion) and its chat window (24 hours post-confirmation) are both enforced server-side using timestamps, not just hidden in the UI.
Hybrid raw SQL + ORM — most of the schema uses Prisma models directly; the locations table and geospatial queries use raw SQL, since Prisma doesn't natively support PostGIS geography types.

**Project Structure**

skill-barter/
├── api/                      # Vercel serverless functions (backend)
│   ├── auth/                 # signup, login
│   ├── listings/             # create, search (PostGIS), mine
│   ├── transactions/         # create, confirm/complete/cancel, mine, chat
│   ├── reviews/               # per-user reviews per transaction
│   ├── profile/               # location + bio updates
│   ├── skills/                 # skill catalog
│   └── _lib/                  # shared Prisma client, auth middleware
├── client/                   # React (Vite) frontend
│   └── src/
│       ├── pages/             # Login, Signup, Dashboard, Explore, etc.
│       ├── components/        # Navbar, Chat
│       ├── context/            # AuthContext
│       └── lib/                # API client
├── prisma/
│   └── schema.prisma
└── vercel.json

**Running Locally**

bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Set up environment variables in .env (root)
DATABASE_URL="your-neon-postgres-connection-string"
JWT_SECRET="your-secret-key"

# Run the backend
vercel dev

# In a second terminal, run the frontend
cd client
npm run dev

The frontend runs at http://localhost:5173 and proxies /api requests to the backend at http://localhost:3000.

**What's Not Included (Known Simplifications)**

No password reset flow
Skill tags in Profile Setup are UI-only and not yet persisted to a dedicated skills table
No pagination on listings/transactions (fine at demo scale, would need it for production)

Built as a portfolio project to explore geospatial querying, atomic transaction design, and serverless full-stack architecture.
