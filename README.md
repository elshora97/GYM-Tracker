# Gym Tracker

A mobile-first, installable Progressive Web App for tracking Push / Pull / Legs workouts, sets, weights and your gym streak. It is local-first: all data lives on the device in IndexedDB, and the app works fully offline.

**Core flow:** Open app → Start Workout → Push / Pull / Legs → pick exercises → log weight × reps → Finish → streak updates.

The app starts empty. There are no predefined exercises or sample data; each user builds their own exercise library.

## Features

- **First-launch guided tour.** A welcome card, then a spotlight walkthrough of the real UI: streak, today's workout, and the Exercises, Workout and History tabs. Shown once; replay it from Profile → App tour (`components/onboarding/app-tour.tsx`).
- **Home dashboard** with a greeting, streak card (current / longest / sessions), this week's activity strip and today's workout.
- **Push / Pull / Legs rotation** with an "Up next" suggestion and **Skip** (for example, skip Leg Day). Skip has an undo, and the rotation continues from the skipped day.
- **Fast set logging.** Each set is pre-filled from your previous session, has big −/+ steppers and numeric keyboards, and takes one tap to log. Weight changes carry over to the remaining sets, and **Add Set** duplicates the last one.
- **Workout timer** that survives refreshes, because it is derived from the stored `startedAt`.
- **Exercise library**: add, edit, move between categories, and delete. Bodyweight exercises are supported (optional added load).
- **Progress per exercise**: personal best, last workout, total sets, total volume, and weight and volume charts.
- **History** with a workouts-per-week chart, 30-day stats, and full detail for every workout.
- **Celebration screen** when you finish a workout, showing duration, exercises, sets, volume and the updated streak.
- **Settings**: name, kg / lbs, streak rules (strict, or 1–2 rest days allowed), install app, JSON export / import, and reset.
- **Responsive layout**: bottom navigation on phones and a sidebar on desktop (≥1024 px).

## 1. Installation

Requires Node.js 20.9+ (tested on Node 22).

```bash
npm install
```

## 2. Development

```bash
npm run dev        # http://localhost:3000
npm test           # unit tests (streak engine, metrics, rotation)
npm run lint
npm run typecheck
```

The service worker is only registered in production builds, so it never caches dev assets.

## 3. Production build

```bash
npm run build
npm start          # http://localhost:3000
```

Every route is statically prerendered, so the app can be hosted on any Node host (or Vercel) without a database.

## 4. PWA setup

| Piece | Where |
| --- | --- |
| Web App Manifest | `app/manifest.ts` → served at `/manifest.webmanifest` |
| Service worker | `public/sw.js`, registered in `components/layout/app-provider.tsx` |
| Icons | `public/icons/*` (regenerate with `npm run icons`) |
| iOS meta (standalone, status bar, touch icon) | `metadata.appleWebApp` in `app/layout.tsx` |
| Install prompt | `InstallBanner` on Home and the "Install app" row in Profile |

**Caching strategy** (`public/sw.js`):

- On install, every app route is pre-cached together with all `/_next/static` assets it references. The app also re-warms this cache on each start while online, so new deployments are picked up.
- Navigations are network-first and fall back to the cached page, so the app opens offline.
- `/_next/static/*` is cache-first, because those files are content-hashed and never change.
- Icons, the manifest and fonts are stale-while-revalidate.
- React Server Component data requests are never cached. If one fails offline, Next.js falls back to a full navigation, which the page cache serves.

**Installing:**

- **Android / Chrome / Edge:** use the in-app "Install" button or the browser menu → Install app.
- **iOS Safari:** Share → Add to Home Screen. The app shows these instructions on iOS.

PWAs need HTTPS in production; `localhost` is exempt for testing.

**Testing offline:** run `npm run build && npm start`, open the app once, then stop the server (or use DevTools → Network → Offline). Every page still loads, and data can still be read and written.

## 5. Data persistence

- All data is stored in **IndexedDB** via [Dexie](https://dexie.org) (`lib/storage/db.ts`). Refreshing, closing or reinstalling the app keeps your workouts.
- The app asks the browser for persistent storage (`navigator.storage.persist()`) so data isn't evicted under storage pressure.
- **Backup:** Profile → Export backup downloads a JSON file. Profile → Import backup validates the file and replaces local data (`lib/storage/backup.ts`).
- Weights are always stored in **kilograms** and converted for display, so switching kg/lbs never changes your data.

### Data model (`lib/types/index.ts`)

```
User ──< Exercise
User ──< Workout ──< WorkoutExercise ──< WorkoutSet
                         └──> Exercise
```

- `Workout`: `date` (local YYYY-MM-DD), `category`, `status` (active | completed), `startedAt`, `completedAt`, `duration`.
- `WorkoutExercise`: links a workout to an exercise, with `order` and `completed`.
- `WorkoutSet`: `setNumber`, `weight` (kg; `null` = bodyweight), `reps`, `completed`.
- Deleted exercises are archived (soft delete) so old workouts still show their names.

`docs/schema.prisma.example` is the equivalent PostgreSQL/Prisma schema for when a backend is added.

### Streak rules (`lib/streak`)

- A gym day is a calendar day with at least one **completed** workout. Several workouts on one day count once.
- **Strict** (default): days must be consecutive, and missing a day resets the current streak. With "1 rest day" or "2 rest days", gaps up to that size keep the streak alive.
- The current streak stays alive until the allowed window after your last gym day has passed.
- Skipping a rotation day does not log a workout, so it does not extend the streak.
- Current streak, longest streak, total sessions and last workout date are cached on the user record and recomputed whenever workouts change.

## 6. Project architecture

```
app/                    Routes (App Router, all client-rendered from IndexedDB)
  page.tsx              Home dashboard
  workout/              Category → exercise selection → active workout; /complete celebration
  exercises/            Library + /detail?id= progress page
  history/              History list + /detail?id= workout page
  settings/             Profile, preferences, install, backup
  manifest.ts           Web App Manifest
components/
  ui/                   shadcn/ui primitives (Radix-based)
  layout/               App shell, provider (DB init, SW, install), headers, empty states
  navigation/           Bottom nav (mobile) + sidebar (desktop)
  dashboard/ streak/    Home widgets
  workout/              Set editor, steppers, exercise logger, pickers
  exercises/ history/   Feature components
  charts/               Lightweight SVG line + bar charts
lib/
  types/                Domain models
  storage/              Dexie DB, repositories (the only code that writes data), backup
  streak/               Pure streak engine (unit tested)
  workout/              Rotation, metrics, history aggregation (pure)
  hooks/                Live-query React hooks over IndexedDB
  utils/                Dates, units, helpers
public/sw.js            Service worker
```

**Design decisions:**

- **Business logic lives outside components.** Components read through `lib/hooks/use-data.ts` (Dexie live queries, so the UI updates automatically) and write through `lib/storage/repositories/*`. To add a backend, reimplement the repositories against an API (and add sync) without touching the UI.
- **Detail pages use query strings** (`/history/detail?id=…`) instead of dynamic segments. Every route is then a static page that the service worker can pre-cache for offline use.
- **No state library.** IndexedDB is the source of truth, React state is only for UI concerns, and live queries handle reactivity.
