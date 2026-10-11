// List all project owners to see the mismatch
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '../service-account-key.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listOwners() {
  const projectsSnap = await db.collection('projects').get();
  
  console.log('\n📋 All Projects and Their Owners:\n');
  projectsSnap.forEach(doc => {
    const p = doc.data();
    console.log(`Project: ${p.title}`);
    console.log(`  Owner Name: ${p.ownerName || 'N/A'}`);
    console.log(`  Owner UID: ${p.ownerUserId}`);
    console.log();
  });
  
  const usersSnap = await db.collection('users').where('isDemo', '==', true).get();
  console.log('\n👥 All Demo Users:\n');
  usersSnap.forEach(doc => {
    const u = doc.data();
    console.log(`${u.fullName} (${doc.id})`);
  });
  
  process.exit(0);
}

listOwners().catch(err => {
  console.error(err);
  process.exit(1);
});
