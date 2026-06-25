# LiteSourcing — Take-Home Interview Project

## Overview

You're building an internal tool for a procurement team at a construction sourcing company. Their job is to find the best suppliers and prices for materials needed across multiple projects. Today they manage everything in spreadsheets — you're building the first version of a proper tool.

**Time**: 3 days
**Scope**: Full-stack web application (frontend + backend)
**Stack**: Your choice — use whatever you're most productive with

---

## The Problem

A sourcing team manages relationships with dozens of suppliers, each offering different products at different prices. When a new construction project comes in, the team gets a list of required materials (called "spec items"). For each spec item, they need to:

1. Search across suppliers to find who sells a matching product
2. Compare prices, lead times, and suppliers
3. Pick the best option

They do this for every item, across multiple projects running simultaneously.

---

## What the Tool Should Do

### 1. Supplier Directory

The team works with many suppliers. Each supplier has a name, country, website, and a catalog of products they sell. Each product in the catalog has a name, category (e.g. "Electrical", "Plumbing", "HVAC"), unit price, currency, unit of measure (e.g. "meter", "piece", "kg"), and lead time in days.

Users should be able to:
- Browse and search suppliers
- View a supplier's product catalog
- Add new suppliers and add products to their catalog

### 2. Project Workspace

The team manages multiple projects at once. Each project has a name, a buyer/client name, and a list of required materials called "spec items." A spec item is something like _"500 meters of 4mm copper cable"_ — it has a name, description, category, quantity, and unit of measure.

Users should be able to:
- Create and manage projects
- Add spec items to a project
- See all spec items for a project at a glance

### 3. Sourcing Workflow

This is the core of the tool. For each spec item, the user needs to find potential supplier products and attach them as "sourcing options." A sourcing option connects a spec item to a specific supplier's product, with a quoted price, total cost, and lead time.

Users should be able to:
- Search across all suppliers' products to find matches for a spec item
- Attach one or more sourcing options to a spec item
- Compare sourcing options for a spec item (price, lead time, supplier)
- Select a winning sourcing option for each spec item

### 4. Project Status & Summary

Projects move through stages: **Draft → Sourcing → Quoted → Closed**. These transitions should have sensible guardrails (e.g. a project shouldn't be marked "Quoted" if its spec items don't have selected sourcing options).

Users should be able to:
- See a project-level summary: total estimated cost, number of suppliers involved, longest lead time across selected options
- Move a project through its lifecycle

---

## Seed Data

A `seed_data.json` file is included with ~10 suppliers and ~80 products across several categories. Use this to populate your database so you don't spend time inventing test data. How you import it is up to you.

---

## What We're Looking For

We're evaluating your ability to design and build a working product, not just write code. Specifically:

- **Data modeling** — How you structure the data and relationships
- **Backend design** — API structure, validation, error handling, separation of concerns
- **Frontend & UX** — Is the tool intuitive and usable? Is the search experience good? Is the comparison view actually helpful?
- **Code quality** — Organization, readability, maintainability
- **Product sense** — Edge cases, guardrails, smart tradeoffs given the time constraint
- **Communication** — Does your README explain your thinking?

There is no single "right" architecture or design. Two candidates will produce very different solutions, and that's the point.

---

## Deliverables

1. A working web application (frontend + backend)
2. A filled-out version of the **Submission Notes** section below
3. Your code in a Git repository (share a link or zip)
4. If you have used any AI tool (Cursor / Claude / Windsurf / Copilot) share the complete conversation history

The application should be runnable locally with minimal setup. Ideally a single command (or two — one for backend, one for frontend).

---

## Submission Notes

### Setup Instructions

Requirements: Node 18+ (developed on Node 22) and npm.

```bash
# 1. Install dependencies
npm install

# 2. Create the env file (points Prisma at a local SQLite file)
cp .env.example .env        # Windows: copy .env.example .env

# 3. Create the database, generate the client, and import seed.json
#    (~10 suppliers / ~69 products)
npm run setup

# 4. Run it
npm run dev                 # http://localhost:3000
```

The app requires sign-in. The seed creates a demo account:

```
Email:    demo@litesourcing.dev
Password: password123
```

You can also create a new account from the **Create account** page.

