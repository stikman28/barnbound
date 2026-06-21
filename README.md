# BarnBound — Prototype Website

A prototype website for BarnBound, a marketplace and community platform for the equine industry. Based on the ANEQ 204 business plan by Rachel Bird.

> **Mission**: *Connecting the Horse Community in One Place.*

## Two builds in this repo

1. **Full-stack app — `web/`** (the production direction): Next.js 16 + PostgreSQL + Prisma, containerized with Docker. Real accounts, a shared database, and a working buy/sell/offer/contact marketplace. **Start here.**
2. **Static prototype — repo root** (`index.html`, `pages/`, `js/`): the original localStorage demo, kept for reference and the GitHub Pages link.

## Run the full-stack app (Docker)

Requires Docker Desktop. From the repo root:

```bash
docker compose up --build
```

- App: <http://localhost:3001>
- Postgres: localhost:5433 (inside Docker: `db:5432`)
- Health check: <http://localhost:3001/api/health>

First run, in another terminal, seed the database (11 partners + 20 listings + 3 demo sellers):

```bash
docker compose exec web npm run seed
```

**Demo accounts** (password `password123`): `sage@barnbound.test`, `cody@barnbound.test`, `dana@barnbound.test` — or just sign up.

### Full-stack architecture

```
Browser ──HTTP/JSON──▶ Next.js (web, :3001) ──SQL via Prisma──▶ PostgreSQL (db, :5433)
                       App Router + React UI
                       Route handlers = the API
                       bcrypt + signed cookie sessions
```

- `web/prisma/schema.prisma` — User, Business, Listing, Order, Inquiry, Favorite (money stored as integer cents)
- `web/app/api/*` — REST route handlers (auth, listings, orders, inquiries, favorites, businesses, dashboard)
- `web/lib/*` — Prisma client, auth/session, validation (zod), serializers
- `web/app/*` — pages (home, marketplace, directory, community, map, pricing, about, signin, signup, dashboard)

---

## Static prototype (legacy)

## What's in the Prototype

| Page | File | What It Shows |
|------|------|---------------|
| Home | `index.html` | Hero, mission, 3-step how-it-works, featured businesses + listings |
| Marketplace | `pages/marketplace.html` | Browse horses, tack, and equipment with filters (type, discipline, price, verified seller) |
| Directory | `pages/directory.html` | Browse local businesses with filters (category, city, rating) + search |
| Community | `pages/community.html` | Tabs for upcoming events, Q&A forums, and discussion groups |
| Pricing | `pages/pricing.html` | Free / Consumer Premium / Starter / Pro / Premier tiers + marketplace fees |
| About | `pages/about.html` | Mission, values, founder bio, "Why Fort Collins first" |

## Running the Prototype

Everything is static HTML/CSS/vanilla JavaScript — no build step, no dependencies.

**Option 1 — Open directly**: Double-click `index.html` in Finder. Most browsers will open it, though a local server is cleaner.

**Option 2 — Run a local server** (recommended):

```bash
cd ~/Projects/equiconnect-prototype
python3 -m http.server 8080
```

Then open <http://localhost:8080> in your browser.

## Project Structure

```
equiconnect-prototype/
├── index.html              # Home page
├── css/
│   └── style.css           # All styling (single file)
├── js/
│   ├── data.js             # Mock data (businesses, listings, events, forums, groups)
│   ├── home.js             # Home page dynamic content
│   ├── marketplace.js      # Marketplace filters + sort
│   ├── directory.js        # Directory filters + search
│   └── community.js        # Community tab switching
├── pages/
│   ├── marketplace.html
│   ├── directory.html
│   ├── community.html
│   ├── pricing.html
│   └── about.html
└── README.md
```

## Mock Data

All listings, businesses, events, and forum threads are sample data in `js/data.js`. Real data would come from a backend (Firebase/Supabase per the business plan) when the real product is built.

- **12 sample businesses** across Boarding, Training, Veterinary, Farrier, Feed & Tack, Hauler, Photographer, Service Providers
- **12 sample marketplace listings** — horses (multiple disciplines), tack/saddles, equipment
- **6 upcoming events**, **6 Q&A threads**, **6 local groups**

## Design Notes

- **Palette**: Saddle brown, forest green, cream, warm rust — an earthy, equestrian feel
- **Typography**: Georgia (serif) for headings, system fonts for body
- **Responsive**: Works on mobile, tablet, desktop
- **No framework**: Pure HTML/CSS/JS so it's easy to understand and modify

## What's Not Included (Would Come in a Real Build)

This is a prototype — it demonstrates the concept and user flow, but the buttons don't actually sign people up or process payments. A real build per the business plan would include:

- Backend (Firebase or Supabase)
- Stripe Connect for marketplace payments + Stripe Identity for seller verification
- User accounts, authentication, and profiles
- Real-time messaging
- Image/video uploads
- Mobile apps (React Native iOS/Android)

## Credit

Based on the BarnBound App Business Plan (ANEQ 204) by Rachel Bird.
