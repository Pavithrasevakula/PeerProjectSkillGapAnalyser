# Complete Demo Users Setup

This script creates **10 fully functional demo users** with:
- ✅ Real Firebase Authentication accounts
- ✅ Complete Firestore profiles with skills, roles, availability
- ✅ Automatic applications to various projects
- ✅ Ability to log in and interact with the system

## Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **peer-team-matcher**
3. Click the gear icon ⚙️ → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Save the downloaded JSON file as: `functions/service-account-key.json`

⚠️ **Important**: Never commit this file to git (it's already in .gitignore)

## Step 2: Run the Script

```powershell
cd "d:\MTech - Sem 1\Data Modelling\peer-team-matcher\functions"
node scripts/createCompleteDemo.js
```

## Step 3: Demo User Credentials

After running the script, you'll have **10 demo users**:

| Name | Email | Password |
|------|-------|----------|
| Rahul Verma | rahul.verma@teamsync.demo | Demo@123 |
| Ananya Singh | ananya.singh@teamsync.demo | Demo@123 |
| Rohan Patel | rohan.patel@teamsync.demo | Demo@123 |
| Priya Sharma | priya.sharma@teamsync.demo | Demo@123 |
| Arjun Reddy | arjun.reddy@teamsync.demo | Demo@123 |
| Sneha Gupta | sneha.gupta@teamsync.demo | Demo@123 |
| Vikram Kumar | vikram.kumar@teamsync.demo | Demo@123 |
| Divya Iyer | divya.iyer@teamsync.demo | Demo@123 |
| Aditya Nair | aditya.nair@teamsync.demo | Demo@123 |
| Kavya Menon | kavya.menon@teamsync.demo | Demo@123 |

## What Each User Does

- **Rahul Verma** - Computer Vision expert, applies to AI/Healthcare projects
- **Ananya Singh** - Full-stack developer, applies to Web projects
- **Rohan Patel** - NLP specialist, applies to AI projects
- **Priya Sharma** - UI/UX Designer, applies to design-heavy projects
- **Arjun Reddy** - DevOps engineer, applies to infrastructure projects
- **Sneha Gupta** - Beginner mobile developer
- **Vikram Kumar** - Backend security specialist
- **Divya Iyer** - Computer vision researcher
- **Aditya Nair** - Blockchain developer
- **Kavya Menon** - Backend beginner

## Testing the System

1. **Log in as project owner** (your account)
   - View applications from demo users
   - Accept/reject applications
   - See team formation

2. **Log in as demo user** (e.g., rahul.verma@teamsync.demo)
   - View their profile
   - See their applications
   - Apply to more projects
   - Get notifications

3. **Test matching algorithm**
   - Click "Find more candidates"
   - See realistic, diverse recommendations
   - Preview candidate impact
   - Accept candidates and see team balance improve

## Features to Test

### Profile Management
- ✅ View complete profile with skills, roles, availability
- ✅ Edit profile information
- ✅ Add/remove skills dynamically
- ✅ Duplicate prevention for skills/roles/slots

### Project Application Flow
- ✅ Browse open projects
- ✅ Apply to projects with role selection
- ✅ View application status (Pending/Accepted/Rejected)
- ✅ Withdraw pending applications

### Project Owner Features
- ✅ Create new projects
- ✅ View pending applications
- ✅ Accept/reject applications
- ✅ See real-time team updates
- ✅ Get AI-powered candidate recommendations
- ✅ Preview candidate impact before accepting
- ✅ View skill gap radar
- ✅ Track Team Balance Index

### Dashboard
- ✅ Quick stats (projects, applications, team invitations)
- ✅ Filter "My Projects" vs "All Projects"
- ✅ Status-coded project cards
- ✅ Visual charts and indicators

### Matching Algorithm
- ✅ Complementarity-based matching
- ✅ Marginal gain calculation
- ✅ Role fit scoring
- ✅ Availability overlap analysis
- ✅ Experience diversity bonus
- ✅ Detailed explanations for each recommendation

## Troubleshooting

**"Missing or insufficient permissions"**
- Make sure you downloaded the service account key correctly
- Verify the file is named `service-account-key.json`
- Check it's in the `functions/` directory

**"User already exists"**
- The script is idempotent - it will update existing users
- Safe to run multiple times

**Applications not showing up**
- Check that projects exist in your database
- Verify Cloud Functions are deployed
- Check Firestore security rules allow reads

## Clean Up (Optional)

To remove all demo users:

```javascript
// Run in Firebase Console > Firestore > Run query
// Delete all documents where isDemo == true (if we add that flag)
// Or manually delete from Authentication tab
```
