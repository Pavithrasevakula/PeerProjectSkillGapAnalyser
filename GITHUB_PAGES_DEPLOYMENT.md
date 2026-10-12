# 🚀 GitHub Pages Deployment Guide

## ✅ Setup Complete!

Your project is configured for GitHub Pages deployment.

---

## 📋 Quick Deploy Commands

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (first time only)
npm install

# Deploy to GitHub Pages
npm run deploy
```

That's it! Your site will be live in 2-3 minutes.

---

## 🌐 Your Live URL

After deployment completes:

**https://Pavithrasevakula.github.io/PeerProjectSkillGapAnalyser/**

---

## 🔧 What Was Configured

### 1. package.json
Added:
- `homepage` field pointing to your GitHub Pages URL
- `gh-pages` dependency for deployment
- `deploy` and `predeploy` scripts

### 2. vite.config.js
Added:
- `base: '/PeerProjectSkillGapAnalyser/'` for correct routing

---

## 📊 Deployment Process

When you run `npm run deploy`:

1. ✅ **Builds** the production app (`npm run build`)
2. ✅ **Creates** `gh-pages` branch (if doesn't exist)
3. ✅ **Pushes** contents of `dist/` folder to `gh-pages` branch
4. ✅ **Activates** GitHub Pages hosting automatically

---

## ⚙️ Enable GitHub Pages (One-Time Setup)

1. Go to: https://github.com/Pavithrasevakula/PeerProjectSkillGapAnalyser/settings/pages

2. Under "Source":
   - Branch: `gh-pages`
   - Folder: `/ (root)`

3. Click **Save**

4. Wait 2-3 minutes for deployment

5. Visit: https://Pavithrasevakula.github.io/PeerProjectSkillGapAnalyser/

---

## 🔄 Update Your Site (After Changes)

```bash
cd frontend
npm run deploy
```

This automatically:
- Rebuilds the app
- Deploys to GitHub Pages
- Updates your live site

---

## 🧪 Test Locally First

Before deploying:

```bash
cd frontend

# Development mode
npm run dev

# Production preview
npm run build
npm run preview
```

---

## ⚠️ Important Notes

### Backend Limitation
GitHub Pages only hosts **static files** (HTML, CSS, JS). It **cannot run**:
- ❌ Cloud Functions
- ❌ Server-side code
- ❌ Database operations

### What Works:
- ✅ React UI
- ✅ Static content
- ✅ Client-side routing
- ✅ Firebase Authentication (client SDK)
- ✅ Firestore (client SDK)

### Firebase Features Still Work!
Your app connects to Firebase directly from the browser:
- ✅ User authentication
- ✅ Firestore database reads/writes
- ✅ Real-time updates

### What Won't Work:
- ❌ Cloud Functions (matching algorithm, team formation)
- ❌ Server-side triggers
- ❌ Admin SDK operations

---

## 🎯 Recommended Approach

For **full functionality** (with Cloud Functions):
- Use **Firebase Hosting**: `firebase deploy`

For **frontend demo only**:
- Use **GitHub Pages**: `npm run deploy`

---

## 📱 Share Your Demo

Once deployed, share:

**Live Demo:**
🌐 https://Pavithrasevakula.github.io/PeerProjectSkillGapAnalyser/

**GitHub Repo:**
💻 https://github.com/Pavithrasevakula/PeerProjectSkillGapAnalyser

**Demo Account:**
- Email: `rahul.verma@teamsync.demo`
- Password: `Demo@123`

---

## 🐛 Troubleshooting

### Deployment fails
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run deploy
```

### Blank page after deployment
- Check browser console for errors
- Verify `base` in `vite.config.js` matches repo name
- Clear browser cache

### 404 on refresh
- GitHub Pages doesn't support SPA routing by default
- User must use homepage URL

### Firebase not connecting
- Check `.env` file has correct Firebase config
- Verify `VITE_USE_EMULATORS=false`

---

## ✅ Deployment Checklist

- [x] `package.json` configured with homepage
- [x] `vite.config.js` has correct base path
- [x] `gh-pages` package installed
- [x] Build successful
- [ ] Run `npm run deploy` from `frontend/` folder
- [ ] Enable GitHub Pages in repo settings
- [ ] Wait 2-3 minutes
- [ ] Test live URL

---

## 🔁 Typical Workflow

```bash
# 1. Make code changes
# Edit files in frontend/src/

# 2. Test locally
cd frontend
npm run dev

# 3. Deploy to GitHub Pages
npm run deploy

# 4. Wait 2-3 minutes
# Visit: https://Pavithrasevakula.github.io/PeerProjectSkillGapAnalyser/
```

---

## 📞 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Build production |
| `npm run preview` | Preview production build |
| `npm run deploy` | Deploy to GitHub Pages |

---

## 🎉 You're Ready!

Just run:
```bash
cd frontend
npm run deploy
```

Your site will be live at:
**https://Pavithrasevakula.github.io/PeerProjectSkillGapAnalyser/**

---

**Happy Deploying!** 🚀
