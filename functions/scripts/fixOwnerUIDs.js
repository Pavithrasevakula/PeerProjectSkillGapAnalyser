const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

// Map of ownerName to their actual Auth UID
const ownerMapping = {
  'Arjun Reddy': 'arjun.reddy@teamsync.demo',
  'Vikram Kumar': 'vikram.kumar@teamsync.demo',
  'Priya Sharma': 'priya.sharma@teamsync.demo',
  'Rohan Patel': 'rohan.patel@teamsync.demo',
  'Sneha Gupta': 'sneha.gupta@teamsync.demo'
};

async function fixOwnerUIDs() {
  try {
    console.log('\n=== Fixing Project Owner UIDs ===\n');
    
    // First, get all auth UIDs by email
    const emailToUID = {};
    for (const [ownerName, email] of Object.entries(ownerMapping)) {
      try {
        const userRecord = await auth.getUserByEmail(email);
        emailToUID[ownerName] = userRecord.uid;
        console.log(`✓ ${ownerName}: ${userRecord.uid}`);
      } catch (error) {
        console.log(`✗ ${ownerName}: User not found for ${email}`);
      }
    }
    
    console.log('\n=== Updating Projects ===\n');
    
    // Get all projects
    const projectsSnapshot = await db.collection('projects').get();
    
    let updated = 0;
    for (const doc of projectsSnapshot.docs) {
      const project = doc.data();
      const ownerName = project.ownerName;
      
      if (ownerName && emailToUID[ownerName]) {
        const correctUID = emailToUID[ownerName];
        
        if (project.ownerUserId !== correctUID) {
          await doc.ref.update({
            ownerUserId: correctUID
          });
          
          console.log(`✓ Updated "${project.title}"`);
          console.log(`  Owner: ${ownerName}`);
          console.log(`  Old UID: ${project.ownerUserId}`);
          console.log(`  New UID: ${correctUID}\n`);
          updated++;
        } else {
          console.log(`- "${project.title}" already correct (${ownerName})\n`);
        }
      }
    }
    
    console.log(`\n✅ Updated ${updated} project(s)`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixOwnerUIDs();
