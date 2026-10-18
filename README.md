# TeamSync — Intelligent Team Formation System

> Smart team building with complementary-skill matching for collaborative projects.

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-Data_Visualization-244c43?style=flat)](https://recharts.org/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [Database and Evaluation](#database-and-evaluation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [Related Documentation](#related-documentation)

---

## Overview

**TeamSync** is a peer project team-formation application that matches collaborators using complementary skills, role requirements, experience diversity, and availability. It supports project discovery, profile management, applications, team formation, team analysis, chat, invitations, and gamification.

### Problem Statement

Traditional team formation often relies on manual selection, random assignment, or existing friendships. Those approaches can leave skill gaps, duplicate strengths, and unclear ownership of project roles.

### Solution

TeamSync provides:

- **Skill complementarity matching** — prioritizes marginal skill gain rather than simple similarity.
- **Role-aware applications** — candidates apply for specific project roles and available slots.
- **Availability analysis** — profiles and teams can compare shared working time.
- **Team Balance Index** — summarizes skill coverage, role diversity, experience mix, and availability overlap.
- **Real-time Firestore updates** — project, application, team, and chat state can update without manual refreshes.
- **Achievement and leaderboard support** — backend gamification tracks collaboration milestones and points.

---

## Features

### Authentication and Profiles

- Firebase Authentication with email/password.
- User profiles with department, study year, experience level, bio, skills, preferred roles, and availability.
- Video introduction upload through Firebase Storage.

### Intelligent Matching

The matching engine scores candidates using configurable weights for:

- Marginal skill gain and complementarity.
- Role compatibility and available role slots.
- Availability overlap.
- Experience diversity.

The active weights are defined in [`functions/src/matching/config.js`](functions/src/matching/config.js).

### Project Management

- Create, browse, edit, and close projects.
- Define domains, deadlines, team sizes, required skills, and required roles.
- Search and filter projects by text, domain, skill, and role.

### Applications and Teams

- Apply for a project role.
- View application status and match score.
- Withdraw pending applications.
- Project owners can accept or reject applications.
- Accepted applications populate team membership through backend triggers.
- Candidate impact previews and skill-gap analysis are available to project owners.

### Team Workspace

- Team Lab scenario planning.
- Growth profile preferences.
- Team invitations.
- Team chat channels.
- Team availability overlap visualization.
- Team Balance Index history.

### Gamification

The backend supports achievements, points, and leaderboard entries. The Dashboard displays achievement progress and leaderboard information when the corresponding data exists.

---

## Tech Stack

### Frontend

- **React 18.3.1** — UI framework.
- **Vite 8.3.4** — development server and production build tool.
- **Tailwind CSS 3.4.19** — utility styling and design tokens.
- **React Router 7.18.4** — client-side routing.
- **Firebase Web SDK 13.0.0** — Authentication, Firestore, Functions, and Storage clients.
- **Recharts 2.x** — radar, bar, and line charts; chart sections are lazy-loaded.

Versions are declared in [`frontend/package.json`](frontend/package.json); the lockfile records the resolved versions.

### Backend

- **Firebase Cloud Functions 7.4.0** — callable functions, HTTP API, Firestore triggers, and scheduled jobs.
- **Node.js 22** — Cloud Functions runtime.
- **Express 4.x** — read-only REST facade under `/api`.
- **Firebase Admin SDK 14.5.0** — server-side Firebase access.

### Database, Storage, and Security

- **Cloud Firestore** — projects, users, applications, teams, analytics, chat, invitations, achievements, and leaderboard data.
- **Firebase Authentication** — email/password accounts.
- **Firebase Storage** — video introductions.
- **Firestore and Storage Security Rules** — authorization and data validation.
- **Firestore indexes** — query support for applications, team members, invitations, and project listings.

### Development and Testing

- **Jest 30.5.2** — backend matching-engine tests.
- **Firebase CLI** — rules, indexes, Functions, and Hosting deployment.
- **Firebase Emulator configuration** — ports are defined in [`firebase.json`](firebase.json); emulator binaries must be initialized locally before use.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React)                       │
│  Auth • Profiles • Projects • Applications • Team Lab   │
│  Dashboard • Chat • Matching UI • Gamification UI       │
└────────────────────┬────────────────────────────────────┘
                     │ Firebase SDK / HTTPS callable API
