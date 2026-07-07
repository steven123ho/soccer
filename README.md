# ⚽ Soccer Pickup - FIFA Edition

A modern soccer pickup group management app with FIFA-style player cards, team selection, polls, and player ratings.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Netlify
- **Icons**: Lucide React

## ✨ Features

- **FIFA-Style Player Cards** - Beautiful cards with 6 stats (Pace, Shooting, Passing, Dribbling, Defending, Physical)
- **Player Ratings** - Community voting system that averages ratings
- **Team Picker** - Random team selection or captain-based drafting
- **Polls** - Schedule games and vote on options
- **Authentication** - Secure user authentication via Supabase Auth

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Netlify account (free tier works)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for your project to be ready (2-3 minutes)
3. Go to Settings → API and copy:
   - Project URL
   - anon public key

### 3. Run Database Migration

1. In Supabase, go to SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL to create all tables and set up RLS policies

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚢 Deployment to Netlify

### Option 1: Netlify CLI (Recommended)

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Build and deploy:
```bash
npm run build
netlify deploy --prod
```

### Option 2: Netlify Dashboard

1. Push your code to GitHub
2. In Netlify, click "Add new site" → "Import from Git"
3. Connect your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Deploy!

## 📁 Project Structure

```
soccer/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI components (Button, Card, Modal)
│   ├── auth-button.tsx   # Authentication UI
│   ├── navigation.tsx    # Bottom navigation
│   ├── home-page.tsx     # Home page component
│   ├── players-page.tsx  # Players page
│   ├── team-picker-page.tsx # Team picker
│   ├── team-builder.tsx  # Team builder
│   ├── polls-page.tsx    # Polls page
│   ├── profile-page.tsx  # Profile page
│   ├── player-card.tsx   # Player card component
│   ├── player-detail-modal.tsx  # Player detail modal
│   └── image-crop-modal.tsx    # Image cropping modal
├── lib/                   # Utilities
│   ├── supabase/         # Supabase client
│   │   └── client.ts     # Supabase client initialization
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Helper functions
├── supabase/             # Database schema and migrations
│   ├── schema.sql        # Main database schema
│   └── migrations/       # Database migrations
│       ├── allow_self_rating.sql
│       ├── add_photo_offsets.sql
│       └── add_nationality.sql
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind config
└── netlify.toml          # Netlify config
```

## 🗄️ Database Schema

The app uses the following tables:

- `players` - Player information
- `player_stats` - Player statistics (averaged from votes)
- `stat_votes` - Individual votes on player stats
- `teams` - Team information
- `team_members` - Team-player relationships
- `polls` - Poll information
- `poll_options` - Poll options
- `poll_votes` - Individual poll votes

All tables have Row Level Security (RLS) enabled for data protection.

## 🔐 Authentication

The app uses Supabase Auth for authentication. Users can:
- Sign up with email/password
- Sign in with existing credentials
- Sign out securely

Authentication is required for:
- Creating players
- Voting on player stats
- Creating polls
- Voting in polls

## 🎨 Customization

### Colors

Edit `tailwind.config.ts` to customize the color scheme:

```typescript
colors: {
  primary: {
    DEFAULT: '#3b82f6',  // Blue
    dark: '#2563eb',
    light: '#60a5fa',
  },
  secondary: {
    DEFAULT: '#ff006e',  // Pink
    dark: '#d6005c',
    light: '#ff4d94',
  },
}
```

### Card Rarities

Player cards have 4 rarity levels based on overall rating:
- Bronze (60-69)
- Silver (70-79)
- Gold (80-89)
- Special (90+)

## 📝 Development Notes

- The app uses Next.js App Router with client components for interactivity
- Supabase real-time subscriptions can be added for live updates
- TypeScript provides type safety throughout the app
- TailwindCSS enables rapid UI development

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use this project for your own soccer pickup group!
