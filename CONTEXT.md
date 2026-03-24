# Remember App — Context for AI Assistants

> **Last updated:** March 24, 2026
> **Purpose:** Paste this file into any new AI chat to give full context on the Remember project without re-explaining everything.

---

## What is Remember?

Remember is a **visual mind map web app** for remembering people and places. The core idea: you are the center node, and you branch outward through contexts (gym, work, neighbourhood) to people and places, then further to related people (children, parents). Each node can carry a **memory hint** — a short trigger phrase to jog your memory when following the path.

Think of it as a personal relationship graph visualized as an interactive, zoomable mind map.

---

## Current State

**Status:** MVP built, running locally, connected to Supabase cloud. Not yet deployed.

**What works:**
- Landing page, signup, login (Supabase Auth, email/password)
- Mind map canvas with radial tree auto-layout
- Pan, zoom, click-to-select nodes
- Add/edit/delete nodes with type-specific fields
- Onboarding flow (creates root "You" node)
- Settings page: rename terminology, pick accent colors, erase all data
- Route protection via middleware (unauthenticated users redirected to login)
- RLS policies on all tables (users can only access own data)
- Auto-created user_settings row on signup (database trigger)

**What's not built yet:**
- Vercel deployment
- Resend email integration
- Multi-parent connections (node linked to 2+ parents)
- Search / filter
- Drag-to-reposition nodes
- Node images / avatars
- Export (image/PDF)
- Dark mode
- Mobile optimization (works but not polished)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Styling | Tailwind CSS (custom theme) |
| Icons | Lucide React |
| Fonts | Manrope (headlines) + Inter (body) |
| Deployment | Vercel (planned) |
| Email | Resend (planned) |

---

## Project Structure

```
remember/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page (public)
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css               # Tailwind + custom styles + animations
│   │   ├── login/page.tsx            # Login
│   │   ├── signup/page.tsx           # Signup
│   │   ├── auth/callback/route.ts    # Supabase auth callback
│   │   └── (app)/                    # Authenticated route group
│   │       ├── layout.tsx            # App shell (header, nav, logout)
│   │       ├── map/page.tsx          # Mind map canvas — THE core page
│   │       └── settings/page.tsx     # User settings & preferences
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # createClient() for browser
│   │   │   ├── server.ts             # createServerSupabaseClient() for server components
│   │   │   └── middleware.ts         # updateSession() for auth middleware
│   │   ├── types.ts                  # MapNode, UserSettings, NodeType, getNodeTypes()
│   │   ├── hooks.ts                  # useUser(), useNodes(), useSettings()
│   │   └── layout.ts                # computeRadialLayout() — tree positioning algorithm
│   └── middleware.ts                 # Route protection (/map, /settings require auth)
├── supabase/
│   └── schema.sql                    # Tables, RLS, triggers, indexes
├── .env.local                        # NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
├── tailwind.config.ts                # Custom theme (colors, fonts, border-radius)
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## Database Schema

### `user_settings` (auto-created on signup)
- `id` uuid PK
- `user_id` uuid → auth.users (unique)
- `display_name` text
- `node_label` text (default "Node") — custom terminology
- `person_label` text (default "Person")
- `place_label` text (default "Place")
- `context_label` text (default "Context")
- `accent_color` text (default "#3525cd")
- `secondary_color` text (default "#4f46e5")
- `created_at`, `updated_at` timestamptz

### `map_nodes` (tree structure via parent_id)
- `id` uuid PK
- `user_id` uuid → auth.users
- `parent_id` uuid → map_nodes (nullable, null = root node)
- `name` text
- `type` text: 'user' | 'person' | 'place' | 'context'
- `hint` text (memory trigger)
- `description` text
- `address` text (for places)
- `relationship` text (for people)
- `meta` jsonb (flexible extra data)
- `position_x`, `position_y` float (for future manual positioning)
- `created_at`, `updated_at` timestamptz

### Security
- RLS enabled on both tables
- All policies: `auth.uid() = user_id`
- Trigger `on_auth_user_created` auto-inserts user_settings row
- Trigger `handle_updated_at` auto-updates `updated_at` on edits
- Cascade deletes: deleting a user removes all their data; deleting a node removes all descendants

---

## Design Language

The visual style is inspired by a "Cartographic Silk" editorial aesthetic:
- **Light theme** with surface color `#fcf9f8`
- **Indigo gradient** accent (`#3525cd` → `#4f46e5`) used for CTAs and the root node
- **Glass panels** (`backdrop-filter: blur`) for floating cards
- **Node type colors:** You = accent color, Person = `#4ECDC4`, Place = `#FF6B6B`, Context = secondary color
- **Typography:** Manrope for headlines (bold, tight tracking), Inter for body text
- **Animations:** `page-enter`, `fadeIn`, `slideUp`, `slideRight` (CSS keyframes)
- **Map background:** Subtle dot grid pattern via SVG `<pattern>`

