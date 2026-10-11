"use strict";
/**
 * Deterministic synthetic dataset (fixed faker seed -> reproducible, referentially consistent).
 * Used by seed.js (writes to Firestore) and evaluate.js (in-memory experiment).
 */
const { faker } = require("@faker-js/faker");

const SKILLS = [
  // Frontend Development
  ["React", "Frontend"], ["Vue.js", "Frontend"], ["Angular", "Frontend"], ["Next.js", "Frontend"], 
  ["Svelte", "Frontend"], ["HTML/CSS", "Frontend"], ["JavaScript", "Frontend"], ["TypeScript", "Frontend"],
  ["Tailwind CSS", "Frontend"], ["Material-UI", "Frontend"], ["Redux", "Frontend"], ["Webpack", "Frontend"],
  
  // Backend Development
  ["Node.js", "Backend"], ["Python", "Backend"], ["Java", "Backend"], ["Go", "Backend"],
  ["C#/.NET", "Backend"], ["PHP", "Backend"], ["Ruby on Rails", "Backend"], ["Spring Boot", "Backend"],
  ["REST APIs", "Backend"], ["GraphQL", "Backend"], ["Django", "Backend"], ["Flask", "Backend"],
  ["FastAPI", "Backend"], ["Express.js", "Backend"], ["NestJS", "Backend"],
  
  // Database & Data
  ["SQL", "Database"], ["PostgreSQL", "Database"], ["MySQL", "Database"], ["MongoDB", "Database"],
  ["Redis", "Database"], ["Firebase", "Database"], ["Firestore", "Database"], ["Elasticsearch", "Database"],
  ["DynamoDB", "Database"], ["Cassandra", "Database"], ["Neo4j", "Database"],
  ["Pandas", "Data Engineering"], ["Apache Spark", "Data Engineering"], ["Apache Kafka", "Data Engineering"],
  ["Airflow", "Data Engineering"], ["dbt", "Data Engineering"], ["Data Visualization", "Data Engineering"],
  ["Tableau", "Data Engineering"], ["Power BI", "Data Engineering"],
  
  // AI & Machine Learning
  ["Machine Learning", "AI/ML"], ["Deep Learning", "AI/ML"], ["Neural Networks", "AI/ML"],
  ["TensorFlow", "AI/ML"], ["PyTorch", "AI/ML"], ["Keras", "AI/ML"], ["scikit-learn", "AI/ML"],
  ["Computer Vision", "AI/ML"], ["NLP", "AI/ML"], ["LLMs", "AI/ML"], ["GPT/Transformers", "AI/ML"],
  ["BERT", "AI/ML"], ["Hugging Face", "AI/ML"], ["OpenAI API", "AI/ML"], ["LangChain", "AI/ML"],
  ["RAG Systems", "AI/ML"], ["Reinforcement Learning", "AI/ML"], ["MLOps", "AI/ML"],
  ["Model Deployment", "AI/ML"], ["Feature Engineering", "AI/ML"],
  
  // Cloud & DevOps
  ["AWS", "Cloud"], ["Azure", "Cloud"], ["Google Cloud", "Cloud"], ["Kubernetes", "Cloud"],
  ["Docker", "DevOps"], ["CI/CD", "DevOps"], ["Jenkins", "DevOps"], ["GitHub Actions", "DevOps"],
  ["Terraform", "DevOps"], ["Ansible", "DevOps"], ["Linux", "DevOps"], ["Shell Scripting", "DevOps"],
  ["Nginx", "DevOps"], ["Microservices", "DevOps"], ["Serverless", "Cloud"], ["Lambda Functions", "Cloud"],
  
  // Mobile Development
  ["React Native", "Mobile"], ["Flutter", "Mobile"], ["Swift", "Mobile"], ["Kotlin", "Mobile"],
  ["iOS Development", "Mobile"], ["Android Development", "Mobile"],
  
  // Blockchain & Web3
  ["Blockchain", "Web3"], ["Smart Contracts", "Web3"], ["Solidity", "Web3"], ["Ethereum", "Web3"],
  ["Web3.js", "Web3"], ["DeFi", "Web3"],
  
  // Design & UX
  ["UI/UX Design", "Design"], ["Figma", "Design"], ["Adobe XD", "Design"], ["Sketch", "Design"],
  ["Prototyping", "Design"], ["User Research", "Design"], ["Wireframing", "Design"],
  
  // Security
  ["Cybersecurity", "Security"], ["Penetration Testing", "Security"], ["Encryption", "Security"],
  ["OAuth/JWT", "Security"], ["API Security", "Security"],
  
  // Testing & QA
  ["Jest", "Testing"], ["Pytest", "Testing"], ["Selenium", "Testing"], ["Unit Testing", "Testing"],
  ["Integration Testing", "Testing"], ["Test Automation", "Testing"],
  
  // Other Technologies
  ["Git", "Version Control"], ["GitHub", "Version Control"], ["GitLab", "Version Control"],
  ["Agile/Scrum", "Management"], ["JIRA", "Management"], ["Project Management", "Management"],
  ["Technical Writing", "Management"], ["API Documentation", "Management"],
  ["WebSockets", "Backend"], ["Real-time Systems", "Backend"], ["Caching", "Backend"],
  ["System Design", "Architecture"], ["Microservices Architecture", "Architecture"],
  ["Event-Driven Architecture", "Architecture"],
];

