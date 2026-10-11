# 🚀 Setup Guide - Peer Team Matcher

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project (free tier works)

---

## 🔐 Security & Credentials

### ⚠️ IMPORTANT: Never commit these files to Git!

- ✅ Already ignored in `.gitignore`:
  - `frontend/.env` (Firebase config)
  - `functions/service-account-key.json` (Admin SDK key)
  - `.firebase/` (deployment artifacts)

---

## 📋 Step 1: Clone the Repository

```bash
git clone https://github.com/Pavithrasevakula/PeerProjectSkillGapAnalyser.git
cd PeerProjectSkillGapAnalyser
```

---

## 🔥 Step 2: Firebase Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it (e.g., "peer-team-matcher")
4. Enable Google Analytics (optional)
5. Create project

### 2.2 Enable Services

**Authentication:**
- Go to Authentication → Get Started
- Enable "Email/Password" sign-in method

**Firestore Database:**
- Go to Firestore Database → Create Database
- Start in **production mode**
- Choose a region (e.g., asia-south1)

**Cloud Functions:**
- Upgrade to Blaze (pay-as-you-go) plan
  - Don't worry - free tier is generous!
  - Class projects stay within free quota

### 2.3 Get Firebase Config

**For Frontend (.env file):**
1. Go to Project Settings (⚙️ icon)
2. Scroll to "Your apps"
3. Click "Web app" (</>) icon
4. Register app (name: "Peer Team Matcher")
5. Copy the config values

**For Backend (service account):**
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `functions/service-account-key.json`
   - ⚠️ **NEVER commit this file!**

---

## ⚙️ Step 3: Configure Environment

### Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` with your Firebase values:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your_actual_app_id
VITE_FUNCTIONS_REGION=asia-south1
VITE_USE_EMULATORS=false
```

---

## 📦 Step 4: Install Dependencies

```bash
# Install function dependencies
cd functions
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Go back to root
cd ..
```

---

## 🗂️ Step 5: Deploy Security Rules & Indexes

```bash
# Update .firebaserc with your project ID
# Edit .firebaserc and replace "peer-team-matcher" with your project ID

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

---

## ☁️ Step 6: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This deploys:
- Matching algorithm
- Team formation triggers
- Application management
- Recommendation engine

⏱️ First deployment takes ~5-10 minutes

---

## 🌐 Step 7: Deploy Frontend (Optional - for hosting)

```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

---

## 🧪 Step 8: Seed Demo Data (Optional)

```bash
cd functions
npm run seed
```

This creates:
- 500+ demo users
- 100+ demo projects
- Sample applications
- All with realistic data

---

## 🚀 Step 9: Run Locally

### Option A: With Emulators (Recommended for Development)

```bash
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Seed emulator data (optional)
cd functions
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed

# Terminal 3: Start frontend
cd frontend
# Edit .env: set VITE_USE_EMULATORS=true
npm run dev
```

Open: http://localhost:5173

### Option B: With Production Firebase

```bash
cd frontend
# Make sure .env has VITE_USE_EMULATORS=false
npm run dev
```

---

## 📝 Step 10: Create Your First Account

1. Open the app in browser
2. Click "Sign Up"
3. Create account with your email
4. Fill in your profile (skills, roles, availability)
5. Start browsing projects!

---

## 🧪 Using Demo Accounts

See `DEMO_CREDENTIALS.md` for:
- 10 pre-configured demo users
- Various skill levels (beginner to expert)
- Different domains (AI, Web, Blockchain, etc.)
- Password: `Demo@123` for all demo accounts

---

## 🔍 Verify Setup

### Check Firestore Rules:
1. Go to Firebase Console → Firestore
2. Click "Rules" tab
3. Should see authentication-based rules

### Check Cloud Functions:
1. Go to Firebase Console → Functions
2. Should see ~10 deployed functions
3. Status should be "Active" (green)

### Check Frontend:
1. Should be able to sign up/login
2. Profile page should load
3. Projects page should show projects

---

## 🐛 Troubleshooting

### "Permission denied" errors:
- Check Firestore rules are deployed
- Verify you're logged in
- Check authentication is enabled

### Functions not triggering:
- Wait 5 mins after first deployment
- Check Functions logs in Firebase Console
- Verify Blaze plan is active

### Frontend can't connect:
- Check `.env` values match Firebase console
- Verify API key is correct
- Check browser console for errors

### Build errors:
- Delete `node_modules` and reinstall
- Clear npm cache: `npm cache clean --force`
- Check Node.js version: `node --version` (should be v16+)

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Firestore Query Guide](https://firebase.google.com/docs/firestore/query-data/queries)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)

---

## 🆘 Need Help?

1. Check Firebase Console logs
2. Check browser DevTools console
3. Review `functions/test/engine.test.js` for examples
4. Read `FINAL_DATABASE_COMMANDS.md` for query examples

---

## ✅ Setup Complete!

You're ready to:
- ✨ Create projects
- 🔍 Browse opportunities  
- 🤝 Apply to teams
- 📊 See match scores
- 🎯 Form optimal teams

**Happy Team Building!** 🚀
