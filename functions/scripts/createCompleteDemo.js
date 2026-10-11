/**
 * Complete Demo Setup Script
 * Creates 10 real demo users with Firebase Auth + Firestore profiles + applications
 * Run: node scripts/createCompleteDemo.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

const DEFAULT_PASSWORD = 'Demo@123';

function slug(prefix, name) {
  return `${prefix}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
}

// Complete demo users with diverse, realistic profiles
const DEMO_USERS = [
  {
    fullName: "Rahul Verma",
    email: "rahul.verma@teamsync.demo",
    department: "MTech AI & ML",
    yearOfStudy: 2,
    experienceLevel: "Advanced",
    bio: "Deep learning expert with 3+ years in computer vision. Published research on CNN optimization. Lead AI developer at startup internship. Passionate about medical imaging applications.",
    skills: [
      { name: "Python", level: 5, years: 3.5 },
      { name: "TensorFlow", level: 5, years: 2.8 },
      { name: "PyTorch", level: 4, years: 2.2 },
      { name: "Computer Vision", level: 5, years: 2.5 },
      { name: "Deep Learning", level: 5, years: 2.5 },
      { name: "Machine Learning", level: 4, years: 3.0 },
      { name: "Keras", level: 4, years: 2.0 }
    ],
    roles: ["ML Engineer", "Data Scientist", "Technical Lead"],
    availability: [
      { day: "Mon", start: "14:00", end: "18:00" },
      { day: "Wed", start: "10:00", end: "14:00" },
      { day: "Fri", start: "15:00", end: "19:00" },
      { day: "Sat", start: "10:00", end: "13:00" }
    ],
    applyTo: [0, 2] // Will apply to first and third projects
  },
  {
    fullName: "Ananya Singh",
    email: "ananya.singh@teamsync.demo",
    department: "MTech CSE",
    yearOfStudy: 1,
    experienceLevel: "Intermediate",
    bio: "Full-stack developer who built 5+ production apps. Strong in React ecosystem and Node.js backends. Love building scalable, user-friendly interfaces. Previously worked at e-commerce startup.",
    skills: [
      { name: "React", level: 5, years: 2.5 },
      { name: "Node.js", level: 4, years: 2.8 },
      { name: "JavaScript", level: 5, years: 3.2 },
      { name: "TypeScript", level: 4, years: 1.8 },
      { name: "MongoDB", level: 4, years: 2.0 },
      { name: "REST APIs", level: 4, years: 2.5 },
      { name: "Next.js", level: 3, years: 1.2 },
      { name: "Redux", level: 3, years: 1.5 }
    ],
    roles: ["Full-Stack Developer", "Frontend Developer", "Backend Developer"],
    availability: [
      { day: "Tue", start: "09:00", end: "13:00" },
      { day: "Thu", start: "14:00", end: "18:00" },
      { day: "Sat", start: "10:00", end: "15:00" }
    ],
    applyTo: [1, 3]
  },
  {
    fullName: "Rohan Patel",
    email: "rohan.patel@teamsync.demo",
    department: "MTech Data Science",
    yearOfStudy: 2,
    experienceLevel: "Advanced",
    bio: "NLP specialist working with LLMs and transformers. Built chatbots and sentiment analysis systems. Research experience in text summarization. Contributor to Hugging Face community.",
    skills: [
      { name: "Python", level: 5, years: 4.0 },
      { name: "NLP", level: 5, years: 2.8 },
      { name: "LLMs", level: 4, years: 1.8 },
      { name: "Hugging Face", level: 5, years: 2.0 },
      { name: "Machine Learning", level: 4, years: 3.2 },
      { name: "PyTorch", level: 4, years: 2.5 },
      { name: "TensorFlow", level: 3, years: 2.0 }
    ],
    roles: ["Data Scientist", "ML Engineer", "Backend Developer"],
    availability: [
      { day: "Mon", start: "10:00", end: "14:00" },
      { day: "Wed", start: "15:00", end: "19:00" },
      { day: "Fri", start: "10:00", end: "13:00" },
      { day: "Sun", start: "14:00", end: "17:00" }
    ],
    applyTo: [0]
  },
  {
    fullName: "Priya Sharma",
    email: "priya.sharma@teamsync.demo",
    department: "MCA (AI & ML)",
    yearOfStudy: 1,
    experienceLevel: "Intermediate",
    bio: "UI/UX designer with coding skills. Created designs for 10+ apps. Expert in Figma, prototyping, and user research. Now learning React to implement my own designs.",
    skills: [
      { name: "UI/UX Design", level: 5, years: 3.5 },
      { name: "Figma", level: 5, years: 3.0 },
      { name: "React", level: 3, years: 1.5 },
      { name: "HTML/CSS", level: 4, years: 2.5 },
      { name: "JavaScript", level: 3, years: 1.8 },
      { name: "Tailwind CSS", level: 4, years: 1.5 }
    ],
    roles: ["UI/UX Designer", "Frontend Developer"],
    availability: [
      { day: "Tue", start: "14:00", end: "18:00" },
      { day: "Thu", start: "10:00", end: "14:00" },
      { day: "Sat", start: "13:00", end: "17:00" }
    ],
    applyTo: [1, 3]
  },
  {
    fullName: "Arjun Reddy",
    email: "arjun.reddy@teamsync.demo",
    department: "MTech Cloud Computing",
    yearOfStudy: 2,
    experienceLevel: "Advanced",
    bio: "DevOps engineer with AWS certifications. Managed cloud infrastructure for 3 production apps. Expert in containerization, CI/CD pipelines, and Kubernetes orchestration.",
    skills: [
      { name: "AWS", level: 5, years: 3.2 },
      { name: "Docker", level: 5, years: 2.8 },
      { name: "Kubernetes", level: 4, years: 2.2 },
      { name: "CI/CD", level: 5, years: 2.5 },
      { name: "Python", level: 4, years: 2.5 },
      { name: "Linux", level: 5, years: 3.5 },
      { name: "Terraform", level: 4, years: 1.8 }
    ],
    roles: ["DevOps Engineer", "Backend Developer"],
    availability: [
      { day: "Mon", start: "16:00", end: "20:00" },
      { day: "Wed", start: "10:00", end: "13:00" },
      { day: "Fri", start: "14:00", end: "18:00" }
    ],
    applyTo: [2]
  },
  {
    fullName: "Sneha Gupta",
    email: "sneha.gupta@teamsync.demo",
    department: "MTech CSE",
    yearOfStudy: 1,
    experienceLevel: "Beginner",
    bio: "Mobile development enthusiast just starting out. Learning React Native through online courses. Built 2 practice apps. Eager to join a team and learn from experienced developers.",
    skills: [
      { name: "React Native", level: 2, years: 0.8 },
      { name: "JavaScript", level: 3, years: 1.2 },
      { name: "React", level: 2, years: 1.0 },
      { name: "HTML/CSS", level: 3, years: 1.5 }
    ],
    roles: ["Mobile Developer", "Frontend Developer"],
    availability: [
      { day: "Tue", start: "10:00", end: "14:00" },
      { day: "Thu", start: "14:00", end: "17:00" },
      { day: "Sat", start: "10:00", end: "13:00" }
    ],
    applyTo: [3]
  },
  {
    fullName: "Vikram Kumar",
    email: "vikram.kumar@teamsync.demo",
    department: "MTech Cyber Security",
    yearOfStudy: 2,
    experienceLevel: "Intermediate",
    bio: "Security-focused backend engineer. Built secure REST APIs with authentication, encryption, and rate limiting. Experienced with SQL and NoSQL databases. Internship at fintech company.",
    skills: [
      { name: "Node.js", level: 4, years: 2.5 },
      { name: "Python", level: 4, years: 2.2 },
      { name: "PostgreSQL", level: 4, years: 2.0 },
      { name: "MongoDB", level: 3, years: 1.5 },
      { name: "REST APIs", level: 5, years: 2.8 },
      { name: "Docker", level: 3, years: 1.2 },
      { name: "Express.js", level: 4, years: 2.5 }
    ],
    roles: ["Backend Developer", "Full-Stack Developer"],
    availability: [
      { day: "Mon", start: "10:00", end: "14:00" },
      { day: "Wed", start: "16:00", end: "20:00" },
      { day: "Fri", start: "10:00", end: "14:00" }
    ],
    applyTo: [1, 4]
  },
  {
    fullName: "Divya Iyer",
    email: "divya.iyer@teamsync.demo",
    department: "MTech AI & ML",
    yearOfStudy: 1,
    experienceLevel: "Intermediate",
    bio: "Computer vision researcher working on object detection and image segmentation. Participated in 2 Kaggle competitions (top 10%). Strong foundation in CNNs and transfer learning.",
    skills: [
      { name: "Python", level: 4, years: 2.5 },
      { name: "Computer Vision", level: 4, years: 2.2 },
      { name: "TensorFlow", level: 4, years: 1.8 },
      { name: "PyTorch", level: 3, years: 1.5 },
      { name: "Machine Learning", level: 4, years: 2.5 },
      { name: "Deep Learning", level: 3, years: 1.8 }
    ],
    roles: ["ML Engineer", "Data Scientist"],
    availability: [
      { day: "Tue", start: "13:00", end: "17:00" },
      { day: "Thu", start: "10:00", end: "13:00" },
      { day: "Sat", start: "14:00", end: "18:00" }
    ],
    applyTo: [0]
  },
  {
    fullName: "Aditya Nair",
    email: "aditya.nair@teamsync.demo",
    department: "MTech Software Engineering",
    yearOfStudy: 2,
    experienceLevel: "Advanced",
    bio: "Blockchain developer specializing in Ethereum and smart contracts. Developed 3 DeFi applications. Strong in Solidity, Web3.js, and decentralized architecture patterns.",
    skills: [
      { name: "Ethereum", level: 5, years: 2.8 },
      { name: "Solidity", level: 5, years: 2.5 },
      { name: "Web3", level: 5, years: 2.2 },
      { name: "JavaScript", level: 4, years: 3.5 },
      { name: "React", level: 4, years: 2.8 },
      { name: "Node.js", level: 4, years: 2.5 }
    ],
    roles: ["Backend Developer", "Full-Stack Developer", "Technical Lead"],
    availability: [
      { day: "Mon", start: "13:00", end: "17:00" },
      { day: "Wed", start: "10:00", end: "14:00" },
      { day: "Fri", start: "16:00", end: "20:00" }
    ],
    applyTo: [4]
  },
  {
    fullName: "Kavya Menon",
    email: "kavya.menon@teamsync.demo",
    department: "MCA",
    yearOfStudy: 1,
    experienceLevel: "Beginner",
    bio: "Backend development learner with strong fundamentals. Completed Node.js certification. Built personal blog API and authentication system. Looking to gain real project experience.",
    skills: [
      { name: "Node.js", level: 2, years: 0.6 },
      { name: "MongoDB", level: 2, years: 0.5 },
      { name: "JavaScript", level: 3, years: 1.2 },
      { name: "Express.js", level: 2, years: 0.6 },
      { name: "REST APIs", level: 2, years: 0.5 }
    ],
    roles: ["Backend Developer"],
    availability: [
      { day: "Tue", start: "10:00", end: "13:00" },
      { day: "Thu", start: "13:00", end: "17:00" },
      { day: "Sat", start: "10:00", end: "14:00" }
    ],
    applyTo: [1]
  }
];

async function createDemoUsers() {
  console.log('🚀 Starting complete demo setup...\n');
  console.log('This will create:');
  console.log('  - 10 Firebase Auth accounts');
  console.log('  - 10 Firestore user profiles with subcollections');
  console.log('  - Multiple project applications');
  console.log(`  - Password for all: ${DEFAULT_PASSWORD}\n`);

  // Get all existing projects
  const projectsSnap = await db.collection('projects').get();
  const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`📁 Found ${projects.length} projects in database\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of DEMO_USERS) {
    try {
      console.log(`\n👤 Processing: ${user.fullName} (${user.email})`);

      // 1. Create or get Firebase Auth user
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(user.email);
        console.log(`   ✓ Auth account already exists (${userRecord.uid})`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          userRecord = await auth.createUser({
            email: user.email,
            password: DEFAULT_PASSWORD,
            displayName: user.fullName,
          });
          console.log(`   ✓ Created Firebase Auth account (${userRecord.uid})`);
        } else {
          throw error;
        }
      }

      const uid = userRecord.uid;

      // 2. Create Firestore user profile
      const userDoc = db.collection('users').doc(uid);
      await userDoc.set({
        fullName: user.fullName,
        email: user.email,
        userRole: "Student",
        profile: {
          department: user.department,
          yearOfStudy: user.yearOfStudy,
          experienceLevel: user.experienceLevel,
          bio: user.bio
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log(`   ✓ Created user profile`);

      // 3. Create skills subcollection
      for (const skill of user.skills) {
        const skillId = slug("sk", skill.name);
        await userDoc.collection('skills').doc(skillId).set({
          skillId,
          skillName: skill.name,
          proficiencyLevel: skill.level,
          yearsOfExperience: skill.years
        });
      }
      console.log(`   ✓ Added ${user.skills.length} skills`);

      // 4. Create preferred roles subcollection
      for (let i = 0; i < user.roles.length; i++) {
        const roleId = slug("r", user.roles[i]);
        await userDoc.collection('preferredRoles').doc(roleId).set({
          roleId,
          roleName: user.roles[i],
          preferenceRank: i + 1
        });
      }
      console.log(`   ✓ Added ${user.roles.length} preferred roles`);

      // 5. Create availability subcollection
      for (let i = 0; i < user.availability.length; i++) {
        const slot = user.availability[i];
        await userDoc.collection('availability').doc(`slot_${i}`).set({
          dayOfWeek: slot.day,
          startTime: slot.start,
          endTime: slot.end
        });
      }
      console.log(`   ✓ Added ${user.availability.length} availability slots`);

      // 6. Apply to projects (if specified)
      if (user.applyTo && user.applyTo.length > 0) {
        for (const projectIndex of user.applyTo) {
          if (projectIndex < projects.length) {
            const project = projects[projectIndex];
            
            // Don't apply to own projects
            if (project.ownerUserId === uid) continue;
            
            // Pick a random role from project's required roles
            const requiredRoles = project.requiredRoles || [];
            if (requiredRoles.length === 0) continue;
            
            // Find a role this user prefers, or pick first available
            let chosenRole = requiredRoles[0];
            for (const userRole of user.roles) {
              const matchingRole = requiredRoles.find(r => r.roleName === userRole);
              if (matchingRole) {
                chosenRole = matchingRole;
                break;
              }
            }

            const appRef = db.collection('projects').doc(project.id).collection('applications').doc(uid);
            const existingApp = await appRef.get();
            
            if (!existingApp.exists || existingApp.data().status === 'Withdrawn') {
              await appRef.set({
                projectId: project.id,
                profileId: uid,
                applicantName: user.fullName,
                appliedRoleId: chosenRole.roleId,
                matchScore: 0, // Will be calculated by Cloud Function trigger
                status: "Pending",
                appliedAt: admin.firestore.FieldValue.serverTimestamp(),
                decidedAt: null,
              });
              console.log(`   ✓ Applied to "${project.title}" as ${chosenRole.roleName}`);
            } else {
              console.log(`   - Already applied to "${project.title}"`);
            }
          }
        }
      }

      successCount++;
      console.log(`   ✅ ${user.fullName} setup complete!`);

    } catch (error) {
      console.error(`   ✗ Error setting up ${user.email}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n\n📊 SETUP COMPLETE');
  console.log('═'.repeat(60));
  console.log(`✓ Successfully created: ${successCount} users`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log('\n🔑 LOGIN CREDENTIALS:');
  console.log('═'.repeat(60));
  DEMO_USERS.forEach(({ fullName, email }) => {
    console.log(`${fullName.padEnd(25)} | ${email}`);
  });
  console.log(`\n🔐 Password for all demo users: ${DEFAULT_PASSWORD}`);
  console.log('\n💡 You can now:');
  console.log('   1. Log in as any demo user');
  console.log('   2. View their applications');
  console.log('   3. Accept/reject applications as project owners');
  console.log('   4. See real team formation in action!');
}

createDemoUsers()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
