// Check for and remove duplicate projects
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../service-account-key.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate projects...\n');
  
  const projectsSnap = await db.collection('projects').get();
  const projects = [];
  
  projectsSnap.forEach(doc => {
    projects.push({ id: doc.id, ...doc.data() });
  });
  
  console.log(`📊 Total projects: ${projects.length}\n`);
  
  // Group by title
  const titleGroups = {};
  projects.forEach(p => {
    if (!titleGroups[p.title]) {
      titleGroups[p.title] = [];
    }
    titleGroups[p.title].push(p);
  });
  
  // Find duplicates
  const duplicates = Object.entries(titleGroups).filter(([title, projs]) => projs.length > 1);
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate projects found!');
    process.exit(0);
  }
  
  console.log(`⚠️ Found ${duplicates.length} sets of duplicate projects:\n`);
  
  for (const [title, projs] of duplicates) {
    console.log(`📝 "${title}" - ${projs.length} copies:`);
    projs.forEach((p, i) => {
      console.log(`   ${i + 1}. ID: ${p.id} | Owner: ${p.ownerName || 'N/A'} | Status: ${p.status}`);
    });
    
    // Keep only the first one, delete the rest
    console.log(`   🗑️ Deleting ${projs.length - 1} duplicates...\n`);
    for (let i = 1; i < projs.length; i++) {
      await db.collection('projects').doc(projs[i].id).delete();
      console.log(`   ✅ Deleted: ${projs[i].id}`);
    }
    console.log();
  }
  
  console.log('\n✅ Duplicate cleanup complete!');
  process.exit(0);
}

checkDuplicates().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
