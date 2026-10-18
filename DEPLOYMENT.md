# TeamSync Deployment Guide

This guide takes the app from a clean checkout to a hosted Firebase deployment. Nothing in the repository deploys automatically: every command below is run by a person.

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 22.x | Required by the Cloud Functions runtime (`functions/package.json` pins `engines.node` to 22). |
| npm | 10+ | Ships with Node 22. On Windows PowerShell use `npm.cmd` if the `npm` shim misbehaves. |
| Firebase CLI | 15+ | `npm install -g firebase-tools`, then `firebase login`. |
| Google Chrome | current | Only for the Playwright tests and icon generation. |
| Firebase project | Blaze plan | Cloud Functions require the pay-as-you-go plan. Firestore, Auth, Hosting and Storage also need to be enabled. |

## 2. Environment variables

The frontend reads its Firebase web configuration at **build time** from `frontend/.env` (git-ignored) or from the build environment. Copy `frontend/.env.example` and fill it in.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | yes | Firebase web API key. A public client identifier, not a secret. Restrict it (section 6). |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes | `<project-id>.firebaseapp.com`. |
| `VITE_FIREBASE_PROJECT_ID` | yes | Firebase project id. |
| `VITE_FIREBASE_APP_ID` | yes | Web app id (`1:...:web:...`). |
| `VITE_FIREBASE_STORAGE_BUCKET` | for video intros | Bucket used by profile video uploads. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | no | Not used by current features. |
| `VITE_FUNCTIONS_REGION` | no | Defaults to `asia-south1`; must match where the functions are deployed. |
| `VITE_USE_EMULATORS` | no | Must be `false` (or unset) for production builds. |

If a required variable is missing, the built app shows a "TeamSync is not configured" screen that lists the missing variable names (never their values) instead of failing with an opaque Firebase error.

Never put the Admin SDK service-account key, `.env` files or any other credential in `frontend/`. Anything in `VITE_*` ends up in the public JavaScript bundle.

## 3. Pre-flight checks

Run from `frontend/` unless noted.

```bash
npm ci
npm run lint            # ESLint (react-hooks rules included); must exit 0
npm test                # Vitest unit tests
npm run build           # production build into frontend/dist
npm audit --omit=dev --audit-level=high   # runtime dependencies
```

Optional but recommended end-to-end checks. They serve `frontend/dist` with the headers from `firebase.json` and drive the real Chrome install:

```bash
# Public flows, PWA, offline, responsive layouts (no account needed)
npm run test:e2e

# Also run the signed-in specs (read-only; use a dedicated test account)
E2E_EMAIL=you@example.com E2E_PASSWORD=... npm run test:e2e      # bash
$env:E2E_EMAIL='you@example.com'; $env:E2E_PASSWORD='...'; npm run test:e2e   # PowerShell
```

From `functions/`:

```bash
npm ci
npm test -- --runInBand     # matching-engine unit tests
```

Dry-run every deploy target before the real thing. Dry runs validate configuration and upload nothing:

```bash
firebase deploy --only firestore --dry-run
firebase deploy --only storage --dry-run
firebase deploy --only functions --dry-run
firebase deploy --only hosting --dry-run
```

## 4. Deploy order

Use the project in `.firebaserc` (or `firebase use <project-id>`).

1. **Firestore rules and indexes**: `firebase deploy --only firestore:rules,firestore:indexes`. Indexes can take several minutes to build; the client avoids depending on composite indexes for Team Lab invitations.
2. **Storage rules** (if profile videos are used): `firebase deploy --only storage`.
3. **Cloud Functions**: `firebase deploy --only functions`. The first deploy takes several minutes. Features that call callable functions (applying to projects, accepting/rejecting applicants, recommendations, team chat messages) will not work until this step succeeds. The achievements dashboard falls back to direct Firestore reads.
4. **Hosting**: `npm run build` in `frontend/`, then `firebase deploy --only hosting`.

Deploy rules before hosting so the new client never talks to older, looser rules. Deploy functions before hosting so callable names the client uses already exist.

### What the hosting configuration does

`firebase.json` serves `frontend/dist` and:

- forwards `/api/**` to the `api` Cloud Function (a read-only, bearer-token-authenticated REST facade: `/api/health`, `/api/projects/:id/recommendations`, `/api/projects/:id/preview/:candidateId`, `/api/analytics`). It only works once the functions are deployed;
- rewrites every other non-file URL to `/index.html` (single-page-app routing; unknown routes show the in-app 404 page);
- sends a Content-Security-Policy that allows scripts only from the site itself, and network calls only to the Firebase endpoints the app uses;
- sets `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`;
- caches `/assets/*` (content-hashed) for a year as immutable, and sets `no-cache` on `index.html`, `sw.js`, `manifest.json` and the offline page so a new release is picked up immediately.

