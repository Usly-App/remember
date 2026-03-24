# Remember — Map Your People & Places

A visual mind map app to remember the people and places in your life. Built with Next.js, Supabase, and Tailwind CSS.

## Quick Start (Local Development)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

**Option A — Supabase Cloud (recommended for quick start):**

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy your project URL and anon key

**Option B — Supabase Local (via Docker):**

```bash
npx supabase init
npx supabase start
# Then run schema.sql in the local SQL editor at http://127.0.0.1:54323
```

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deploying to Vercel

1. Push the repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add the Supabase environment variables in Vercel's project settings
4. Deploy!

### Supabase Auth redirect URL

In your Supabase project, go to **Authentication → URL Configuration** and add:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/auth/callback`

## Adding Resend (Email)

When ready to add transactional emails (welcome emails, weekly digests, etc.):

1. Sign up at [resend.com](https://resend.com)
2. Add `RESEND_API_KEY` to your environment variables
3. Install: `npm install resend`
4. Create API routes in `src/app/api/email/` for each email type

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Login
│   ├── signup/page.tsx       # Signup
│   ├── auth/callback/route.ts # Supabase auth callback
│   ├── (app)/                # Authenticated layout group
│   │   ├── layout.tsx        # App shell (header, nav)
│   │   ├── map/page.tsx      # Mind map canvas
│   │   └── settings/page.tsx # User settings
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Tailwind + custom styles
├── lib/
│   ├── supabase/             # Supabase clients
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   └── middleware.ts     # Auth middleware
│   ├── types.ts              # TypeScript types
│   ├── hooks.ts              # React hooks (auth, nodes, settings)
│   └── layout.ts             # Radial tree layout engine
├── middleware.ts              # Next.js middleware (auth guard)
supabase/
└── schema.sql                # Database schema + RLS policies
```

## Customization

In **Settings**, users can:

- Rename node types (Person → Contact, Context → Circle, etc.)
- Choose accent colors from presets or a custom picker
- Erase all map data to start over
