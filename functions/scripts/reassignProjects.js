// Reassign projects to match actual demo user names
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '../service-account-key.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function reassignProjects() {
  console.log('🔄 Reassigning projects to demo users...\n');
  
  // Get demo users
  const usersSnap = await db.collection('users').where('isDemo', '==', true).get();
  const demoUsers = [];
  usersSnap.forEach(doc => {
    demoUsers.push({ id: doc.id, name: doc.data().fullName });
  });
  
  // Project to user mapping (using actual demo user names)
  const assignments = {
    'Blockchain-Based Land Registry System': 'Vikram Kumar',
    'E-Commerce Platform for Local Artisans': 'Priya Sharma',
    'Smart City Traffic Management System': 'Rohan Patel', // Closest match
    'Online Learning Platform for Rural Students': 'Sneha Gupta',
    'AI-Powered Healthcare Diagnosis System': 'Arjun Reddy'
  };
  
  const projectsSnap = await db.collection('projects').get();
  
  for (const doc of projectsSnap.docs) {
    const project = doc.data();
    const newOwnerName = assignments[project.title];
    
    if (newOwnerName) {
      const owner = demoUsers.find(u => u.name === newOwnerName);
      
      if (owner) {
        console.log(`📝 ${project.title}`);
        console.log(`   Old: ${project.ownerName} (${project.ownerUserId})`);
        console.log(`   New: ${newOwnerName} (${owner.id})`);
        
        await db.collection('projects').doc(doc.id).update({
          ownerName: newOwnerName,
          ownerUserId: owner.id
        });
        
        console.log(`   ✅ Updated!\n`);
      }
    }
  }
  
  console.log('✅ Projects reassigned!');
  process.exit(0);
}

reassignProjects().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
