/**
 * Fix Project Owner Names
 * Updates all demo projects to have proper ownerName field
 * Run: node scripts/fixProjectOwners.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase Admin (check if already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Map of project titles to owner names
const OWNER_NAMES = {
  "AI-Powered Healthcare Diagnosis System": "Arjun Sharma",
  "E-Commerce Platform for Local Artisans": "Priya Patel",
  "Smart City Traffic Management System": "Karthik Reddy",
  "Online Learning Platform for Rural Students": "Sneha Kumar",
  "Blockchain-Based Land Registry System": "Vikram Singh",
  // "My First Project" will keep the actual user's name
};

async function fixProjectOwners() {
  console.log('🔧 Fixing project owner names...\n');

  try {
    const projectsSnap = await db.collection('projects').get();
    console.log(`Found ${projectsSnap.size} projects\n`);

    let updated = 0;
    let skipped = 0;

    for (const docSnap of projectsSnap.docs) {
      const project = docSnap.data();
      const title = project.title;
      const currentOwnerName = project.ownerName;

      // Check if this is a demo project that needs fixing
      if (OWNER_NAMES[title]) {
        const correctOwnerName = OWNER_NAMES[title];
        
        if (currentOwnerName !== correctOwnerName) {
          await db.collection('projects').doc(docSnap.id).update({
            ownerName: correctOwnerName
          });
          console.log(`✓ Updated "${title}"`);
          console.log(`  Old: "${currentOwnerName || '(none)'}"`);
          console.log(`  New: "${correctOwnerName}"\n`);
          updated++;
        } else {
          console.log(`- "${title}" already has correct owner: ${correctOwnerName}\n`);
          skipped++;
        }
      } else {
        console.log(`- Skipping "${title}" (not a demo project or "My First Project")\n`);
        skipped++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✓ Updated: ${updated} projects`);
    console.log(`- Skipped: ${skipped} projects`);
    console.log('\n✅ Done! Refresh your browser to see the changes.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixProjectOwners();
