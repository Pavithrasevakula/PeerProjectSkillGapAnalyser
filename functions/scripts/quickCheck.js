/**
 * Quick check - print one project's raw data structure
 * Run with: node functions/scripts/quickCheck.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function quickCheck() {
  try {
    console.log('\n=== QUICK FIRESTORE DATA CHECK ===\n');
    
    // Get one project
    const projectsSnapshot = await db.collection('projects').limit(1).get();
    
    if (projectsSnapshot.empty) {
      console.log('❌ No projects found in database!');
      process.exit(1);
    }
    
    const doc = projectsSnapshot.docs[0];
    const data = doc.data();
    
    console.log('✅ Found project:', doc.id);
    console.log('\n📋 Project Title:', data.title);
    console.log('👤 Owner:', data.ownerName);
    console.log('\n🎯 Required Roles:', data.requiredRoles?.length || 0, 'roles');
    
    if (data.requiredRoles && data.requiredRoles.length > 0) {
      console.log('\nFirst role structure:');
      console.log(JSON.stringify(data.requiredRoles[0], null, 2));
      
      console.log('\n📝 All role names:');
      data.requiredRoles.forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.roleName} (ID: ${r.roleId}, Slots: ${r.slots})`);
      });
    } else {
      console.log('❌ No requiredRoles array found!');
    }
    
    console.log('\n💡 Required Skills:', data.requiredSkills?.length || 0, 'skills');
    
    if (data.requiredSkills && data.requiredSkills.length > 0) {
      console.log('\nFirst skill structure:');
      console.log(JSON.stringify(data.requiredSkills[0], null, 2));
      
      console.log('\n📝 All skill names:');
      data.requiredSkills.forEach((s, idx) => {
        console.log(`  ${idx + 1}. ${s.skillName} (ID: ${s.skillId}, Min Level: ${s.minProficiency}, Priority: ${s.priority})`);
      });
    } else {
      console.log('❌ No requiredSkills array found!');
    }
    
    console.log('\n=================================\n');
    
    // Verification
    if (data.requiredRoles && data.requiredRoles.length > 0 && 
        data.requiredSkills && data.requiredSkills.length > 0 &&
        data.requiredRoles[0].roleName && data.requiredSkills[0].skillName) {
      console.log('✅ DATA STRUCTURE IS CORRECT!');
      console.log('   The backend has proper roleName and skillName fields.');
      console.log('   Issue must be in frontend rendering or data fetching.');
    } else {
      console.log('❌ DATA STRUCTURE IS MISSING FIELDS!');
      console.log('   Need to reseed the database.');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

quickCheck();
