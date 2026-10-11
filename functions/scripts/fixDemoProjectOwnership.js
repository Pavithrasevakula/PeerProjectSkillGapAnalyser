// Fix demo project ownership - assign projects to actual demo user accounts
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../service-account-key.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixOwnership() {
  console.log('🔧 Fixing demo project ownership...\n');
  
  // Get all demo users
  const usersSnap = await db.collection('users').where('isDemo', '==', true).get();
  const demoUsers = {};
  
  usersSnap.forEach(doc => {
    const data = doc.data();
    demoUsers[data.fullName] = doc.id;
  });
  
  console.log('📋 Demo users found:', Object.keys(demoUsers));
  console.log();
  
  // Get all projects
  const projectsSnap = await db.collection('projects').get();
  
  let fixed = 0;
  for (const doc of projectsSnap.docs) {
    const project = doc.data();
    const ownerName = project.ownerName;
    
    if (ownerName && demoUsers[ownerName]) {
      const correctOwnerId = demoUsers[ownerName];
      
      if (project.ownerUserId !== correctOwnerId) {
        console.log(`📝 Fixing "${project.title}"`);
        console.log(`   Owner: ${ownerName}`);
        console.log(`   Old UID: ${project.ownerUserId}`);
        console.log(`   New UID: ${correctOwnerId}`);
        
        await db.collection('projects').doc(doc.id).update({
          ownerUserId: correctOwnerId
        });
        
        fixed++;
        console.log(`   ✅ Fixed!\n`);
      }
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} projects!`);
  process.exit(0);
}

fixOwnership().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