┌────────────────────▼────────────────────────────────────┐
│              CLOUD FUNCTIONS (Node.js 22)               │
│  Matching • Applications • Team triggers • Chat         │
│  Recommendations • Gamification • REST read facade      │
└────────────────────┬────────────────────────────────────┘
                     │ Firebase Admin SDK
┌────────────────────▼────────────────────────────────────┐
│                  FIREBASE SERVICES                      │
│  Authentication • Firestore • Storage • Hosting         │
└─────────────────────────────────────────────────────────┘
```

Firestore uses project subcollections such as `applications`, `teamMembers`, `team`, `tbiHistory`, `recommendations`, and `channels/messages` rather than a separate top-level `teams` collection.

---

## Getting Started

### Prerequisites

- Node.js 22 or a compatible current Node.js release for local development.
- npm.
- Firebase CLI: `npm install -g firebase-tools`.
- Access to the Firebase project configured in `.firebaserc`, or your own Firebase project.

### Installation

1. **Install frontend dependencies**
   ```powershell
   cd frontend
   npm install
   ```

2. **Install Functions dependencies**
   ```powershell
   cd ..\functions
   npm install
   ```

3. **Configure the frontend**
   ```powershell
   cd ..\frontend
   Copy-Item .env.example .env
   # Fill .env with the Firebase Web App configuration.
   # Never commit .env.
   ```

4. **Run the frontend locally**
   ```powershell
   npm run dev
   ```

   Open `http://localhost:5173`.

5. **Deploy Firestore rules and indexes**
   ```powershell
   firebase deploy --only firestore --project YOUR_PROJECT_ID
   ```

6. **Deploy Storage rules**
   ```powershell
   firebase deploy --only storage --project YOUR_PROJECT_ID
   ```

7. **Deploy Cloud Functions** (before Hosting, so the callable functions the client uses already exist)
   ```powershell
   firebase deploy --only functions --project YOUR_PROJECT_ID
   ```

8. **Build and deploy Hosting**
   ```powershell
   cd frontend
   npm run build
   cd ..
   firebase deploy --only hosting --project YOUR_PROJECT_ID
   ```

For the full deployment procedure (pre-flight checks, environment variables, post-deploy checklist, rollback and production caveats), see [`DEPLOYMENT.md`](DEPLOYMENT.md). For first-time Firebase setup, see [`SETUP.md`](SETUP.md) and [`FIREBASE_STORAGE_SETUP.md`](FIREBASE_STORAGE_SETUP.md).

### Optional data setup

The default synthetic dataset is generated by [`functions/scripts/generateData.js`](functions/scripts/generateData.js) and written by [`functions/scripts/seed.js`](functions/scripts/seed.js): 120 users and 35 projects by default.

```powershell
cd functions
$env:GOOGLE_APPLICATION_CREDENTIALS="service-account-key.json"
npm run seed
```

The service-account key is intentionally ignored and must not be committed.

Two standalone demo-data scripts also exist in `functions/scripts/`. Both read `functions/service-account-key.json`, write to the Firebase project that key belongs to, and have no npm script, so run them deliberately and never against a production project:

- [`createCompleteDemo.js`](functions/scripts/createCompleteDemo.js) creates the 10 demo users listed in [`DEMO_CREDENTIALS.md`](DEMO_CREDENTIALS.md) (Auth accounts, profiles and applications).
- [`generate500Records.js`](functions/scripts/generate500Records.js) bulk-creates a large set of Auth users and records (the "500+ users" dataset mentioned in the project report and presentation).

---

## Demo Accounts

The repository includes documented demo accounts in [`DEMO_CREDENTIALS.md`](DEMO_CREDENTIALS.md). All listed demo accounts use the password documented there.

Use a dedicated non-production account when testing destructive or data-changing workflows.

---

## Database and Evaluation

Database behavior is defined by:

