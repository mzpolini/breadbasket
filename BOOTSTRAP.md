# Breadbasket Authentication Bootstrap Guide

This document walks through setting up and testing the multi-tenant authentication system with Clerk.

## Prerequisites

- Project linked to Vercel: `vercel link`
- Vercel CLI installed and up-to-date: `npm install -g vercel@latest`
- Node.js 18+ and pnpm installed

## Step 1: Provision Clerk via Vercel Marketplace

The authentication system uses Clerk for identity management. You must provision it through the Vercel Marketplace to get auto-configured environment variables.

```bash
# Install Clerk from Vercel Marketplace
vercel integration add clerk
```

This will:
- Open a browser window to complete Clerk account setup (if needed)
- Create a Clerk project
- Provision `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to your Vercel project
- Output the provisioned keys

After the command completes, pull the environment variables locally:

```bash
vercel env pull .env.local --yes
```

Verify they're set:

```bash
grep CLERK .env.local
```

## Step 2: Bootstrap the Database

The database needs the seed farm and your admin user record.

### Reset the database (optional, for a clean start)

```bash
pnpm db:reset
```

### Seed the database with the worked example

```bash
pnpm db:seed
```

This creates the `seed-farm` with example crops and movements.

## Step 3: Start the Development Server

```bash
pnpm dev
```

The app runs at http://localhost:3000.

## Step 4: Create Your Admin User

In a new terminal, get your Clerk user ID after signing up:

1. Visit http://localhost:3000
2. Click "Sign Up"
3. Complete the Clerk signup form
4. After signup, you'll be redirected to `/onboarding` (you don't have a farm yet)
5. Check your browser's network tab or Clerk dashboard to find your Clerk user ID (format: `user_...`)

Then, make yourself an admin:

```bash
pnpm tsx scripts/make-admin.ts user_YOUR_ID_HERE
```

Example:

```bash
pnpm tsx scripts/make-admin.ts user_2i5z9qH5k8L4m9p0
```

## Step 5: Test the Complete Flow

### As Admin

1. Sign out or open an incognito window
2. Go to http://localhost:3000
3. Click "Sign In" and log in with your admin user
4. You should be redirected to `/admin`
5. You should see:
   - The `seed-farm` listed under "Farms"
   - A form to create new farms
   - No pending users (if this is a fresh start)

### As a Farmer (Pending)

1. Open an incognito window
2. Go to http://localhost:3000
3. Click "Sign Up" and create a new user (email: `farmer@example.com`, password: anything)
4. After signup, you land on `/onboarding` with the message "An admin needs to connect you to a farm"
5. Don't close this window yet — you'll need the user ID in the next step

### Assign the Farmer

Back in your admin window (or log back in as admin):

1. Go to http://localhost:3000/admin
2. Scroll to "Pending Users"
3. You should see `farmer@example.com` listed
4. Select "Mighty Thundercloud" (the seed farm) from the dropdown
5. Click "Assign"

### Farmer Gets Access

Back in the farmer's incognito window:

1. Refresh the page
2. You should now be redirected to `/farm/seed-farm`
3. You should see the chat interface with the existing crop data

## Step 6: Test Chat and Movements

As the farmer:

1. Type a message like: "I've got 20 pounds of tomatoes, just weighed"
2. The agent should propose a movement
3. Review the proposal in the "Commit this" card
4. Click "Sounds good" to add it to the ledger
5. Refresh the page — the movement should persist

## Troubleshooting

### "Cannot find module '@clerk/nextjs'" or similar

Your `.env.local` may not have the Clerk keys. Run:

```bash
vercel env pull .env.local --yes
npm install @clerk/nextjs
```

### "Unauthorized" or "403" on `/farm/[farmId]`

The session may have expired, or the farmId doesn't exist. Try:

1. Sign out and sign back in
2. Verify the farm exists in `/admin`

### "Database connection failed"

Ensure your database is provisioned and `.env.local` has `DATABASE_URL`. Run:

```bash
vercel env pull .env.local --yes
pnpm db:push
```

### Admin page shows no farms

The seed farm seed script may not have run. Try:

```bash
pnpm db:seed
```

## Next Steps

### Customize the Seed Farm

Edit `lib/seed/index.ts` to change the `SEED_FARM` metadata:

```ts
export const SEED_FARM = {
  id: SEED_FARM_ID,
  name: 'Your Farm Name',
  tagline: 'Your tagline',
  market: 'Where you sell',
  logo: '/brand/logo.png',
}
```

Then run:

```bash
pnpm db:seed
```

### Add Icon Files for PWA

The app is PWA-ready but needs icon files:

1. Create 192×192 and 512×512 PNG images
2. Save as `public/icon-192.png` and `public/icon-512.png`
3. (Optional) Create maskable versions for adaptive icons: `icon-192-maskable.png`, `icon-512-maskable.png`
4. The app will now be installable on home screen with icons

### Deploy to Vercel

```bash
git add .
git commit -m "Bootstrap complete"
git push
```

Vercel will auto-deploy. The Clerk keys from the Marketplace integration will be live in production.

### Create Additional Farms

Via the admin UI at `/admin`:

1. Fill in the "Create Farm" form
2. Click "Create Farm"
3. The farm is now available for farmer assignment

## Architecture Notes

- **Multi-tenant**: Each farm is isolated via `farmId`. Farmers only see their own farm; admins see all.
- **Roles**: `farmer` (one farm), `admin` (all farms), `pending` (signed in, unassigned).
- **Auth layer**: `lib/auth/current-user.ts` gates all routes and server actions.
- **Storage**: `lib/storage/farms.ts` and `lib/storage/users.ts` manage identity records.
- **Chat**: The `/api/chat` route validates `farmId` from the request body before processing.

## Security Reminders

- Never commit `.env.local` — it contains secrets
- The `CLERK_SECRET_KEY` is server-only and never sent to the client
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is safe to commit (public)
- All routes are protected by `requireFarmAccess` or `requireAdmin` checks
