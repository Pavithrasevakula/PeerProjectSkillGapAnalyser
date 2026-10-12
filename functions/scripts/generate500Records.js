const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// Sample data pools
const indianFirstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Reyansh', 'Aarush', 'Kabir', 'Shivansh', 'Ritvik', 'Kian',
  'Dhruv', 'Rohan', 'Laksh', 'Aayansh', 'Veer', 'Aayan', 'Rudra', 'Darsh', 'Mihir', 'Advait',
  'Aaradhya', 'Saanvi', 'Ananya', 'Diya', 'Aadhya', 'Kiara', 'Kavya', 'Avni', 'Sara', 'Pari',
  'Navya', 'Angel', 'Prisha', 'Myra', 'Anika', 'Riya', 'Shanaya', 'Anvi', 'Siya', 'Ira',
  'Mira', 'Ishika', 'Tara', 'Aditi', 'Sia', 'Priyanka', 'Nisha', 'Sneha', 'Pooja', 'Divya',
  'Rahul', 'Amit', 'Raj', 'Kunal', 'Nikhil', 'Varun', 'Karan', 'Siddharth', 'Manish', 'Abhishek',
  'Priya', 'Anjali', 'Neha', 'Swati', 'Megha', 'Shreya', 'Kavita', 'Ritu', 'Pallavi', 'Sonali'
];

const indianLastNames = [
  'Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Gupta', 'Reddy', 'Rao', 'Nair', 'Menon',
  'Iyer', 'Desai', 'Mehta', 'Joshi', 'Shah', 'Agarwal', 'Khanna', 'Malhotra', 'Bhat', 'Kulkarni',
  'Pandey', 'Mishra', 'Trivedi', 'Saxena', 'Sinha', 'Chopra', 'Kapoor', 'Sethi', 'Bhatia', 'Jain',
  'Bansal', 'Arora', 'Tiwari', 'Das', 'Ghosh', 'Roy', 'Saha', 'Chatterjee', 'Mukherjee', 'Bose',
  'Pillai', 'Varma', 'Naidu', 'Krishna', 'Hegde', 'Shetty', 'Powar', 'Patil', 'Jadhav', 'More'
];

const skills = [
  'React', 'Node.js', 'Python', 'Java', 'JavaScript', 'TypeScript', 'Angular', 'Vue.js', 
  'Django', 'Flask', 'Spring Boot', 'Express.js', 'MongoDB', 'PostgreSQL', 'MySQL', 
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'DevOps', 'CI/CD', 'Git',
  'REST API', 'GraphQL', 'Microservices', 'System Design', 'Data Structures', 'Algorithms',
  'UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
  'SQL', 'NoSQL', 'Redis', 'Elasticsearch', 'Apache Kafka', 'RabbitMQ',
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS',
  'Blockchain', 'Solidity', 'Web3', 'Smart Contracts', 'Ethereum',
  'Cybersecurity', 'Penetration Testing', 'Network Security', 'Cryptography',
  'Data Analysis', 'Pandas', 'NumPy', 'Matplotlib', 'Tableau', 'Power BI',
  'Agile', 'Scrum', 'JIRA', 'Project Management', 'Team Leadership',
  'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind CSS', 'Material-UI',
  'Testing', 'Jest', 'Selenium', 'Cypress', 'Unit Testing', 'Integration Testing'
];

const roles = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile App Developer',
  'ML Engineer', 'Data Scientist', 'DevOps Engineer', 'UI/UX Designer',
  'Project Manager', 'Team Lead', 'QA Engineer', 'System Architect',
  'Database Administrator', 'Security Engineer', 'Cloud Engineer', 'Data Analyst'
];

const projectTitles = [
  'E-Commerce Platform', 'Social Media App', 'Healthcare Management System', 'Online Learning Platform',
  'Food Delivery App', 'Ride Sharing System', 'Smart Home Automation', 'Fitness Tracking App',
  'Banking Application', 'Travel Booking System', 'Inventory Management', 'CRM System',
  'Hotel Reservation System', 'Employee Management Portal', 'Library Management System',
  'Smart City Dashboard', 'Weather Forecasting App', 'Music Streaming Platform', 'Video Conferencing Tool',
  'Task Management System', 'Blog Platform', 'Portfolio Generator', 'Code Collaboration Tool',
  'Real Estate Portal', 'Job Portal', 'Event Management System', 'Recipe Sharing App',
  'Expense Tracker', 'Parking Management System', 'Chatbot Application', 'AI Image Generator',
  'Document Management System', 'Attendance System', 'Quiz Platform', 'Voting System',
  'Blockchain Wallet', 'NFT Marketplace', 'Cryptocurrency Exchange', 'Supply Chain Tracker',
  'Telemedicine Platform', 'Mental Health App', 'Nutrition Tracker', 'Hospital Management System',
  'School Management System', 'Online Examination System', 'Student Portal', 'Course Management System',
  'Traffic Management System', 'Waste Management App', 'Water Quality Monitor', 'Air Quality Index App',
  'Agricultural Advisory System', 'Crop Disease Detection', 'Farm Management System', 'Soil Analysis Tool'
];

