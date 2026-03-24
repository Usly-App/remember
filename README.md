# Remember — Map Your People & Places

A visual mind map application that helps you remember the people and places in your life through spatial, connected thinking. Instead of lists or contacts, Remember lets you trace paths — *how* you know someone, *where* you met them, and *who* connects to whom.

## The Concept

You are the center of your map. From you, branches extend to the **contexts** of your life — your gym, your workplace, your neighbourhood, a holiday. From each context, branches extend to **people** and **places**. From those, further branches extend to related people (children, parents, partners) or sub-locations.

Every node can carry a **memory hint** — a short trigger like "tall, red hair, met through Dave" — so when you follow the path, your memory fills in the rest.

### Node Types

| Type | Purpose | Example |
|------|---------|---------|
| **You** | The root node — your center point | "Justin" |
| **Context** | A grouping or situation | "Gym", "School", "Holiday 2024" |
| **Person** | Someone you want to remember | "Sarah", "Coach Mike" |
| **Place** | A location tied to your map | "The Glass Studio", "Café on King St" |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security + Auth)
- **Styling:** Tailwind CSS with custom design system
- **Icons:** Lucide React
- **Fonts:** Manrope (headlines) + Inter (body)
- **Deployment:** Vercel (planned)
- **Email:** Resend (planned)

## Project Structure

```
remember/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page (public)
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css               # Tailwind + custom styles
│   │   ├── login/
│   │   │   └── page.tsx              # Login page
│   │   ├── signup/
│   │   │   └── page.tsx              # Signup page
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts          # Supabase auth callback handler
│   │   └── (app)/                    # Authenticated route group
│   │       ├── layout.tsx            # App shell (header, nav, logout)
│   │       ├── map/
│   │       │   └── page.tsx          # Mind map canvas (core feature)
│   │       └── settings/
│   │           └── page.tsx          # User preferences & data management
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   ├── server.ts             # Server Supabase client
│   │   │   └── middleware.ts         # Auth session management
│   │   ├── types.ts                  # TypeScript types & node config
│   │   ├── hooks.ts                  # React hooks (useUser, useNodes, useSettings)
│   │   └── layout.ts                # Radial tree layout algorithm
│   └── middleware.ts                 # Next.js route protection
├── supabase/
│   └── schema.sql                    # Full database schema + RLS + triggers
├── .env.local.example                # Environment variable template
├── tailwind.config.ts                # Tailwind theme configuration
├── next.config.js                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies
└── README.md                         # This file
```

## Pages & Routes

| Route | Auth Required | Description |
|-------|:---:|-------------|
| `/` | No | Landing page with hero, features, and CTA |
| `/signup` | No | Account creation (name, email, password) |
| `/login` | No | Email/password login |
| `/auth/callback` | No | Handles Supabase email confirmation redirects |
| `/map` | Yes | The interactive mind map canvas |
| `/settings` | Yes | Terminology, accent color, profile, data erasure |

Authenticated routes redirect to `/login` if no session exists. Auth pages redirect to `/map` if already logged in.

## Database Schema

### `user_settings`
Stores per-user preferences. Auto-created on signup via a database trigger.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to auth.users |
| `display_name` | text | User's display name |
| `node_label` | text | Custom label for generic nodes (default: "Node") |
| `person_label` | text | Custom label for person type (default: "Person") |
| `place_label` | text | Custom label for place type (default: "Place") |
| `context_label` | text | Custom label for context type (default: "Context") |
| `accent_color` | text | Primary accent hex color |
| `secondary_color` | text | Secondary accent hex color |

### `map_nodes`
Stores all nodes in the mind map as a tree structure via `parent_id`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to auth.users |
| `parent_id` | uuid | FK to map_nodes (self-referential, nullable for root) |
| `name` | text | Node display name |
| `type` | text | One of: user, person, place, context |
| `hint` | text | Memory hint / trigger |
| `description` | text | Longer description |
| `address` | text | Physical address (for places) |
| `relationship` | text | How you know them (for people) |
| `meta` | jsonb | Flexible metadata |
| `position_x` | float | Manual position override (future use) |
| `position_y` | float | Manual position override (future use) |

### Security
- **Row Level Security (RLS)** is enabled on both tables
- Every policy ensures users can only read/write their own data
- The `handle_new_user()` trigger auto-creates a `user_settings` row on signup

## Key Features

### Interactive Mind Map Canvas
- SVG-based zoomable, pannable canvas
- Radial tree auto-layout algorithm
- Nodes color-coded by type with inner symbols
- Dotted grid background for spatial orientation
- Click nodes to view details, add children, edit, or delete
- Hint text previews shown below node labels

### Settings & Customization
- **Terminology:** Rename "Person", "Place", "Context" to anything (Contact, Spot, Circle, etc.)
- **Accent colors:** 8 presets (Indigo, Teal, Rose, Amber, Violet, Emerald, Slate, Fuchsia) + custom color picker
- **Erase data:** Delete all nodes and start fresh with confirmation step

### Authentication
- Email/password signup and login via Supabase Auth
- Middleware-based route protection
- Auth callback handler for email confirmation flow

## Local Development Setup

### Prerequisites
- Node.js 18+
- A Supabase account with a project created

### Steps

1. **Clone and install:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/remember.git
   cd remember
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
   ```

3. **Run the database schema:**
   - Open your Supabase dashboard → **SQL Editor**
   - Paste the contents of `supabase/schema.sql`
   - Click **Run**
   - Verify tables in **Table Editor**: `map_nodes` and `user_settings`

4. **Configure Supabase Auth:**
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to `http://localhost:3000`
   - Add `http://localhost:3000/auth/callback` to **Redirect URLs**
   - (Optional for local dev) Go to **Providers** → **Email** → turn off **Confirm email**

5. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy
5. Update Supabase Auth **Site URL** and **Redirect URLs** to your Vercel domain

## Planned Features

- [ ] Vercel deployment
- [ ] Resend integration for transactional emails
- [ ] Multi-parent connections (node linked to multiple parents)
- [ ] Search / filter nodes
- [ ] Drag-to-reposition nodes manually
- [ ] Node images / avatars
- [ ] Export map as image or PDF
- [ ] Share encrypted map views
- [ ] Weekly "people you haven't reviewed" email digest
- [ ] Dark mode

## Design System

The visual language is inspired by an editorial, cartographic aesthetic:

- **Fonts:** Manrope (headlines, bold, tight tracking) + Inter (body, clean, readable)
- **Colors:** Light surface (#fcf9f8) with indigo accent gradient, soft borders, glass panel effects
- **Components:** Rounded corners (xl/2xl), subtle shadows, backdrop blur panels
- **Motion:** CSS animations for page transitions (fadeIn, slideUp, slideRight)
- **Map:** Dot grid background, dashed connection lines, type-coded node colors

## License

Private — not yet open source.