The user can override accent colors in Settings (8 presets + custom picker).

---

## Key Architecture Decisions

1. **Tree structure, not graph (yet):** Each node has one `parent_id`. Multi-parent connections are planned but not implemented. The data model supports adding a `node_connections` junction table later without rebuilding.

2. **Radial layout algorithm:** Nodes are positioned automatically using a recursive radial tree layout (`src/lib/layout.ts`). The root sits at center (0,0), children are distributed in arcs based on descendant count. No manual positioning yet.

3. **Client-side data hooks:** `useNodes()` and `useSettings()` fetch from Supabase on mount and maintain local state. Mutations update Supabase then patch local state. No server components for data — everything is client-rendered for interactivity.

4. **Route group `(app)/`:** All authenticated pages live under `src/app/(app)/` which shares a layout with the header, nav, and logout button. The parentheses mean the folder name doesn't appear in the URL.

5. **Middleware auth guard:** `src/middleware.ts` runs on every request. It refreshes the Supabase session and redirects unauthenticated users away from `/map` and `/settings`.

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Supabase publishable anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` (optional) | For server-side admin operations |

For Vercel deployment, set these in the Vercel project settings dashboard.

---

## How to Work on This Project

### Running locally
```bash
cd remember
npm install
npm run dev
# → http://localhost:3000
```

### Key files to edit for common tasks

| Task | File(s) |
|------|---------|
| Change map layout/spacing | `src/lib/layout.ts` |
| Add a new node type | `src/lib/types.ts` → update `NodeType`, `getNodeTypes()`, and schema check constraint |
| Modify node fields | `src/lib/types.ts`, `src/app/(app)/map/page.tsx` (AddNodeModal + NodePanel), `supabase/schema.sql` |
| Change visual design | `src/app/globals.css`, `tailwind.config.ts` |
| Add a new page | Create folder in `src/app/(app)/` for authenticated, or `src/app/` for public |
| Modify auth flow | `src/lib/supabase/middleware.ts`, `src/middleware.ts` |
| Add new settings | `src/lib/types.ts` (UserSettings), `src/app/(app)/settings/page.tsx`, `supabase/schema.sql` |

### Database changes
Any schema changes need to be:
1. Added to `supabase/schema.sql` (as the source of truth)
2. Run manually in the Supabase SQL Editor (no migrations set up yet)

---

## Owner Preferences

- **Hosting:** Vercel for frontend, Supabase for backend
- **Email:** Resend (account exists, not yet integrated)
- **Style:** Clean, editorial, light theme — the "Cartographic Silk" look
- **Terminology:** Users can rename "Node", "Person", "Place", "Context" in settings
- **Data model:** Currently single-parent tree; may add multi-parent connections later
- **Target scale:** 50–200 nodes per user
- **App name:** "Remember" (temporary, will be renamed later)