const projectDescriptions = [
  'A comprehensive platform to streamline operations and improve efficiency',
  'An innovative solution leveraging cutting-edge technology',
  'A user-friendly application designed for seamless experience',
  'A robust system built with scalability and performance in mind',
  'An intelligent platform powered by AI and machine learning',
  'A modern web application with responsive design',
  'A cloud-based solution for enhanced accessibility',
  'A data-driven platform for informed decision making',
  'An integrated system connecting multiple stakeholders',
  'A secure and reliable application with advanced features'
];

const domains = [
  'Healthcare', 'Education', 'E-Commerce', 'Finance', 'Agriculture',
  'Transportation', 'Real Estate', 'Entertainment', 'Social Media', 'Gaming',
  'IoT', 'Blockchain', 'AI/ML', 'Cybersecurity', 'Cloud Computing',
  'Mobile Development', 'Web Development', 'Data Science', 'DevOps', 'Networking'
];

const timeSlots = [
  'Monday 9:00 AM - 12:00 PM',
  'Monday 2:00 PM - 5:00 PM',
  'Tuesday 10:00 AM - 1:00 PM',
  'Tuesday 3:00 PM - 6:00 PM',
  'Wednesday 9:00 AM - 12:00 PM',
  'Wednesday 2:00 PM - 5:00 PM',
  'Thursday 10:00 AM - 1:00 PM',
  'Thursday 3:00 PM - 6:00 PM',
  'Friday 9:00 AM - 12:00 PM',
  'Friday 2:00 PM - 5:00 PM',
  'Saturday 10:00 AM - 1:00 PM',
  'Saturday 3:00 PM - 6:00 PM'
];

