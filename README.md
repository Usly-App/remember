# Noddic — Remember Who, Where, What & Why

A visual mind map application for remembering and organizing anything — people, places, ideas, projects. Create multiple maps from templates, customize every node, upload images, tag, search, collapse branches, mark complete, and export to PDF.

**Live:** [noddic.com](https://noddic.com)

## Features

### Multiple Maps with Templates
Create maps from scratch or use one of 7 rich templates (People, Travel, Study, Recipe, Project, Neighbourhood, Idea). Templates pre-create 15-25 nodes in a 3-level tree structure so you can start organizing immediately.

### Fully Customizable Nodes
- **8 preset types** — Person, Place, Context, Thing, Idea, Event, Group, Note (each with a unique shape)
- **Custom types** — name your own (skill, recipe, tool, anything)
- **Shape options** — circle, square, diamond, triangle, hexagon, star, pentagon, octagon
- **Colors** — 12 presets + custom color picker for outer and inner independently
- **Display modes** — Shape-in-shape or ABC (1-2 character) mode
- **Images** — upload photos that fill the node shape on the canvas
- **Tags** — add multiple tags to any node, searchable
- **Completed state** — mark nodes as done with a toggle

### Interactive Canvas
- **Pan & zoom** — drag to pan, scroll wheel to zoom, pinch-to-zoom on mobile
- **Drag nodes** — toggle move mode to reposition any node, auto-saves
- **Search (⌘K)** — find nodes by name, hint, description, type, or tag
- **Collapse/expand** — click count badges to hide/show branches
- **Export to PDF** — download your map as a PDF or SVG file
- **Dark background support** — adaptive grid, text, and badge colors

### Settings
- Profile (display name)
- Custom terminology labels
- Accent color (8 presets + custom)
- Map background color (10 presets + custom, including dark options)
- Danger zone (erase data, delete account)

### Mobile Optimized
- Pinch-to-zoom and tap detection
- Full-screen node detail panel on mobile
- Compact toolbar with responsive sizing
- Dynamic viewport height (accounts for mobile browser chrome)

### PWA Ready
Installable on desktop (Chrome/Edge) and mobile. Manifest and icons included.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| File Storage | Supabase Storage (node images) |
| PDF Export | jsPDF + svg2pdf.js |
| Styling | Tailwind CSS (custom theme) |
| Icons | Lucide React |
| Fonts | Manrope (headlines) + Inter (body) |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── layout.tsx                    # Root layout (meta, icons, viewport)
│   ├── globals.css                   # Tailwind + custom styles
│   ├── login/page.tsx                # Login
│   ├── signup/page.tsx               # Signup
│   ├── forgot-password/page.tsx      # Forgot password
│   ├── reset-password/page.tsx       # Set new password
│   ├── auth/callback/route.ts        # Supabase auth callback
│   ├── api/account/route.ts          # DELETE endpoint for account deletion
│   ├── privacy/page.tsx              # Privacy policy
│   ├── terms/page.tsx                # Terms of service
│   └── (app)/                        # Authenticated route group
│       ├── layout.tsx                # App shell (header, nav, h-[100dvh])
│       ├── map/
│       │   ├── page.tsx              # My Maps dashboard + template picker
│       │   └── [id]/
│       │       └── page.tsx          # Map canvas (core page)
│       └── settings/page.tsx         # User settings
├── components/
│   ├── logo.tsx                      # NoddicLogo (circle outline + inner circle)
│   └── loader.tsx                    # NoddicLoader (branded loading animation)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   └── middleware.ts             # Auth middleware
│   ├── types.ts                      # Types, presets, helper getters
│   ├── hooks.ts                      # useUser, useMaps, useNodes, useSettings
│   └── layout.ts                     # Radial tree layout algorithm
├── middleware.ts                      # Route protection
public/
├── favicon.ico                       # Multi-size favicon
├── favicon-16x16.png, favicon-32x32.png
├── icon-192.png, icon-512.png        # PWA icons
├── icon-192-maskable.png, icon-512-maskable.png
├── apple-touch-icon.png              # iOS icon
├── og-image.png                      # Social sharing image
└── manifest.json                     # PWA manifest
```

## Database Schema

### `maps`
id, user_id, name, emoji, description, created_at, updated_at

### `map_nodes`
id, user_id, map_id, parent_id, name, type, hint, description, address, relationship, meta, position_x, position_y, outer_shape, outer_color, outer_size, outer_solid, inner_shape, inner_color, inner_size, inner_solid, display_mode, abc, image_url, tags, completed, created_at, updated_at

### `user_settings`
id, user_id, display_name, node_label, person_label, place_label, context_label, accent_color, secondary_color, map_bg_color, created_at, updated_at

### Storage
- **Bucket:** `node-images` (public)
- **Path:** `{user_id}/{node_id}.{ext}`

### Security
- RLS on all tables (auth.uid() = user_id)
- Cascade deletes throughout
- Account deletion via API route with service role key

## Local Development

```bash
git clone https://github.com/YOUR-USERNAME/remember.git
cd remember
npm install
cp .env.local.example .env.local
# Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | For account deletion (server-side only) |

## Planned Features

- [ ] Multi-parent connections
- [ ] Resend email integration
- [ ] AI-assisted node creation
- [ ] Custom icon sets (Lucide/Iconify)

## License

Private — not yet open source.