- [`firestore.rules`](firestore.rules) — Firestore authorization and validation.
- [`firestore.indexes.json`](firestore.indexes.json) — Firestore composite indexes.
- [`storage.rules`](storage.rules) — Storage authorization and upload constraints.
- [`functions/scripts/seed.js`](functions/scripts/seed.js) — synthetic Firestore data setup.
- [`functions/scripts/evaluate.js`](functions/scripts/evaluate.js) — in-memory matching-engine evaluation.
- [`DATABASE_REPORT_COMPLETE.docx`](DATABASE_REPORT_COMPLETE.docx) — project database report.

Run the matching evaluation with:

```powershell
cd functions
npm run evaluate
```

The evaluation writes the generated `functions/scripts/evaluation_results.json` file. It is an output artifact and is not expected to exist until the evaluation is run.

---

## Project Structure

```text
TeamSync/
├── frontend/
│   ├── public/                  # Manifest, service worker, offline page, favicon
│   ├── src/pages/               # Login, Dashboard, Projects, Profile, Team Lab, etc.
│   ├── src/components/          # Reusable UI, chat, charts, video, and scheduler components
│   ├── src/firebase.js          # Firebase client initialization
│   ├── src/api.js               # Callable Functions client wrappers
│   ├── src/auth.jsx             # Auth and account context
│   ├── src/index.css            # Tailwind/global design system
│   └── package.json
├── functions/
│   ├── src/matching/            # Matching engine and configuration
│   ├── src/services/             # Derived data and team services
│   ├── src/callables.js          # Authenticated callable workflows
│   ├── src/triggers.js           # Firestore triggers
│   ├── src/chat.js               # Chat Functions
│   ├── src/gamification.js       # Achievement and leaderboard Functions
│   ├── scripts/                  # Seed, evaluation, and demo setup scripts
│   ├── test/                     # Jest tests
│   └── package.json
├── firebase.json                 # Firebase deployment and emulator configuration
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore indexes
├── storage.rules                 # Storage security rules
├── README.md                     # Project documentation
├── SETUP.md                      # Detailed setup guide
├── DEMO_CREDENTIALS.md           # Demo account information
└── requirements.pdf              # Project requirements
```

---

## Testing

### Frontend checks

```powershell
cd frontend
npm run lint        # ESLint, including React hooks rules
npm test            # Vitest unit tests (validation, auth messages, config, titles)
npm run build       # production build into frontend/dist
npm run test:e2e    # builds, then runs Playwright against dist (uses installed Chrome)
```

The Playwright suite covers public pages, password reset, the 404 page, PWA behaviour (manifest, icons, service worker, offline page, update flow), security headers, accessibility (axe-core, WCAG 2.x A/AA rules) and responsive layouts at nine viewport sizes. Signed-in specs run only when `E2E_EMAIL` and `E2E_PASSWORD` are set (use a dedicated test account; the specs never write data). `npm run serve:dist` serves the production build with the headers from `firebase.json` for manual inspection.

### Backend unit tests

```powershell
cd functions
npm test
```

### Matching-engine evaluation

```powershell
cd functions
npm run evaluate
```

The unit tests cover availability helpers, skill coverage, complementarity scoring, role fit, Team Balance Index, and candidate-impact previews.

---

## Contributing

1. Create a feature branch.
2. Preserve existing business logic unless a verified defect requires a change.
3. Run the frontend build and backend tests before submitting changes.
4. Do not commit `.env`, service-account keys, generated `dist` output, dependency directories, or temporary files.
5. Include security-rule and index changes with the feature that requires them.

---

## Related Documentation

- [`DEPLOYMENT.md`](DEPLOYMENT.md)
- [`SETUP.md`](SETUP.md)
- [`DEMO_CREDENTIALS.md`](DEMO_CREDENTIALS.md)
- [`FIREBASE_STORAGE_SETUP.md`](FIREBASE_STORAGE_SETUP.md)
- [`SECURITY_ALERT.md`](SECURITY_ALERT.md)
- [`DATABASE_REPORT_COMPLETE.docx`](DATABASE_REPORT_COMPLETE.docx)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org/en-US/)

---

Copyright (c) 2024 TeamSync Project
