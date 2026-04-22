# Noddic App — Context for AI Assistants

> **Last updated:** April 2026
> **Purpose:** Paste this file into any new AI chat to give full context on the Noddic project.

---

## What is Noddic?

Noddic is a **visual mind map web app** for remembering and organizing anything. Users create multiple maps — each a radial tree of nodes branching from a center point. Every node is fully customizable (shapes, colors, sizes, images, tags, ABC characters) and carries optional memory hints, descriptions, and metadata. Nodes can be marked as completed.

**Live at:** [noddic.com](https://noddic.com)

---

## Current State

**Status:** MVP live on Vercel + Supabase. Functional and deployed.

**What works:**
- Landing page with hero, how-it-works, use cases, CTA, footer
- Email/password auth (signup, login, forgot password, reset password)
- Multiple maps per user (My Maps dashboard with create/edit/delete)
- 7 map templates (People, Travel, Study, Recipe, Project, Neighbourhood, Idea) that pre-create 15-25 nodes in a 3-level tree
- Blank map option with onboarding for center node
- Map canvas with radial tree auto-layout
- Pan, zoom (scroll + pinch-to-zoom on mobile), drag-to-reposition nodes
- Separate mouse/touch handlers for desktop/mobile
- Full node customization: 8 preset types (each with unique shape) + custom types
- Outer/inner shapes (8 options each), colors, sizes (sliders), solid/outline toggle
- ABC mode (1-2 characters) or shape-in-shape display
- Image upload to Supabase Storage, images fill node shapes via SVG pattern
- Tags on nodes (add/remove, searchable)
- Completed toggle on nodes (green text + ✓ prefix on canvas)
- Search (⌘K) — searches name, hint, description, type, tags; pans to result with highlight
- Collapse/expand branches — click count badge to toggle
- Node count badges on parent nodes
- Quick Add modal (pick parent from list)
- Add From modal (add child from selected node)
- Node detail panel (view/edit/delete/image/tags/complete) — full screen on mobile, side panel on desktop
- Export map as PDF (jsPDF + svg2pdf.js, falls back to SVG)
- Settings page: profile, terminology, accent color, map background color (10 presets + custom including dark), danger zone (erase data, delete account)
- Account deletion via API route with service role key
- Branded NoddicLoader (animated logo)
- NoddicLogo component (circle outline + inner circle, gradient)
- Favicons, PWA icons, OG image, apple-touch-icon
- PWA manifest (installable on desktop and mobile)
- Route protection via middleware
- Mobile responsive: 100dvh layout, compact toolbar, full-screen detail panel, pinch-to-zoom

**What's NOT built yet:**
- Multi-parent connections (node linked to 2+ parents)
- Resend email integration (welcome emails, weekly digests)
- AI-assisted node creation
- Custom icon sets (replace emojis with Lucide/Iconify icons)
- Map sharing / collaboration

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| File Storage | Supabase Storage (node-images bucket) |
| PDF Export | jsPDF + svg2pdf.js |
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
│   ├── layout.tsx                    # Root layout (meta, icons, viewport)
│   ├── globals.css                   # Tailwind + custom styles + animations
│   ├── login/page.tsx                # Login (white bg, blue graphics)
│   ├── signup/page.tsx               # Signup (blue bg, white glass card)
│   ├── forgot-password/page.tsx      # Forgot password
│   ├── reset-password/page.tsx       # Set new password
│   ├── auth/callback/route.ts        # Supabase auth callback
│   ├── api/account/route.ts          # DELETE endpoint (uses service role key)
│   ├── privacy/page.tsx              # Privacy policy
│   ├── terms/page.tsx                # Terms of service
│   └── (app)/                        # Authenticated route group
│       ├── layout.tsx                # App shell (header h-16, nav, h-[100dvh])
│       ├── map/
│       │   ├── page.tsx              # My Maps dashboard + template picker
│       │   └── [id]/
│       │       └── page.tsx          # Map canvas — THE core page (~1000 lines)
│       └── settings/page.tsx         # User settings
├── components/
│   ├── logo.tsx                      # NoddicLogo (circle outline + inner circle, 3 sizes)
│   └── loader.tsx                    # NoddicLoader (animated branded spinner)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # createClient() for browser
│   │   ├── server.ts                 # createServerSupabaseClient() for server
│   │   └── middleware.ts             # updateSession() for auth
│   ├── types.ts                      # MapNode, MapRecord, UserSettings, NodePreset, SHAPES, NODE_COLORS, NODE_PRESETS, helper getters
│   ├── hooks.ts                      # useUser(), useMaps(), useNodes(userId, mapId), useSettings()
│   └── layout.ts                     # computeRadialLayout() — handles orphan nodes, saved positions
├── middleware.ts                      # Route protection (/map/*, /settings)
├── declarations.d.ts                 # CSS module declaration
public/
├── favicon.ico, favicon-16x16.png, favicon-32x32.png
├── icon-192.png, icon-512.png
├── icon-192-maskable.png, icon-512-maskable.png
├── apple-touch-icon.png
├── og-image.png
└── manifest.json                     # PWA manifest
```

---

## Database Schema

### `maps`
- `id` uuid PK
- `user_id` uuid → auth.users
- `name` text
- `emoji` text (default '🗺️', can be empty string)
- `description` text
- `created_at`, `updated_at` timestamptz

### `map_nodes`
- `id` uuid PK
- `user_id` uuid → auth.users
- `map_id` uuid → maps (cascade delete)
- `parent_id` uuid → map_nodes (cascade delete, null = root)
- `name` text
- `type` text (no constraint — any string)
- `hint`, `description`, `address`, `relationship` text
- `meta` jsonb
- `position_x`, `position_y` float (null = auto-layout)
- `color`, `shape`, `display_mode`, `abc` text (legacy + active)
- `outer_shape`, `outer_color` text
- `outer_size` float, `outer_solid` boolean
- `inner_shape`, `inner_color` text
- `inner_size` float, `inner_solid` boolean
- `image_url` text (Supabase Storage public URL)
- `tags` text[] (PostgreSQL array)
- `completed` boolean (default false)
- `created_at`, `updated_at` timestamptz

### `user_settings` (auto-created on signup via trigger)
- `id` uuid PK
- `user_id` uuid → auth.users (unique)
- `display_name` text
- `node_label`, `person_label`, `place_label`, `context_label` text
- `accent_color` text (default '#3525cd')
- `secondary_color` text (default '#4f46e5')
- `map_bg_color` text (default '#fcf9f8')

### Storage
- Bucket: `node-images` (public)
- Path: `{user_id}/{node_id}.{ext}`
- Policies: auth users upload/delete own folder; public read

### Security
- RLS on all tables: `auth.uid() = user_id`
- Cascade deletes: user → maps → nodes; node → child nodes
- Trigger: `on_auth_user_created` auto-inserts user_settings
- Trigger: `handle_updated_at` on user_settings, map_nodes, maps
- Account deletion: API route at `/api/account` uses SUPABASE_SERVICE_ROLE_KEY

---

## Key Architecture Decisions

1. **Multiple maps:** Each map is a separate tree. Nodes scoped by `map_id`. Dashboard at `/map`, canvas at `/map/[id]`.

2. **Radial tree layout:** `computeRadialLayout()` in `layout.ts`. Root found by `!parent_id`. Orphan nodes auto-attached to root. Saved positions override auto-layout.

3. **Node appearance:** Fully decoupled from type. Type is just a label string. 8 preset types each with a unique outer shape. Custom mode allows any combination.

4. **Image rendering:** SVG `<pattern>` fill. Pattern defined in `<defs>`, outer shape filled with `url(#pattern-id)`.

5. **Collapse/expand:** Client-side only (not persisted). `collapsedIds` Set tracks collapsed nodes.

6. **Search overlay:** Controlled by parent state (`searchOpen`), ⌘K shortcut. Searches name, hint, description, type, tags.

7. **Touch handling:** Separate mouse/touch handlers. Pinch-to-zoom via two-finger distance tracking. Tap detection with distance+time threshold. Touch moves throttled to ~60fps. `touch-action: none` prevents browser gestures.

8. **Mobile layout:** `h-[100dvh]` on root, header `h-16`, canvas uses `calc(100dvh - 64px)`. NodePanel goes full-screen below header on mobile (`fixed top-16 inset-x-0 bottom-0`), side panel on desktop.

9. **Templates:** 7 templates with 3-level deep trees. All template nodes use circle-in-circle style. Children and grandchildren batch-inserted via Supabase.

10. **Completed state:** Boolean on map_nodes. Toggle via button in detail panel. Canvas shows green text with ✓ prefix.

11. **PDF export:** jsPDF + svg2pdf.js. Clones SVG, adjusts viewBox to fit all nodes, sets background. Falls back to SVG download on error.

12. **Account deletion:** API route at `/api/account` (DELETE method). Uses service role key to delete user from auth.users, which cascades all data.

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` + Vercel | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + Vercel | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` + Vercel | For account deletion |

---

## SQL Migrations Run (in order)

1. Base schema (user_settings, map_nodes with RLS, triggers)
2. Node customization columns (color, display_mode, shape, abc)
3. Removed type constraint (any string allowed)
4. Outer/inner shape columns (outer_shape, outer_color, outer_size, outer_solid, inner_shape, inner_color, inner_size, inner_solid)
5. image_url column + node-images storage bucket with policies
6. maps table + map_id on map_nodes
7. map_bg_color on user_settings
8. tags text[] column on map_nodes
9. completed boolean column on map_nodes

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
| Canvas rendering, modals, search, drag, export | `src/app/(app)/map/[id]/page.tsx` |
| My Maps dashboard, templates | `src/app/(app)/map/page.tsx` |
| Layout algorithm | `src/lib/layout.ts` |
| Node types, presets, helpers | `src/lib/types.ts` |
| Data hooks (CRUD) | `src/lib/hooks.ts` |
| Visual design / CSS | `src/app/globals.css`, `tailwind.config.ts` |
| Auth flow | `src/lib/supabase/middleware.ts`, `src/middleware.ts` |
| Settings page | `src/app/(app)/settings/page.tsx` |
| Landing page | `src/app/page.tsx` |
| Logo component | `src/components/logo.tsx` |
| Loader component | `src/components/loader.tsx` |
| App header/nav | `src/app/(app)/layout.tsx` |
| Account deletion | `src/app/api/account/route.ts` |

### Database changes
Run SQL manually in Supabase SQL Editor. Update this CONTEXT.md with the migration.

---

## Design Language

- **Light theme** with surface color `#fcf9f8` (customizable via map_bg_color)
- **Dark background options:** `#1c1b1b`, `#0f172a`, `#27272a`, `#111827` — auto-adapts grid dots, text, badges
- **Indigo gradient** accent (`#3525cd` → `#4f46e5`, customizable)
- **Glass panels** (`backdrop-filter: blur`) on auth pages
- **Typography:** Manrope for headlines (bold, tight tracking), Inter for body
- **Animations:** `page-enter`, `fadeIn`, `slideUp`, `slideRight`
- **Map background:** Dot grid pattern via SVG `<pattern>`
- **Logo:** Circle outline + inner filled circle, indigo gradient
- **Loader:** Rotating dash-circle + pulsing inner dot (branded)
- **Node preset colors:** Person=#4ECDC4, Place=#FF6B6B, Context=#4f46e5, Thing=#E8A838, Idea=#A78BFA, Event=#059669, Group=#0d9488, Note=#475569
- **Node preset shapes:** Person=circle, Place=diamond, Context=square, Thing=triangle, Idea=star, Event=hexagon, Group=pentagon, Note=octagon

---

## Supabase Auth URLs (all needed)

```
http://localhost:3000/auth/callback
http://localhost:3000
https://noddic.com/auth/callback
https://noddic.com
https://www.noddic.com/auth/callback
https://www.noddic.com
```

---

## Owner Preferences

- **Hosting:** Vercel for frontend, Supabase for backend + storage
- **Email:** Resend (account exists, not yet integrated)
- **Style:** Clean, editorial, light theme — "Cartographic Silk" aesthetic
- **Domain:** noddic.com
- **Git:** GitHub repo, auto-deploys via Vercel
- **Machines:** Develops on both Windows (desktop) and Mac (laptop)
- **Preferences:** Provide complete files as downloads rather than inline edits; always specify which file to edit; one file at a time for manual pasting
- **Location:** Perth, Western Australia

---

## Next Session Todo

1. Multi-parent connections
2. Resend email integration
3. AI-assisted node creation
4. Custom icon sets (replace emojis with Lucide/Iconify)
5. Map sharing / collaboration
