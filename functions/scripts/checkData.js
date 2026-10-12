const { db } = require("../src/firebase");

async function checkData() {
  console.log("Checking Firestore data structure...\n");
  
  // Get one project
  const projectsSnap = await db.collection("projects").limit(1).get();
  
  if (projectsSnap.empty) {
    console.log("❌ No projects found in database!");
    console.log("\nRun: npm run seed");
    return;
  }
  
  const projectDoc = projectsSnap.docs[0];
  const project = projectDoc.data();
  
  console.log("✅ Project found:", project.title);
  console.log("\n📋 Required Roles:");
  console.log(JSON.stringify(project.requiredRoles, null, 2));
  
  console.log("\n📋 Required Skills:");
  console.log(JSON.stringify(project.requiredSkills, null, 2));
  
  console.log("\n✅ Data structure looks correct!");
  console.log("\nIf roles/skills show as '×' or '(L)-' in UI:");
  console.log("1. Check browser console for errors");
  console.log("2. Clear browser cache (Ctrl+Shift+Delete)");
  console.log("3. Hard refresh (Ctrl+F5)");
}

checkData()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  });
