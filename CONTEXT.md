# Noddic App — Context for AI Assistants

> **Last updated:** April 2026
> **Purpose:** Paste this file into any new AI chat to give full context on the Noddic project.

---

## What is Noddic?

Noddic is a **visual mind map web app** for remembering and organizing anything. Users create multiple maps — each a radial tree of nodes branching from a center point. Every node is fully customizable (shapes, colors, sizes, images, ABC characters) and carries optional memory hints, descriptions, and metadata.

Use cases: remembering people/connections, travel planning, study notes, project management, recipes, neighborhood contacts, and more.

**Live at:** [noddic.com](https://noddic.com)

---

## Current State

**Status:** MVP live on Vercel + Supabase. Functional and deployed.

**What works:**
- Landing page with hero, how-it-works, use cases, CTA, footer
- Email/password auth (signup, login, forgot password, reset password)
- Multiple maps per user (My Maps dashboard with create/edit/delete)
- Map canvas with radial tree auto-layout
- Pan, zoom, click-to-select, drag-to-reposition nodes
- Full node customization: 8 preset types + custom types, outer/inner shapes (8 options each), outer/inner colors, outer/inner sizes (sliders), solid/outline toggle, ABC mode (1-2 characters), image upload
- Image upload to Supabase Storage, images fill node shapes on canvas via SVG pattern
- Search (⌘K) — searches name, hint, description, type; pans to result with highlight animation; auto-expands collapsed ancestors
- Collapse/expand branches — click count badge to toggle
- Node count badges on parent nodes
- Quick Add modal (pick parent from list, add node)
- Add From modal (add child from selected node)
- Node detail panel with view/edit/delete/image upload
- Onboarding flow per map (center node setup)
- Settings page (terminology, accent colors, profile, data erasure)
- Privacy policy and terms of service pages
- Route protection via middleware
- Responsive design

**What's NOT built yet:**
- Settings page overhaul (some settings are obsolete, new ones needed)
- Logo update (should be circle outline with inner circle, not N)
- Header: "My Map" needs to say "My Maps"
- Toolbar layout cleanup (Move, Add, Search positioning; remove ⌘K hint)
- Dark mode / map background color option
- Multi-parent connections (node linked to 2+ parents)
- Tags/labels on nodes
- Export as image/PDF
- PWA support
- Resend email integration
- AI-assisted node creation
- Map templates

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| File Storage | Supabase Storage (node-images bucket) |
| Styling | Tailwind CSS (custom design system) |
| Icons | Lucide React |
| Fonts | Manrope (headlines) + Inter (body) |
| Deployment | Vercel (auto-deploy on push) |
| Email | Resend (account exists, not yet integrated) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Landing page (public)
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Tailwind + custom styles + animations
│   ├── login/page.tsx                # Login (white bg, blue graphics)
│   ├── signup/page.tsx               # Signup (blue bg, white glass card)
│   ├── forgot-password/page.tsx      # Forgot password
│   ├── reset-password/page.tsx       # Set new password after reset
│   ├── auth/callback/route.ts        # Supabase auth callback
│   ├── privacy/page.tsx              # Privacy policy
│   ├── terms/page.tsx                # Terms of service
│   └── (app)/                        # Authenticated route group
│       ├── layout.tsx                # App shell (header with logo, nav, logout)
│       ├── map/
│       │   ├── page.tsx              # My Maps dashboard (list/create/edit/delete maps)
│       │   └── [id]/
│       │       └── page.tsx          # Map canvas — THE core page (~700 lines)
│       └── settings/page.tsx         # User settings
├── components/
│   └── logo.tsx                      # NoddicLogo component (3 sizes)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # createClient() for browser
│   │   ├── server.ts                 # createServerSupabaseClient() for server
│   │   └── middleware.ts             # updateSession() for auth
│   ├── types.ts                      # MapNode, MapRecord, UserSettings, NodePreset, SHAPES, NODE_COLORS, NODE_PRESETS, helper getters
│   ├── hooks.ts                      # useUser(), useMaps(), useNodes(userId, mapId), useSettings()
│   └── layout.ts                     # computeRadialLayout() — handles orphan nodes, saved positions
├── middleware.ts                      # Route protection (/map/*, /settings require auth)
├── declarations.d.ts                 # CSS module declaration
supabase/
└── schema.sql                        # Base schema (NOTE: additional migrations were run manually)
```

---

## Database Schema

### `maps`
- `id` uuid PK
- `user_id` uuid → auth.users
- `name` text
- `emoji` text (default '🗺️')
- `description` text
- `created_at`, `updated_at` timestamptz

### `map_nodes`
- `id` uuid PK
- `user_id` uuid → auth.users
- `map_id` uuid → maps (cascade delete)
- `parent_id` uuid → map_nodes (cascade delete, null = root)
- `name` text
- `type` text (no constraint — any string allowed)
- `hint`, `description`, `address`, `relationship` text
- `meta` jsonb
- `position_x`, `position_y` float (null = auto-layout)
- `color`, `shape`, `display_mode`, `abc` text (legacy columns, still populated)
- `outer_shape`, `outer_color` text
- `outer_size` float (default 28)
- `outer_solid` boolean (default false)
- `inner_shape`, `inner_color` text
- `inner_size` float (default 8)
- `inner_solid` boolean (default true)
- `image_url` text (Supabase Storage public URL)
- `created_at`, `updated_at` timestamptz

### `user_settings` (auto-created on signup via trigger)
- `id` uuid PK
- `user_id` uuid → auth.users (unique)
- `display_name` text
- `node_label`, `person_label`, `place_label`, `context_label` text
- `accent_color` text (default '#3525cd')
- `secondary_color` text (default '#4f46e5')

### Storage
- Bucket: `node-images` (public)
- Path: `{user_id}/{node_id}.{ext}`
- Policies: auth users upload/delete own folder; public read

### Security
- RLS on all tables: `auth.uid() = user_id`
- Cascade deletes: user → maps → nodes; node → child nodes
- Trigger: `on_auth_user_created` auto-inserts user_settings
- Trigger: `handle_updated_at` on user_settings and map_nodes

---

## Key Architecture Decisions

1. **Multiple maps:** Each map is a separate tree. Nodes belong to a map via `map_id`. The My Maps dashboard at `/map` lists maps; `/map/[id]` renders the canvas.

2. **Radial tree layout:** `computeRadialLayout()` positions nodes automatically. Root is found by `!parent_id`. Orphan nodes (no parent) are attached to root. Nodes with saved `position_x/y` use those instead.

3. **Node appearance:** Fully decoupled from type. Type is just a label string. Appearance is controlled by outer_shape, outer_color, outer_size, outer_solid, inner_shape, inner_color, inner_size, inner_solid, display_mode, abc. Presets set all of these at once; custom mode lets users control each independently.

4. **Image rendering:** Images use SVG `<pattern>` fill. A `<pattern>` with the image is defined in `<defs>`, then the outer shape is filled with `url(#pattern-id)`. This clips the image to any shape.

5. **Collapse/expand:** Client-side only (not saved to DB). `collapsedIds` Set tracks which nodes have collapsed children. Layout still computes positions for hidden nodes but they're filtered from rendering.

6. **Search:** Client-side filtering across name, hint, description, type. On select: auto-expands collapsed ancestors, pans canvas to node, highlights with pulsing ring for 2.5s.

7. **Drag:** Toggle mode. When enabled, pointer-down on a node starts dragging; pointer-up saves position via debounced (500ms) updateNode call. When disabled, clicks select nodes.

8. **Auth pages:** Signup = blue gradient bg, white glass card. Login/forgot/reset = white bg, blue graphics. All use the orbit SVG background.

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` + Vercel | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + Vercel | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` (optional) | For server-side admin ops |

---

## How to Work on This Project

### Running locally
```bash
cd remember
npm install
npm run dev
# → http://localhost:3000
```

### Key files for common tasks

| Task | File(s) |
|------|---------|
| Canvas rendering, modals, search, drag | `src/app/(app)/map/[id]/page.tsx` |
| My Maps dashboard | `src/app/(app)/map/page.tsx` |
| Layout algorithm | `src/lib/layout.ts` |
| Node types, presets, helpers | `src/lib/types.ts` |
| Data hooks (CRUD) | `src/lib/hooks.ts` |
| Visual design / CSS | `src/app/globals.css`, `tailwind.config.ts` |
| Auth flow | `src/lib/supabase/middleware.ts`, `src/middleware.ts` |
| Settings page | `src/app/(app)/settings/page.tsx` |
| Landing page | `src/app/page.tsx` |
| Logo component | `src/components/logo.tsx` |
| App header/nav | `src/app/(app)/layout.tsx` |

### Database changes
Run SQL manually in Supabase SQL Editor. Update `supabase/schema.sql` as source of truth.

---

## Design Language

- **Light theme** with surface color `#fcf9f8`
- **Indigo gradient** accent (`#3525cd` → `#4f46e5`)
- **Glass panels** (`backdrop-filter: blur`) on auth pages
- **Typography:** Manrope for headlines (bold, tight tracking), Inter for body
- **Animations:** `page-enter`, `fadeIn`, `slideUp`, `slideRight`
- **Map background:** Dot grid pattern via SVG `<pattern>`
- **Node colors:** User-customizable; defaults: Person=#4ECDC4, Place=#FF6B6B, Context=#4f46e5, Thing=#E8A838, Idea=#A78BFA, Event=#059669, Group=#0d9488, Note=#475569

---

## Next Session Todo

1. **Settings page overhaul** — remove obsolete settings, add map-specific settings, reflect new node customization
2. **Logo update** — circle outline with inner circle instead of "N" in square
3. **Header fix** — "My Map" → "My Maps" in nav
4. **Toolbar layout** — rethink positioning of Move, Add, Search buttons; remove ⌘K keyboard hint display
5. **Dark mode / background color** — option for map canvas background color, or full dark mode

---

## Owner Preferences

- **Hosting:** Vercel for frontend, Supabase for backend + storage
- **Email:** Resend (account exists, not yet integrated)
- **Style:** Clean, editorial, light theme — "Cartographic Silk" aesthetic
- **Domain:** noddic.com
- **Git:** GitHub repo, auto-deploys via Vercel
- **Machines:** Develops on both Windows (desktop) and Mac (laptop)
- **Preferences:** Provide files as downloads when possible to save chat space; give one file at a time for manual pasting