// Helper functions
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements(arr, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmail(firstName, lastName, index) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@students.edu`;
}

function generateSkillsWithLevels(skillsList) {
  return skillsList.map(skill => ({
    name: skill,
    level: randomInt(1, 5)
  }));
}

async function generate500Records() {
  console.log('\n🚀 Starting generation of 500+ sample records...\n');
  
  let batch = db.batch();
  let batchCount = 0;
  const MAX_BATCH = 500; // Firestore limit
  
  const users = [];
  const projects = [];
  
  try {
    // ============================================
    // 1. Generate 200 Users
    // ============================================
    console.log('📊 Step 1/5: Generating 200 users...');
    
    for (let i = 1; i <= 200; i++) {
      const firstName = randomElement(indianFirstNames);
      const lastName = randomElement(indianLastNames);
      const fullName = `${firstName} ${lastName}`;
      const email = generateEmail(firstName, lastName, i);
      
      // Create Auth user
      let userRecord;
      try {
        userRecord = await auth.createUser({
          email: email,
          password: 'Student@123',
          displayName: fullName
        });
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          userRecord = await auth.getUserByEmail(email);
        } else {
          throw error;
        }
      }
      
      const uid = userRecord.uid;
      
      const userData = {
        uid: uid,
        fullName: fullName,
        email: email,
        bio: `${randomElement(roles)} with ${randomInt(1, 5)} years of experience in ${randomElement(domains)}.`,
        skills: generateSkillsWithLevels(randomElements(skills, 5, 12)),
        roles: randomElements(roles, 2, 4),
        timeSlots: randomElements(timeSlots, 2, 5),
        interests: randomElements(domains, 2, 4),
        github: `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`,
        linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${i}`,
        createdAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - randomInt(1, 365) * 24 * 60 * 60 * 1000)
        ),
        isDemo: false
      };
      
      users.push({ uid, ...userData });
      
      const userRef = db.collection('users').doc(uid);
      batch.set(userRef, userData);
      batchCount++;
      
      // Commit batch if limit reached
      if (batchCount >= MAX_BATCH) {
        await batch.commit();
        console.log(`  ✓ Committed batch of ${batchCount} operations`);
        batch = db.batch(); // Create new batch
        batchCount = 0;
      }
      
      if (i % 20 === 0) {
        console.log(`  Created ${i}/200 users...`);
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✓ Committed final batch of ${batchCount} operations`);
      batch = db.batch(); // Reset batch
      batchCount = 0;
    }
    
    console.log(`✅ Created ${users.length} users\n`);
    
    // ============================================
    // 2. Generate 150 Projects
    // ============================================
    console.log('📊 Step 2/5: Generating 150 projects...');
    
    for (let i = 1; i <= 150; i++) {
      const owner = randomElement(users);
      const projectId = db.collection('projects').doc().id;
      
      const requiredSkills = randomElements(skills, 4, 8).map((skill, idx) => ({
        skillId: `skill_${skill.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        skillName: skill,
        minProficiency: randomInt(2, 4),
        priority: randomElement(['Must-have', 'Must-have', 'Nice-to-have'])
      }));
      const requiredRoles = randomElements(roles, 2, 4).map((role, idx) => ({
        roleId: `role_${role.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        roleName: role,
        slots: randomInt(1, 3)
      }));
      
      const totalRequired = requiredRoles.reduce((sum, r) => sum + r.slots, 0);
      
      const status = randomElement(['Open', 'Open', 'Open', 'In Progress', 'Completed']);
      
      const projectData = {
        id: projectId,
        title: `${randomElement(projectTitles)} ${i}`,
        description: randomElement(projectDescriptions),
        domainArea: randomElement(domains),
        requiredSkills: requiredSkills,
        requiredRoles: requiredRoles,
        requiredSkillIds: requiredSkills.map(s => s.skillId),
        requiredRoleIds: requiredRoles.map(r => r.roleId),
        teamSizeRequired: totalRequired + 1, // +1 for owner
        ownerUserId: owner.uid,
        ownerName: owner.fullName,
        status: status,
        createdAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000)
        ),
        deadline: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + randomInt(30, 180) * 24 * 60 * 60 * 1000)
        ),
        tags: randomElements(skills, 3, 6)
      };
      
      // Add team data if not Open
      if (status !== 'Open') {
        const teamSize = randomInt(1, totalRequired);
        projectData.team = {
          teamSize: teamSize,
          teamBalanceIndex: randomInt(60, 95)
        };
      }
      
      projects.push({ ...projectData, owner });
      
      const projectRef = db.collection('projects').doc(projectId);
      batch.set(projectRef, projectData);
      batchCount++;
      
      if (batchCount >= MAX_BATCH) {
        await batch.commit();
        console.log(`  ✓ Committed batch of ${batchCount} operations`);
        batch = db.batch();
        batchCount = 0;
      }
      
      if (i % 20 === 0) {
        console.log(`  Created ${i}/150 projects...`);
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✓ Committed final batch of ${batchCount} operations`);
      batch = db.batch();
      batchCount = 0;
    }
    
    console.log(`✅ Created ${projects.length} projects\n`);
    
    // ============================================
    // 3. Generate 300+ Applications
    // ============================================
    console.log('📊 Step 3/5: Generating 300+ applications...');
    
    batchCount = 0;
    let applicationCount = 0;
    const statuses = ['Pending', 'Accepted', 'Rejected'];
    
    // Each user applies to 2-3 random projects
    for (const user of users.slice(0, 150)) { // 150 users × 2-3 = ~300-450 applications
      const numApplications = randomInt(2, 3);
      const applicableProjects = projects.filter(p => p.ownerUserId !== user.uid);
      const selectedProjects = randomElements(applicableProjects, numApplications, numApplications);
      
      for (const project of selectedProjects) {
        const applicationId = db.collection('projects').doc(project.id)
          .collection('applications').doc().id;
        
        const applicationData = {
          id: applicationId,
          projectId: project.id,
          profileId: user.uid,
          applicantName: user.fullName,
          applicantEmail: user.email,
          status: randomElement(statuses),
          matchScore: randomInt(60, 98),
          skills: user.skills.slice(0, 5),
          roles: user.roles.slice(0, 2),
          appliedAt: admin.firestore.Timestamp.fromDate(
            new Date(project.createdAt.toMillis() + randomInt(1, 60) * 24 * 60 * 60 * 1000)
          ),
          coverLetter: `I am very interested in joining this ${project.domain} project. I have experience with ${user.skills[0].name} and ${user.skills[1].name}.`
        };
        
        const appRef = db.collection('projects').doc(project.id)
          .collection('applications').doc(applicationId);
        batch.set(appRef, applicationData);
        batchCount++;
        applicationCount++;
        
        if (batchCount >= MAX_BATCH) {
          await batch.commit();
          console.log(`  ✓ Committed batch of ${batchCount} operations`);
          batchCount = 0;
        }
      }
      
      if (applicationCount % 50 === 0) {
        console.log(`  Created ${applicationCount} applications...`);
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✓ Committed final batch of ${batchCount} operations`);
      batch = db.batch();
      batchCount = 0;
    }
    
    console.log(`✅ Created ${applicationCount} applications\n`);
    
    // ============================================
    // 4. Generate 100+ Team Members
    // ============================================
    console.log('📊 Step 4/5: Generating 100+ team members...');
    
    batchCount = 0;
    let teamMemberCount = 0;
    
    // Add team members to non-Open projects
    const activeProjects = projects.filter(p => p.status !== 'Open');
    
    for (const project of activeProjects) {
      const numMembers = randomInt(1, Math.min(3, project.teamSizeRequired - 1));
      const potentialMembers = users.filter(u => u.uid !== project.ownerUserId);
      const selectedMembers = randomElements(potentialMembers, numMembers, numMembers);
      
      for (let i = 0; i < selectedMembers.length; i++) {
        const member = selectedMembers[i];
        const memberId = db.collection('projects').doc(project.id)
          .collection('teamMembers').doc().id;
        
        const memberData = {
          id: memberId,
          projectId: project.id,
          profileId: member.uid,
          memberName: member.fullName,
          memberEmail: member.email,
          assignedRoleName: randomElement(project.requiredRoles).name,
          isTeamLead: i === 0, // First member is team lead
          joinedAt: admin.firestore.Timestamp.fromDate(
            new Date(project.createdAt.toMillis() + randomInt(5, 30) * 24 * 60 * 60 * 1000)
          ),
          skills: member.skills.slice(0, 5)
        };
        
        const memberRef = db.collection('projects').doc(project.id)
          .collection('teamMembers').doc(memberId);
        batch.set(memberRef, memberData);
        batchCount++;
        teamMemberCount++;
        
        if (batchCount >= MAX_BATCH) {
          await batch.commit();
          console.log(`  ✓ Committed batch of ${batchCount} operations`);
          batchCount = 0;
        }
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✓ Committed final batch of ${batchCount} operations`);
      batch = db.batch();
      batchCount = 0;
    }
    
    console.log(`✅ Created ${teamMemberCount} team members\n`);
    
    // ============================================
    // 5. Generate Notifications
    // ============================================
    console.log('📊 Step 5/5: Generating notifications...');
    
    batchCount = 0;
    let notificationCount = 0;
    
    const notificationTemplates = [
      'Your application to "{project}" has been reviewed.',
      'You have been accepted to join "{project}"!',
      'New applicant for your project "{project}".',
      'Team member joined your project "{project}".',
      'Your project "{project}" deadline is approaching.'
    ];
    
    // Generate 2-3 notifications for first 100 users
    for (const user of users.slice(0, 100)) {
      const numNotifications = randomInt(2, 3);
      
      for (let i = 0; i < numNotifications; i++) {
        const notificationId = db.collection('users').doc(user.uid)
          .collection('notifications').doc().id;
        
        const randomProject = randomElement(projects);
        const message = randomElement(notificationTemplates)
          .replace('{project}', randomProject.title);
        
        const notificationData = {
          id: notificationId,
          message: message,
          read: Math.random() > 0.5,
          createdAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000)
          )
        };
        
        const notifRef = db.collection('users').doc(user.uid)
          .collection('notifications').doc(notificationId);
        batch.set(notifRef, notificationData);
        batchCount++;
        notificationCount++;
        
        if (batchCount >= MAX_BATCH) {
          await batch.commit();
          console.log(`  ✓ Committed batch of ${batchCount} operations`);
          batchCount = 0;
        }
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✓ Committed final batch of ${batchCount} operations`);
      batch = db.batch();
      batchCount = 0;
    }
    
    console.log(`✅ Created ${notificationCount} notifications\n`);
    
    // ============================================
    // Summary
    // ============================================
    console.log('═══════════════════════════════════════');
    console.log('✅ GENERATION COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Total Records Created:`);
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Projects: ${projects.length}`);
    console.log(`   • Applications: ${applicationCount}`);
    console.log(`   • Team Members: ${teamMemberCount}`);
    console.log(`   • Notifications: ${notificationCount}`);
    console.log(`   ────────────────────────────────────`);
    console.log(`   📈 GRAND TOTAL: ${users.length + projects.length + applicationCount + teamMemberCount + notificationCount} records`);
    console.log('═══════════════════════════════════════\n');
    
    // Save credentials to file
    const credentials = users.slice(0, 20).map(u => ({
      email: u.email,
      password: 'Student@123',
      name: u.fullName
    }));
    
    console.log('📝 Sample Login Credentials (first 20 users):');
    console.log('   Email: [firstname].[lastname][number]@students.edu');
    console.log('   Password: Student@123\n');
    
    credentials.forEach((c, i) => {
      if (i < 5) {
        console.log(`   ${i + 1}. ${c.email} | ${c.name}`);
      }
    });
    console.log('   ... (195 more users)\n');
    
  } catch (error) {
    console.error('❌ Error generating data:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the generator
generate500Records();
