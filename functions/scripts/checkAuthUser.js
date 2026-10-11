const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function checkAuthUser() {
  try {
    console.log('\n=== Checking Auth User by Email ===\n');
    
    const email = 'arjun.reddy@teamsync.demo';
    
    // Get the auth user
    const userRecord = await auth.getUserByEmail(email);
    console.log('Auth User Record:');
    console.log(`  UID: ${userRecord.uid}`);
    console.log(`  Email: ${userRecord.email}`);
    console.log(`  Display Name: ${userRecord.displayName || '(none)'}`);
    
    // Get the Firestore user document
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('\nFirestore User Document:');
      console.log(`  Full Name: ${userData.fullName}`);
      console.log(`  Email: ${userData.email}`);
      console.log(`  Is Demo: ${userData.isDemo}`);
    } else {
      console.log('\nFirestore User Document: NOT FOUND');
    }
    
    // Check projects owned by this UID
    console.log(`\n=== Projects Query: ownerUserId == "${userRecord.uid}" ===\n`);
    const projectsSnapshot = await db.collection('projects')
      .where('ownerUserId', '==', userRecord.uid)
      .get();
    
    console.log(`Found ${projectsSnapshot.size} project(s):`);
    projectsSnapshot.forEach(doc => {
      const p = doc.data();
      console.log(`\n  Project: ${p.title}`);
      console.log(`    ID: ${doc.id}`);
      console.log(`    ownerUserId: ${p.ownerUserId}`);
      console.log(`    ownerName: ${p.ownerName}`);
    });
    
    if (projectsSnapshot.empty) {
      console.log('\n❌ No projects found with this ownerUserId!');
      console.log('\nSearching by ownerName instead...');
      
      const byNameSnapshot = await db.collection('projects')
        .where('ownerName', '==', 'Arjun Reddy')
        .get();
      
      console.log(`\nFound ${byNameSnapshot.size} project(s) by ownerName:`);
      byNameSnapshot.forEach(doc => {
        const p = doc.data();
        console.log(`\n  Project: ${p.title}`);
        console.log(`    ID: ${doc.id}`);
        console.log(`    ownerUserId: ${p.ownerUserId} ← MISMATCH!`);
        console.log(`    ownerName: ${p.ownerName}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAuthUser();
