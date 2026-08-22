SkillSwap reimagines the gig economy without money — users offer and request skills (tutoring, repairs, lessons) and pay each other in time-credits instead of cash. The standout feature is PostGIS-powered geospatial search, letting users discover offers within a configurable radius on a live map. Backend logic handles atomic multi-step database transactions to safely move credits between accounts, preventing race conditions during concurrent bookings.

Tech stack: React · Node.js (Vercel Serverless Functions) · PostgreSQL + PostGIS · Prisma ORM · Neon · Leaflet · Tailwind CSS · Framer Motion
