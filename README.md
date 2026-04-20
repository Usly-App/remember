# Noddic — Remember Who, Where, What & Why

A visual mind map application for remembering and organizing anything — people, places, ideas, projects. Create multiple maps, customize every node's appearance, upload images, search, collapse branches, and drag nodes to arrange your world.

**Live:** [noddic.com](https://noddic.com)

## Features

### Multiple Maps
Create as many maps as you need — one for people, one for travel planning, one for study notes. Each map has its own emoji, name, and description.

### Fully Customizable Nodes
Every node can be personalized:
- **8 preset types** — Person, Place, Context, Thing, Idea, Event, Group, Note
- **Custom types** — name your own (skill, recipe, tool, anything)
- **Outer shape** — circle, square, diamond, triangle, hexagon, star, pentagon, octagon
- **Inner shape** — independent shape inside the outer, or ABC mode (1-2 characters)
- **Colors** — 12 presets + custom color picker for outer and inner independently
- **Size sliders** — control outer and inner sizes independently
- **Solid or outline** — toggle for both outer and inner shapes
- **Images** — upload photos that fill the node shape on the canvas

### Interactive Canvas
- **Pan & zoom** — drag to pan, scroll to zoom, pinch on touch
- **Drag nodes** — toggle "Move Nodes" mode to reposition any node, auto-saves position
- **Search (⌘K)** — find nodes by name, hint, description, or type; pans to result with highlight animation
- **Collapse/expand** — click the count badge to hide/show a node's children
- **Node count badges** — small badges showing direct child count on each parent node

### Memory Hints
Every node can carry a hint — "tall, red hair, met through Dave" — displayed as a subtitle on the canvas.

### Authentication
- Email/password signup and login via Supabase Auth
- Forgot password flow with email reset link
- Route protection via Next.js middleware

### Settings
- Custom terminology (rename "Node", "Person", "Place", "Context")
- Accent color picker (8 presets + custom)
- Profile management
- Data erasure

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| File Storage | Supabase Storage (node images) |
| Styling | Tailwind CSS (custom theme) |
| Icons | Lucide React |
| Fonts | Manrope (headlines) + Inter (body) |
| Deployment | Vercel |
| Email | Resend (planned) |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Landing page (public)
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Tailwind + custom styles
│   ├── login/page.tsx                # Login
│   ├── signup/page.tsx               # Signup
│   ├── forgot-password/page.tsx      # Forgot password
│   ├── reset-password/page.tsx       # Set new password
│   ├── auth/callback/route.ts        # Supabase auth callback
│   ├── privacy/page.tsx              # Privacy policy
│   ├── terms/page.tsx                # Terms of service
│   └── (app)/                        # Authenticated route group
│       ├── layout.tsx                # App shell (header, nav)
│       ├── map/
│       │   ├── page.tsx              # My Maps dashboard
│       │   └── [id]/
│       │       └── page.tsx          # Map canvas (the core page)
│       └── settings/page.tsx         # User settings
├── components/
│   └── logo.tsx                      # NoddicLogo component
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   └── middleware.ts             # Auth middleware
│   ├── types.ts                      # All TypeScript types, presets, helper getters
│   ├── hooks.ts                      # useUser, useMaps, useNodes, useSettings
│   └── layout.ts                     # Radial tree layout algorithm
├── middleware.ts                      # Route protection
supabase/
└── schema.sql                        # Base schema (see SQL migrations below)
```

## Database Schema

### `maps`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| name | text | Map name |
| emoji | text | Map icon emoji |
| description | text | Optional description |

### `map_nodes`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| map_id | uuid | FK to maps |
| parent_id | uuid | FK to map_nodes (null = root) |
| name | text | Display name |
| type | text | Any string (person, place, custom) |
| hint | text | Memory hint |
| description | text | Longer notes |
| address | text | For places |
| relationship | text | For people |
| meta | jsonb | Flexible metadata |
| position_x/y | float | Manual position (null = auto-layout) |
| outer_shape | text | circle, square, diamond, etc. |
| outer_color | text | Hex color |
| outer_size | float | Radius in px |
| outer_solid | boolean | Solid fill or outline |
| inner_shape | text | Inner shape |
| inner_color | text | Inner hex color |
| inner_size | float | Inner radius |
| inner_solid | boolean | Inner fill mode |
| display_mode | text | 'shape' or 'abc' |
| abc | text | 1-2 characters for ABC mode |
| image_url | text | Supabase Storage URL |

### `user_settings`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users (unique) |
| display_name | text | User's name |
| node/person/place/context_label | text | Custom terminology |
| accent_color | text | Primary accent hex |
| secondary_color | text | Secondary accent hex |

### Security
- RLS on all tables — users can only access their own data
- Cascade deletes throughout
- Auto-created user_settings on signup (database trigger)

### Storage
- **Bucket:** `node-images` (public)
- **Path:** `{user_id}/{node_id}.{ext}`
- **Policies:** authenticated users can upload/delete their own folder; public read

## Local Development

```bash
git clone https://github.com/YOUR-USERNAME/remember.git
cd remember
npm install
cp .env.local.example .env.local
# Add your Supabase URL and anon key to .env.local
npm run dev
```

## Deployment

1. Push to GitHub
2. Import in Vercel, add env vars
3. Update Supabase Auth redirect URLs for your domain
4. Done — auto-deploys on push

## Planned Features

- [ ] Settings page overhaul (reflect new customization options)
- [ ] Logo update (circle outline with inner circle)
- [ ] Header nav label fix ("My Maps")
- [ ] Toolbar layout cleanup
- [ ] Dark mode / map background color
- [ ] Multi-parent connections
- [ ] Tags/labels on nodes
- [ ] Export as image/PDF
- [ ] PWA support
- [ ] Resend email integration
- [ ] AI-assisted node creation

## License

Private — not yet open source.
