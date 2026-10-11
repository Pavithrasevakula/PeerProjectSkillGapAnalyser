# Peer Project Team Formation & Skill-Gap Matcher

React + Firebase (Firestore, Auth, Cloud Functions) + Node/Express implementation of the project report.

```
firebase.json  firestore.rules  firestore.indexes.json     Firebase config, security rules (the "DDL"), Table 25 indexes
functions/
  index.js                      Exports every function (region asia-south1)
  src/matching/{config,engine}.js   Pure, unit-tested matching engine (marginal gain, role fit, TBI, explanations)
  src/services/                 Firestore loaders + derived-data service (skill gap, TBI, recommendations, analytics)
  src/triggers.js               onTeamMemberChange, onProjectWrite, onApplicationDecided, onStudentSkillChange, daily schedule
  src/callables.js              applyToProject, acceptApplication, rejectApplication, previewCandidateImpact, generateRecommendations
  src/api.js                    Express REST facade at /api (health, recommendations, preview, analytics)
  scripts/                      generateData (faker, seed 42), seed (Firestore load), evaluate (baseline comparison)
  test/engine.test.js           Jest unit tests
frontend/                       React (Vite) UI: auth, profile, browse/create/edit projects, radar, TBI, review queue, dashboard
```

## Run locally
```bash
npm i -g firebase-tools
(cd functions && npm install) && (cd frontend && npm install)
cp frontend/.env.example frontend/.env        # set VITE_USE_EMULATORS=true for local work
firebase emulators:start                      # terminal 1
(cd functions && FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed)   # terminal 2 (optional demo data)
(cd frontend && npm run dev)                  # terminal 3
```
Seeded students are Firestore documents only; sign up in the UI to get a login. The emulator reads rules/indexes automatically.

## Test and evaluate (no Firebase needed)
```bash
cd functions
npm test            # engine unit tests
npm run evaluate    # random vs keyword vs complementarity, prints a table, writes scripts/evaluation_results.json
```

## Deploy
Set your project id in `.firebaserc` and fill `frontend/.env`, then:
```bash
(cd frontend && npm run build) && firebase deploy
```
Cloud Functions deployment requires the Blaze (pay-as-you-go) plan; usage for a class project stays within the free quota. The emulators need no billing.

## Scoring model (all tunable in `functions/src/matching/config.js`)
* Coverage = weighted mean of `min(covered, required) / required`; covered level = best proficiency on the team. A duplicate of an existing strength therefore adds exactly 0.
* Recommendation score = 55% marginal gain (share of the remaining gap closed) + 20% role fit + 15% availability fit + 10% experience diversity.
* TBI = 40% skill coverage + 25% role diversity + 15% experience mix (entropy) + 20% availability overlap.
