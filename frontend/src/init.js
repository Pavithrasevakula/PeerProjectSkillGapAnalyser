import { collection, doc, getDocs, setDoc, addDoc, Timestamp, serverTimestamp, deleteDoc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";

const SKILLS_DATA = [
  // Frontend
  ["React", "Frontend"], ["Vue.js", "Frontend"], ["Angular", "Frontend"], ["Next.js", "Frontend"],
  ["Svelte", "Frontend"], ["HTML/CSS", "Frontend"], ["JavaScript", "Frontend"], ["TypeScript", "Frontend"],
  ["Tailwind CSS", "Frontend"], ["Material-UI", "Frontend"], ["Redux", "Frontend"],
  
  // Backend
  ["Node.js", "Backend"], ["Python", "Backend"], ["Java", "Backend"], ["Go", "Backend"],
  ["Django", "Backend"], ["Flask", "Backend"], ["FastAPI", "Backend"], ["Express.js", "Backend"],
  ["Spring Boot", "Backend"], ["REST APIs", "Backend"], ["GraphQL", "Backend"],
  
  // Database
  ["SQL", "Database"], ["PostgreSQL", "Database"], ["MySQL", "Database"], ["MongoDB", "Database"],
  ["Redis", "Database"], ["Firebase", "Database"], ["Elasticsearch", "Database"],
  
  // AI/ML
  ["Machine Learning", "AI/ML"], ["Deep Learning", "AI/ML"], ["TensorFlow", "AI/ML"],
  ["PyTorch", "AI/ML"], ["NLP", "AI/ML"], ["Computer Vision", "AI/ML"], ["LLMs", "AI/ML"],
  ["scikit-learn", "AI/ML"], ["Keras", "AI/ML"], ["Hugging Face", "AI/ML"],
  
  // Cloud & DevOps
  ["AWS", "Cloud"], ["Azure", "Cloud"], ["Google Cloud", "Cloud"], ["Docker", "DevOps"],
  ["Kubernetes", "Cloud"], ["CI/CD", "DevOps"], ["Jenkins", "DevOps"], ["GitHub Actions", "DevOps"],
  ["Terraform", "DevOps"],
  
  // Mobile
  ["React Native", "Mobile"], ["Flutter", "Mobile"], ["Swift", "Mobile"], ["Kotlin", "Mobile"],
  
  // Blockchain
  ["Ethereum", "Blockchain"], ["Solidity", "Blockchain"], ["Web3", "Blockchain"],
  
  // Design
  ["UI/UX Design", "Design"], ["Figma", "Design"], ["Adobe XD", "Design"],
  
  // Other
  ["Git", "Version Control"], ["Agile/Scrum", "Management"], ["Project Management", "Management"],
];

const ROLES_DATA = [
  "Frontend Developer", "Backend Developer", "Full-Stack Developer",
  "Data Scientist", "ML Engineer", "DevOps Engineer", "UI/UX Designer",
  "Mobile Developer", "Project Manager", "Technical Lead",
];

// Demo projects with Indian context - each with different display owner name
const DEMO_PROJECTS = [
  {
    title: "AI-Powered Healthcare Diagnosis System",
    description: "Building an ML model to assist doctors in diagnosing diseases from medical images using deep learning and computer vision. Focused on common diseases in Indian healthcare.",
    domain: "Machine Learning",
    ownerName: "Arjun Sharma",
    skills: [
      { name: "Python", level: 4, priority: "Must-have" },
      { name: "TensorFlow", level: 4, priority: "Must-have" },
      { name: "Computer Vision", level: 3, priority: "Must-have" },
      { name: "Deep Learning", level: 3, priority: "Must-have" }
    ],
    roles: [
      { name: "ML Engineer", slots: 2 },
      { name: "Backend Developer", slots: 1 }
    ]
  },
  {
    title: "E-Commerce Platform for Local Artisans",
    description: "Developing a full-stack e-commerce website to help local Indian artisans sell their handmade products online with AI-powered personalized recommendations.",
    domain: "Web Development",
    ownerName: "Priya Patel",
    skills: [
      { name: "React", level: 3, priority: "Must-have" },
      { name: "Node.js", level: 3, priority: "Must-have" },
      { name: "MongoDB", level: 3, priority: "Must-have" },
      { name: "REST APIs", level: 3, priority: "Nice-to-have" }
    ],
    roles: [
      { name: "Frontend Developer", slots: 2 },
      { name: "Backend Developer", slots: 1 },
      { name: "UI/UX Designer", slots: 1 }
    ]
  },
  {
    title: "Smart City Traffic Management System",
    description: "Creating a real-time IoT dashboard to monitor and optimize traffic flow in smart cities using sensor data and predictive analytics.",
    domain: "IoT",
    ownerName: "Karthik Reddy",
    skills: [
      { name: "Python", level: 3, priority: "Must-have" },
      { name: "React", level: 3, priority: "Must-have" },
      { name: "AWS", level: 3, priority: "Nice-to-have" },
      { name: "Machine Learning", level: 3, priority: "Nice-to-have" }
    ],
    roles: [
      { name: "Full-Stack Developer", slots: 2 },
      { name: "Data Scientist", slots: 1 }
    ]
  },
  {
    title: "Online Learning Platform for Rural Students",
    description: "Building an accessible online education platform with offline capabilities to support students in rural India with limited internet connectivity.",
    domain: "EdTech",
    ownerName: "Sneha Kumar",
    skills: [
      { name: "React", level: 3, priority: "Must-have" },
      { name: "Node.js", level: 3, priority: "Must-have" },
      { name: "MongoDB", level: 3, priority: "Must-have" },
      { name: "React Native", level: 3, priority: "Nice-to-have" }
    ],
    roles: [
      { name: "Frontend Developer", slots: 1 },
      { name: "Backend Developer", slots: 1 },
      { name: "Mobile Developer", slots: 1 }
    ]
  },
  {
    title: "Blockchain-Based Land Registry System",
    description: "Implementing a transparent and secure land registration system using blockchain to prevent fraud and streamline property transactions.",
    domain: "Blockchain",
    ownerName: "Vikram Singh",
    skills: [
      { name: "Ethereum", level: 3, priority: "Must-have" },
      { name: "Solidity", level: 3, priority: "Must-have" },
      { name: "React", level: 3, priority: "Must-have" },
      { name: "Node.js", level: 3, priority: "Nice-to-have" }
    ],
    roles: [
      { name: "Backend Developer", slots: 2 },
      { name: "Frontend Developer", slots: 1 }
    ]
  }
];

function slug(prefix, name) {
  return `${prefix}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
}

let isInitializing = false;
let initializedForUserId = null;

export async function ensureDataInitialized() {
  if (isInitializing) return;
  
  try {
    isInitializing = true;
    
    // Wait for auth to be ready and get current user
    const user = await new Promise((resolve) => {
      if (auth.currentUser) {
        resolve(auth.currentUser);
      } else {
        const unsubscribe = auth.onAuthStateChanged((u) => {
          unsubscribe();
          resolve(u);
        });
      }
    });
    
    if (!user) {
      isInitializing = false;
      return;
    }
    if (initializedForUserId === user.uid) return;
    
    console.log(`User authenticated: ${user.email} (UID: ${user.uid})`);
    
    // Get user's account info to use their name for one project
    const accountDoc = await getDoc(doc(db, "users", user.uid));
    const account = accountDoc.exists() ? accountDoc.data() : null;
    
    // Check if already initialized
    const skillsSnapshot = await getDocs(collection(db, "skills"));
    const projectsSnapshot = await getDocs(collection(db, "projects"));
    
    console.log(`Current state: ${skillsSnapshot.size} skills, ${projectsSnapshot.size} projects`);
    
    // Early return if already fully initialized
    const hasNewProjects = projectsSnapshot.size > 0 && projectsSnapshot.docs.some(doc => doc.data().ownerName);
    if (skillsSnapshot.size >= SKILLS_DATA.length && hasNewProjects && projectsSnapshot.size >= 6) {
      initializedForUserId = user.uid;
      return;
    }
    
    console.log("Starting initialization process...");
    
    // Add skills only if needed
    if (skillsSnapshot.size < SKILLS_DATA.length) {
      console.log(`Adding skills (current: ${skillsSnapshot.size}, target: ${SKILLS_DATA.length})...`);
      try {
        const skillPromises = SKILLS_DATA.map(([skillName, skillCategory]) => {
          const id = slug("sk", skillName);
          return setDoc(doc(db, "skills", id), { skillName, skillCategory }, { merge: true });
        });
        await Promise.all(skillPromises);
        console.log(`Skills ready`);
      } catch (err) {
        console.error(`Skills creation error:`, err.message);
        throw err;
      }
    } else {
      console.log(`Skills already complete (${skillsSnapshot.size}/${SKILLS_DATA.length})`);
    }
    
    // Add roles only if needed
    const rolesSnapshot = await getDocs(collection(db, "roles"));
    if (rolesSnapshot.size < ROLES_DATA.length) {
      console.log(`Adding roles (current: ${rolesSnapshot.size}, target: ${ROLES_DATA.length})...`);
      try {
        const rolePromises = ROLES_DATA.map(roleName => {
          const id = slug("r", roleName);
          return setDoc(doc(db, "roles", id), { roleName }, { merge: true });
        });
        await Promise.all(rolePromises);
        console.log(`Roles ready`);
      } catch (err) {
        console.error(`Roles creation error:`, err.message);
        throw err;
      }
    } else {
      console.log(`Roles already complete (${rolesSnapshot.size}/${ROLES_DATA.length})`);
    }
    
    // Create demo projects if needed (or if old projects don't have ownerName)
    const needsProjects = projectsSnapshot.size < 6 || !projectsSnapshot.docs.some(doc => doc.data().ownerName);
    if (needsProjects) {
      console.log("Creating demo projects...");
      
      // Delete old projects without ownerName if any exist
      if (projectsSnapshot.size > 0 && !projectsSnapshot.docs.some(doc => doc.data().ownerName)) {
        console.log("   Removing old demo projects...");
        try {
          for (const docSnapshot of projectsSnapshot.docs) {
            if (docSnapshot.data().ownerUserId === user.uid) {
              await deleteDoc(doc(db, "projects", docSnapshot.id));
            }
          }
          console.log("   Old projects removed");
        } catch (err) {
          console.error("   Could not remove old projects:", err.message);
          // Continue anyway
        }
      }
      
      console.log("   Creating demo projects with different owner names...");
      console.log(`   All projects owned by: ${user.email} (for permissions)`);
      console.log(`   Display names: Arjun, Priya, Karthik, Sneha, Vikram + Your Project`);
      
      for (let i = 0; i < DEMO_PROJECTS.length; i++) {
        const project = DEMO_PROJECTS[i];
        console.log(`  [${i+1}/${DEMO_PROJECTS.length}] Creating: ${project.title}`);
        
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 60); // 60 days from now
        
        const requiredSkills = project.skills.map(s => ({
          skillId: slug("sk", s.name),
          skillName: s.name,
          minProficiency: s.level,
          priority: s.priority
        }));
        
        const requiredRoles = project.roles.map(r => ({
          roleId: slug("r", r.name),
          roleName: r.name,
          slots: r.slots
        }));
        
        const projectData = {
          title: project.title,
          description: project.description,
          domainArea: project.domain,
          teamSizeRequired: project.roles.reduce((sum, r) => sum + r.slots, 0),
          deadline: Timestamp.fromDate(deadline),
          requiredSkills,
          requiredRoles,
          requiredSkillIds: requiredSkills.map(s => s.skillId),
          requiredRoleIds: requiredRoles.map(r => r.roleId),
          ownerUserId: user.uid, // All owned by current user (for permissions)
          ownerName: project.ownerName, // Display name for UI
          status: "Open",
          createdAt: serverTimestamp()
        };
        
        console.log(`     Display owner: ${project.ownerName}`);
        console.log(`     Actual owner: ${user.email} (for permissions)`);
        console.log(`     Team size: ${projectData.teamSizeRequired}`);
        
        try {
          const docRef = await addDoc(collection(db, "projects"), projectData);
          console.log(`  Created with ID: ${docRef.id}`);
        } catch (err) {
          console.error(`  Failed to create ${project.title}`);
          console.error(`     Error code: ${err.code}`);
          console.error(`     Error message: ${err.message}`);
          if (err.code === 'permission-denied') {
            console.error(`     Security rules issue`);
          }
        }
      }
      console.log(`Finished creating demo projects`);
      
      // Create one project with user's actual name (so they can manage it)
      if (account?.fullName) {
        console.log(`   Creating your personal project...`);
        
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 90);
        
        try {
          const docRef = await addDoc(collection(db, "projects"), {
            title: "My First Project",
            description: "This is your personal project that you can edit and manage. Feel free to customize it!",
            domainArea: "General",
            teamSizeRequired: 3,
            deadline: Timestamp.fromDate(deadline),
            requiredSkills: [
              { skillId: "sk_react", skillName: "React", minProficiency: 3, priority: "Must-have" },
              { skillId: "sk_node_js", skillName: "Node.js", minProficiency: 3, priority: "Must-have" }
            ],
            requiredRoles: [
              { roleId: "r_frontend_developer", roleName: "Frontend Developer", slots: 1 },
              { roleId: "r_backend_developer", roleName: "Backend Developer", slots: 1 }
            ],
            requiredSkillIds: ["sk_react", "sk_node_js"],
            requiredRoleIds: ["r_frontend_developer", "r_backend_developer"],
            ownerUserId: user.uid,
            ownerName: account.fullName,
            status: "Open",
            createdAt: serverTimestamp()
          });
          console.log(`  Created your project with ID: ${docRef.id}`);
        } catch (err) {
          console.error(`  Failed to create your project:`, err.message);
        }
      }
    }
    
    initializedForUserId = user.uid;
    console.log(`\nInitialization complete!`);
    const finalSkillsSnapshot = await getDocs(collection(db, "skills"));
    const finalProjectsSnapshot = await getDocs(collection(db, "projects"));
    console.log(`   Final state:`);
    console.log(`      - Skills: ${finalSkillsSnapshot.size}/${SKILLS_DATA.length}`);
    console.log(`      - Projects: ${finalProjectsSnapshot.size}/6`);
    console.log(`\nNext step: Create demo users with Firebase Auth`);
    console.log(`   Run: cd functions && node scripts/createCompleteDemo.js`);
    console.log(`\n`);
    
  } catch (error) {
    console.error("Initialization failed:", error);
    console.error("Error details:", error.message);
  } finally {
    isInitializing = false;
  }
}