If you add a new third-party origin (analytics, fonts CDN, maps, ...) the CSP in `firebase.json` must be extended, otherwise the browser will block it.

## 5. After deploying: verification checklist

Replace `https://<site>` with the hosting URL.

- [ ] `https://<site>/` loads over HTTPS and redirects signed-out visitors to `/login`.
- [ ] `curl -sI https://<site>/` shows the `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` headers, and `Cache-Control: no-cache`.
- [ ] `curl -sI https://<site>/sw.js` shows `Cache-Control: no-cache`; an asset under `/assets/` shows `immutable`.
- [ ] A deep link such as `https://<site>/dashboard` works on a hard refresh, and `https://<site>/nonexistent` shows the "Page not found" page.
- [ ] Sign in, sign out, and "Forgot your password?" (check the reset email arrives; customise the template under Authentication > Templates).
- [ ] Browser console is free of CSP violations while browsing every page.
- [ ] Chrome DevTools > Application: manifest has no errors, icons are listed, the service worker is activated, and "Install" is offered.
- [ ] Go offline (DevTools > Network > Offline) and reload: the "You are offline" page appears and recovers when you reconnect.
- [ ] Deploy a trivial change, reload an open tab: the "A new version of TeamSync is ready" banner appears and the page reloads only when "Reload to update" is pressed.
- [ ] Callable functions respond (apply to a project with a test account, send a team chat message). Check Functions logs for errors.
- [ ] Run Lighthouse against the production URL (the local numbers do not include real network, CDN or HTTP/2 effects).

## 6. Production hardening to do in the Firebase / Google Cloud console

1. **Restrict the web API key** (Google Cloud Console > APIs & Services > Credentials) to your hosting domains (HTTP referrers) and to the Firebase APIs the app uses.
2. **Authentication > Settings > Authorized domains**: confirm only your real domains are listed. Consider enabling email-enumeration protection.
3. **App Check** (recommended) for Firestore, Storage and Functions to reduce abuse from non-app clients.
4. **Budgets and alerts** on the Blaze plan.
5. **Firestore rules review**: see "Known production caveats" below before opening the app to the public.

## 7. Rollback

Hosting keeps previous releases: Firebase console > Hosting > Release history > **Roll back** on the previous version (or redeploy a known-good `frontend/dist`). Because `index.html` and `sw.js` are `no-cache`, clients pick the rolled-back release on their next load; the service worker's update banner appears for tabs that are already open. Firestore rules and function deployments are rolled back by redeploying the previous commit.

## 8. Known production caveats

These are documented rather than silently changed because they alter data-access behaviour:

- **Demo-data helpers in the client and rules.** `frontend/src/init.js` seeds master data (skills, roles, demo projects) from the browser when the database is nearly empty, and `firestore.rules` contains `isDemo` clauses that let any signed-in user create/modify users flagged `isDemo`, and create `skills` / `roles` documents. That is convenient for a class demo but is too permissive for a public launch. Before opening sign-ups beyond a trusted group, seed master data with `functions/scripts/seed.js` (Admin SDK), remove `ensureDataInitialized`, and tighten the rules so master data and `isDemo` documents are writable only by the Admin SDK.
- **Cloud Functions are deployed separately from Hosting, and the cloud copy can lag the code.** Hosting (`firebase deploy --only hosting`) never updates functions. On 2026-10-17 the project had 19 functions deployed on the Node.js 20 runtime from older code; `getUserAchievements`, `getLeaderboard` and the gamification triggers (`onApplicationAccepted`, `onProjectCreated`, `onSkillAdded`, `onTeamMemberAdded`) were not deployed, and Node 20 is being retired. Run `firebase deploy --only functions` (Node 22 code) to bring them in line. Check with `firebase functions:list`.
- **Single-page-app cache headers.** Firebase applies header rules by the requested URL, not the rewritten file, so `firebase.json` sets `Cache-Control: no-cache` for every path first and then overrides it for `/assets/**` and `/icons/**` (later rules win). Without this, deep links such as `/dashboard` were served with a one-hour cache and could show stale HTML after a release.
- **`npm audit` (full, including dev tools)** reports vulnerabilities that all come from Tailwind CSS v3's build-time dependency chain (`braces`, `micromatch`, `fast-glob`, `postcss-selector-parser`). They are not shipped to users (`npm audit --omit=dev` is clean). Fixing them requires migrating to Tailwind CSS v4.