const ROLES = [
  "Frontend Developer", "Backend Developer", "Full-Stack Developer", 
  "Data Scientist", "Data Engineer", "ML Engineer", "AI Researcher",
  "DevOps Engineer", "Cloud Architect", "UI/UX Designer", 
  "Mobile Developer", "Blockchain Developer", "Security Engineer",
  "QA Engineer", "Project Manager", "Product Manager", "Technical Lead",
  "Research Scientist", "MLOps Engineer", "Site Reliability Engineer",
];

const DEPARTMENTS = [
  "MTech CSE", "MTech AI & ML", "MTech Data Science", "MTech Cloud Computing",
  "MTech Software Engineering", "MTech Cyber Security", "MCA", "MCA (AI & ML)",
  "MSc Data Science", "MSc AI", "PhD CSE", "PhD AI",
];

const DOMAINS = [
  "EdTech", "HealthTech", "FinTech", "E-Commerce", "Smart City", "AgriTech", 
  "Social Good", "Climate Tech", "Gaming", "IoT", "AR/VR", "Blockchain",
  "AI Tools", "Developer Tools", "Analytics", "Marketing Tech", "HR Tech",
  "Legal Tech", "Real Estate Tech", "Travel Tech", "Food Tech",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_TIMES = ["09:00", "10:00", "14:00", "16:00", "18:00", "19:00"];
const ADJECTIVES = [
  "Smart", "Intelligent", "Adaptive", "Collaborative", "Predictive", "Automated",
  "Real-time", "Scalable", "Cloud-based", "AI-Powered", "Secure", "Modern",
  "Advanced", "Innovative", "Next-Gen", "Interactive", "Personalized", "Data-Driven",
];
const NOUNS = [
  "Platform", "System", "Tracker", "Assistant", "Dashboard", "Portal", "Planner",
  "Analyzer", "Manager", "Engine", "Solution", "Framework", "Toolkit", "Hub",
  "Marketplace", "Network", "Monitor", "Optimizer", "Builder", "Suite",
];

const slug = (prefix, name) => `${prefix}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
const pad = (n, w = 3) => String(n).padStart(w, "0");
const addHours = (hhmm, h) => `${pad(Number(hhmm.slice(0, 2)) + h, 2)}:${hhmm.slice(3)}`;
const LEVEL_RANGE = { Beginner: [1, 3], Intermediate: [2, 4], Advanced: [3, 5] };

function generateDataset({ seed = 42, userCount = 120, projectCount = 35, refDate = "2026-10-01T00:00:00Z" } = {}) {
  faker.seed(seed);
  const pick = (arr) => faker.helpers.arrayElement(arr);
  const some = (arr, n) => faker.helpers.arrayElements(arr, n);
  const int = (min, max) => faker.number.int({ min, max });

  const skills = SKILLS.map(([skillName, skillCategory]) => ({ id: slug("sk", skillName), skillName, skillCategory }));
  const roles = ROLES.map((roleName) => ({ id: slug("r", roleName), roleName }));

  const users = Array.from({ length: userCount }, (_, i) => {
    const experienceLevel = faker.helpers.weightedArrayElement([
      { weight: 4, value: "Beginner" }, { weight: 4, value: "Intermediate" }, { weight: 2, value: "Advanced" },
    ]);
    const [lo, hi] = LEVEL_RANGE[experienceLevel];
    return {
      uid: `u${pad(i + 1)}`,
      fullName: faker.person.fullName(),
      email: `student${pad(i + 1)}@example.edu`,
      userRole: i < projectCount ? "Both" : "Student",
      createdAt: faker.date.past({ years: 1, refDate }),
      profile: { department: pick(DEPARTMENTS), yearOfStudy: int(1, 2), experienceLevel, bio: faker.lorem.sentence() },
      skills: some(skills, int(2, 6)).map((s) => {
        const proficiencyLevel = int(lo, hi);
        return {
          skillId: s.id, skillName: s.skillName, proficiencyLevel,
          yearsOfExperience: Math.round((proficiencyLevel * 0.5 + faker.number.float({ min: 0, max: 1.5 })) * 10) / 10,
        };
      }),
      preferredRoles: some(roles, int(1, 3)).map((r, idx) => ({ roleId: r.id, roleName: r.roleName, preferenceRank: idx + 1 })),
      availability: Array.from({ length: int(2, 4) }, () => {
        const startTime = pick(START_TIMES);
        return { dayOfWeek: pick(DAYS), startTime, endTime: addHours(startTime, int(1, 3)) };
      }),
    };
  });

  const owners = users.filter((u) => u.userRole === "Both");
  const projects = Array.from({ length: projectCount }, (_, i) => {
    const teamSizeRequired = int(3, 6);
    const requiredSkills = some(skills, int(4, 7)).map((s) => ({
      skillId: s.id, skillName: s.skillName, minProficiency: int(2, 4),
      priority: faker.helpers.weightedArrayElement([{ weight: 7, value: "Must-have" }, { weight: 3, value: "Nice-to-have" }]),
    }));
    const roleSample = some(roles, Math.min(roles.length, Math.max(3, teamSizeRequired - 1)));
    const requiredRoles = roleSample.map((r) => ({ roleId: r.id, roleName: r.roleName, slots: 1 }));
    while (requiredRoles.reduce((a, r) => a + r.slots, 0) < teamSizeRequired) pick(requiredRoles).slots += 1;

    const domainArea = pick(DOMAINS);
    const owner = owners[i % owners.length];
    return {
      id: `p${pad(i + 1)}`,
      ownerUserId: owner.uid,
      title: `${pick(ADJECTIVES)} ${domainArea} ${pick(NOUNS)}`,
      description: faker.lorem.sentences(2),
      domainArea, teamSizeRequired, status: "Open",
      deadline: faker.date.future({ years: 0.4, refDate }),
      createdAt: faker.date.past({ years: 0.2, refDate }),
      requiredSkills, requiredRoles,
      requiredSkillIds: requiredSkills.map((s) => s.skillId),
      requiredRoleIds: requiredRoles.map((r) => r.roleId),
      applications: [], teamMembers: [],
    };
  });

  // Pre-formed partial teams (even projects) and a pool of pending applicants for every project.
  const students = users.filter((u) => u.uid);
  for (const [i, p] of projects.entries()) {
    const others = students.filter((u) => u.uid !== p.ownerUserId);
    const picked = some(others, int(4, 8));
    const preformed = i % 2 === 0 ? int(1, 2) : 0;
    const slotsLeft = Object.fromEntries(p.requiredRoles.map((r) => [r.roleId, r.slots]));
    picked.forEach((u, idx) => {
      const open = p.requiredRoles.filter((r) => slotsLeft[r.roleId] > 0);
      const role = pick(open.length ? open : p.requiredRoles);
      if (idx < preformed && open.length) {
        slotsLeft[role.roleId] -= 1;
        p.teamMembers.push({ profileId: u.uid, memberName: u.fullName, assignedRoleId: role.roleId, isTeamLead: idx === 0 });
        p.applications.push({ profileId: u.uid, applicantName: u.fullName, appliedRoleId: role.roleId, status: "Accepted" });
      } else {
        p.applications.push({
          profileId: u.uid, applicantName: u.fullName, appliedRoleId: role.roleId,
          status: faker.helpers.weightedArrayElement([{ weight: 8, value: "Pending" }, { weight: 1, value: "Rejected" }, { weight: 1, value: "Withdrawn" }]),
        });
      }
    });
  }
  return { skills, roles, users, projects };
}

/** Convert a generated user into the engine's candidate shape. */
function toCandidate(user) {
  return {
    uid: user.uid,
    name: user.fullName,
    experienceLevel: user.profile.experienceLevel,
    skills: Object.fromEntries(user.skills.map((s) => [s.skillId, s.proficiencyLevel])),
    preferredRoles: Object.fromEntries(user.preferredRoles.map((r) => [r.roleId, r.preferenceRank])),
    availability: user.availability,
  };
}

module.exports = { generateDataset, toCandidate };