That's it — one app, one command to run. The `setup` script runs
`prisma migrate deploy && prisma generate && npm run db:seed`. To wipe and
re-seed at any time: `npm run db:reset` then `npm run db:seed`.

Handy scripts: `db:seed`, `db:reset`, `db:studio` (Prisma Studio GUI),
`build`, `start`.

> Note: the seed file in the repo is named `seed.json` (the brief mentions
> `seed_data.json`); the import script reads `seed.json`.

### Tech Stack

- **Next.js (App Router) + TypeScript** — one codebase for both the UI and the
  HTTP API (route handlers under `src/app/api`). Fastest path to a cohesive,
  single-command full-stack app within the time budget.
- **Prisma + SQLite** — zero-setup, file-based database. Type-safe queries and
  migrations with no external services to install. Easy to swap to Postgres
  later (change the datasource).
- **React Query** — client-side data fetching/caching and mutation state
  (loading/error) without hand-rolled boilerplate; powers the live search.
- **Tailwind CSS** — quick, consistent styling.
- **Zod** — one schema per payload, shared by the API for validation; field-
  level errors are returned to the client.

### Architecture Decisions

**Data model** (see `prisma/schema.prisma`):

```
Supplier 1──* Product
Project  1──* SpecItem 1──* SourcingOption *──1 Product
```

A `SourcingOption` is the join between a spec item and a supplier's product,
storing a `quotedPrice`, computed `totalCost` (price × spec quantity), and
`leadTimeDays` snapshotted at attach time, plus an `isSelected` "winner" flag.
Snapshotting means later catalog edits don't silently rewrite a project's quote.

**Backend** — REST-ish route handlers grouped by resource. Cross-cutting
concerns live in `src/lib`: `http.ts` (uniform JSON responses, JSON parsing,
an `ApiError` → status-code mapper), `validation.ts` (Zod schemas), and
`projects.ts` (pure domain logic — status-transition rules and summary roll-up,
unit-testable and reused by both the API and the UI).

Key guardrails enforced server-side (with matching client affordances):
- Status follows `Draft → Sourcing → Quoted → Closed` (one step back allowed);
  illegal jumps return 409.
- Can't enter Sourcing/Quoted with zero spec items.
- Can't reach **Quoted** unless every spec item has a selected winner.
- Selecting a winner is transactional — a spec item never has two winners.
- A product can't be attached to the same spec item twice (409).

**Frontend** — Interactive list/search pages are client components using React
Query against the API (live supplier search, live catalog search in the
sourcing view). The project summary (total cost, supplier count, longest lead
time) is derived on the client from the same pure function the backend uses, so
there's a single source of truth for the rollup logic.

**Auth** — Session-based login backed by a `User`/`Session` table (see
`schema.prisma`). Passwords are hashed with scrypt (Node built-in — no extra
dependency); login mints a random token stored in an httpOnly cookie and a
revocable `Session` row. A `proxy.ts` (Next 16 edge proxy/middleware) gates
pages (redirect to `/login`) and data APIs (401 JSON) on cookie presence;
`lib/auth.ts#requireUser` re-validates the session (expiry/revocation) inside
every data route handler. Single-tenant for now — all users share one dataset.

**Tradeoffs given 3 days** — SQLite over Postgres; single-tenant (login, but no
per-user data isolation or roles); the
catalog search is a simple `contains` match rather than fuzzy/full-text; no
automated test suite (domain logic in `lib/projects.ts` is structured to be the
first thing I'd unit-test). Mutations invalidate React Query caches rather than
doing optimistic updates.

### What I'd Do With More Time

- **Tests** — unit tests for `lib/projects.ts` (transitions + summary) and API
  integration tests for the guardrails.
- **Better search** — full-text / fuzzy matching, category facets, and
  per-spec-item "suggested matches" ranked by price and lead time.
- **Editing** — edit/delete for suppliers, products, and projects; inline edit
  of a quoted price on an option (currently defaults to catalog price).
- **Currency handling** — normalize to a base currency for cross-supplier
  comparison instead of comparing raw amounts.
- **Auth & audit** — login exists; next would be roles/permissions, per-user or
  per-team data isolation, and a history of who selected which option.
- **Polish** — optimistic updates, toasts, pagination, and empty/error states
  for slow networks.
