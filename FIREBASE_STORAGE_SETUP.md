# Firebase Storage Setup Instructions

To enable video introductions feature, you need to set up Firebase Storage:

## Setup Steps:

1. **Enable Firebase Storage in Firebase Console:**
   - Go to: https://console.firebase.google.com/project/peer-team-matcher/storage
   - Click "Get Started"
   - Choose your security rules mode (Production mode recommended)
   - Select a Cloud Storage location (preferably same as Firestore: asia-south1)
   - Click "Done"

2. **Deploy Storage Rules:**
   ```bash
   firebase deploy --only storage
   ```

3. **Test Video Upload:**
   - Go to your profile page
   - Upload a test video (max 50MB)
   - Verify it appears in Firebase Storage console

## Storage Rules

The `storage.rules` file includes:
- Video intros: Max 50MB, video files only
- User-specific access: Users can only modify their own videos
- Public viewing: All authenticated users can view any video intro

## Alternative: Use Existing Storage

If Storage is already enabled:
```bash
firebase deploy --only storage:rules
```

## Troubleshooting:

**Error: "Firebase Storage has not been set up"**
- Follow step 1 above to enable Storage in console first

**Error: "Permission denied"**
- Check that storage.rules file has correct permissions
- Verify user is authenticated

**Video not uploading:**
- Check file size (must be < 50MB)
- Verify file type is video/*
- Check browser console for errors
