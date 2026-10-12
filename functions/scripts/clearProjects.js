/**
 * Clear all projects from Firestore before reseeding
 * Run with: node functions/scripts/clearProjects.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function clearProjects() {
  try {
    console.log('\n🗑️  Clearing all projects from Firestore...\n');
    
    const projectsSnapshot = await db.collection('projects').get();
    console.log(`Found ${projectsSnapshot.size} projects to delete`);
    
    const batch = db.batch();
    let count = 0;
    
    for (const doc of projectsSnapshot.docs) {
      batch.delete(doc.ref);
      count++;
      
      // Firestore batch limit is 500 operations
      if (count % 400 === 0) {
        await batch.commit();
        console.log(`Deleted ${count} projects...`);
      }
    }
    
    // Commit any remaining deletes
    if (count % 400 !== 0) {
      await batch.commit();
    }
    
    console.log(`\n✅ Successfully deleted ${count} projects`);
    console.log('\nNote: Subcollections (applications, teamMembers, etc.) are automatically deleted.');
    console.log('\nNow run: npm run seed');
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

clearProjects();
