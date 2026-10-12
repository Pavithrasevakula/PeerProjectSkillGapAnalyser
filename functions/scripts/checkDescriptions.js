/**
 * Quick check for project descriptions
 * Run with: node functions/scripts/checkDescriptions.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function checkDescriptions() {
  try {
    console.log('\n=== PROJECT DESCRIPTIONS CHECK ===\n');
    
    // Get 5 sample projects
    const projectsSnapshot = await db.collection('projects').limit(5).get();
    
    if (projectsSnapshot.empty) {
      console.log('❌ No projects found!');
      process.exit(1);
    }
    
    projectsSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`\n${idx + 1}. ${data.title}`);
      console.log(`   Domain: ${data.domainArea}`);
      console.log(`   Owner: ${data.ownerName || 'undefined'}`);
      console.log(`   Description: ${data.description}`);
      console.log(`   ---`);
    });
    
    console.log('\n=================================\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkDescriptions();
