@AGENTS.md

# this-or-that

Mobile-first polling micro-app. Makers create A/B polls, voters tap to vote without accounts, results animate live.

## Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Database/Auth/Storage:** Supabase (Postgres + Auth + Storage)
- **Styling:** Tailwind CSS v4 with CSS custom properties
- **Hosting:** Vercel
- **OG Images:** `@vercel/og` (Satori)

## Project structure

```
src/
  app/           # Next.js App Router pages and API routes
  components/    # React components (client and server)
  lib/           # Utilities, Supabase clients, helpers
  types/         # TypeScript type definitions
supabase/
  migrations/    # SQL migration files
docs/            # Planning docs (PLAN.md, TECHNICAL_ARCHITECTURE.md, BRAND_ANALYSIS.md)
```

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # ESLint check
npm run format        # Prettier format all files
npm run format:check  # Prettier check (CI)
```

## Coding standards

- **TypeScript:** Strict mode with `noUncheckedIndexedAccess`. Use `type` imports (`import type { Foo }`).
- **Imports:** Ordered by group (builtin → external → internal → relative → type), alphabetized, with newlines between groups. Enforced by `eslint-plugin-import-x`.
- **Components:** Use `function` declarations for components, not arrow functions. Colocate client components with their page when page-specific.
- **Naming:** Files use kebab-case. Components use PascalCase. Utilities use camelCase.
- **Styling:** Tailwind utility classes only — no custom CSS unless unavoidable. Classes are auto-sorted by `prettier-plugin-tailwindcss`.
- **Data fetching:** Server components fetch data directly. Client components use API routes.
- **Unused variables:** Prefix with `_` if intentionally unused.

## Commit messages

Format: `<type>: <description>`

Types: `feat`, `fix`, `chore`, `style`, `deps`, `db`, `api`, `auth`, `types`, `docs`

Examples:

- `feat: add poll creation page and form`
- `db: add initial schema migration`
- `chore: configure ESLint with TypeScript and import rules`

## Pre-commit hooks

Husky + lint-staged runs ESLint --fix and Prettier on all staged files. Do not skip hooks.

## Key conventions

- Polls use `nanoid(8)` short IDs for URLs (`/polls/[shortId]`)
- Voters are anonymous — dedup via FingerprintJS + hashed IP composite key
- Makers authenticate via Supabase Auth (magic link or Google OAuth)
- MVP is 2-option polls only; data model supports 3+ options for future king-of-the-hill mode
- Soft deletes: `deleted_at` timestamp, never hard delete polls
