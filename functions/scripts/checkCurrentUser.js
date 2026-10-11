// Check current user's full name
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '../service-account-key.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUser() {
  const userDoc = await db.collection('users').doc('demo__arjun_reddy').get();
  
  if (userDoc.exists) {
    const data = userDoc.data();
    console.log('User Document for demo__arjun_reddy:');
    console.log('Full Name:', data.fullName);
    console.log('Email:', data.email);
    console.log('Is Demo:', data.isDemo);
    console.log();
    console.log('Looking for projects owned by "Arjun Reddy"...');
    
    const projectsSnap = await db.collection('projects')
      .where('ownerName', '==', 'Arjun Reddy')
      .get();
    
    console.log(`Found ${projectsSnap.size} projects`);
    projectsSnap.forEach(doc => {
      console.log(`  - ${doc.data().title}`);
    });
  } else {
    console.log('User not found!');
  }
  
  process.exit(0);
}

checkUser().catch(err => {
  console.error(err);
  process.exit(1);
});
