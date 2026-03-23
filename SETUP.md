# 許氏族譜 — Setup Guide

## Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account
- A Google Cloud project (for OAuth)

---

## Step 1 — Create a Supabase Project

1. Go to https://supabase.com → **New project**
2. Choose a name (e.g. `xiefamilytree`), set a strong password, pick a region
3. Wait ~2 min for provisioning

---

## Step 2 — Set Up the Database

In Supabase → **SQL Editor** → **New query**:

1. Paste the contents of `supabase/schema.sql` → **Run**
2. Paste the contents of `supabase/seed.sql` → **Run**

Verify in **Table Editor** → `family_members` (should show 107 rows).

---

## Step 3 — Configure Google OAuth

### A. Google Cloud Console

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Fill in App name, support email
   - Add scope: `email`, `profile`, `openid`
   - Save
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `xiefamilytree`
   - **Authorised redirect URIs** — add:
     ```
     https://<your-supabase-project>.supabase.co/auth/v1/callback
     ```
   - Copy the **Client ID** and **Client Secret**

### B. Supabase Auth

1. Supabase → **Authentication → Providers → Google**
2. Enable Google provider
3. Paste the **Client ID** and **Client Secret** from above
4. Save

---

## Step 4 — Get Supabase API Keys

Supabase → **Settings → API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 5 — Local Development

```bash
cd family-tree
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key in .env.local
npm install
npm run dev
# Open http://localhost:3000
```

---

## Step 6 — Deploy to Vercel

### A. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit — 許氏族譜"
git remote add origin https://github.com/<you>/xiefamilytree.git
git push -u origin main
```

### B. Import in Vercel
1. https://vercel.com → **Add New Project**
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. **Environment Variables** — add:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJh...
   ```
5. Deploy

### C. Add Vercel URL to Google OAuth
After deploying, add your Vercel URL to:
- Google Cloud Console → OAuth client → **Authorised redirect URIs**:
  ```
  https://xiefamilytree.vercel.app/api/auth/callback
  ```
- Supabase → **Authentication → URL Configuration → Site URL**:
  ```
  https://xiefamilytree.vercel.app
  ```
  And under **Redirect URLs**:
  ```
  https://xiefamilytree.vercel.app/api/auth/callback
  ```

---

## Adding / Removing Editor Emails

Edit `lib/constants.ts`:
```typescript
export const AUTHORIZED_EDITORS: string[] = [
  'alphaxie1988@gmail.com',
  // 'another@example.com',
]
```

---

## Features

| Feature | Description |
|---|---|
| Public view | Anyone can view the full tree without logging in |
| Google login | Sign in with Google |
| Edit mode | Authorized emails see ✎ Edit Mode badge |
| Edit node | Click any node → edit name, spouse, generation, deceased status, notes |
| Add child | In edit modal → "Add Child" tab → creates new node |
| Zoom / Pan | Scroll wheel, pinch, or use ± buttons |
| Fit view | ⊞ button fits entire tree in viewport |
| Animations | Nodes fade in, connector lines draw on load |
| Bilingual | Chinese + English throughout |

---

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** (PostgreSQL + Auth + RLS)
- **D3.js** (tree layout + zoom/pan)
- **Tailwind CSS** + custom CSS (Chinese traditional style)
- **Google Fonts** — Noto Serif SC
