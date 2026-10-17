"use strict";
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const db = admin.firestore();

// Achievement definitions
const ACHIEVEMENTS = {
  FIRST_PROJECT: {
    id: 'first_project',
    name: 'Project Pioneer',
    description: 'Created your first project',
    icon: '🚀',
    points: 50,
    category: 'projects',
  },
  TEAM_BUILDER: {
    id: 'team_builder',
    name: 'Team Builder',
    description: 'Formed a complete team',
    icon: '👥',
    points: 100,
    category: 'teams',
  },
  SKILL_MASTER: {
    id: 'skill_master',
    name: 'Skill Master',
    description: 'Added 10+ skills to your profile',
    icon: '🎓',
    points: 75,
    category: 'skills',
  },
  PERFECT_MATCH: {
    id: 'perfect_match',
    name: 'Perfect Match',
    description: 'Achieved 90%+ match score',
    icon: '⚡',
    points: 150,
    category: 'matching',
  },
  COLLABORATION_STAR: {
    id: 'collaboration_star',
    name: 'Collaboration Star',
    description: 'Joined 5 different teams',
    icon: '⭐',
    points: 200,
    category: 'collaboration',
  },
  CHAT_ENTHUSIAST: {
    id: 'chat_enthusiast',
    name: 'Chat Enthusiast',
    description: 'Sent 100 chat messages',
    icon: '💬',
    points: 50,
    category: 'engagement',
  },
  PROFILE_COMPLETIONIST: {
    id: 'profile_completionist',
    name: 'Profile Completionist',
    description: 'Completed all profile sections including video intro',
    icon: '✅',
    points: 100,
    category: 'profile',
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Applied to a project within 24 hours of posting',
    icon: '🐦',
    points: 50,
    category: 'activity',
  },
  ACCEPTANCE_MASTER: {
    id: 'acceptance_master',
    name: 'Acceptance Master',
    description: 'Achieved 80%+ application acceptance rate',
    icon: '🏆',
    points: 250,
    category: 'success',
  },
  PROJECT_MARATHON: {
    id: 'project_marathon',
    name: 'Project Marathon',
    description: 'Created 10 projects',
    icon: '🔥',
    points: 300,
    category: 'projects',
  },
};

/**
 * Award achievement to user
 */
async function awardAchievement(userId, achievementKey) {
  const achievement = ACHIEVEMENTS[achievementKey];
  if (!achievement) return;

  const achievementRef = db.collection(`users/${userId}/achievements`).doc(achievement.id);
  const existingAchievement = await achievementRef.get();

  if (!existingAchievement.exists) {
    await achievementRef.set({
      ...achievement,
      earnedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId,
    });

    // Update user's total points
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      totalPoints: admin.firestore.FieldValue.increment(achievement.points),
      achievementCount: admin.firestore.FieldValue.increment(1),
    });

    // Update leaderboard
    await updateLeaderboard(userId);

    console.log(`Achievement ${achievement.name} awarded to ${userId}`);
  }
}

/**
 * Update leaderboard entry for user
 */
async function updateLeaderboard(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return;

  const userData = userDoc.data();
  const achievementsSnap = await db.collection(`users/${userId}/achievements`).get();

  const leaderboardRef = db.collection('leaderboard').doc(userId);
  await leaderboardRef.set({
    userId: userId,
    userName: userData.fullName || userData.email,
    totalPoints: userData.totalPoints || 0,
    achievementCount: achievementsSnap.size,
    experienceLevel: userData.profile?.experienceLevel || 'Beginner',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

/**
 * Check and award achievements when a project is created
 */
exports.onProjectCreated = onDocumentCreated("projects/{projectId}", async (event) => {
  const projectData = event.data.data();
  const ownerId = projectData.ownerUserId;

  // Count user's projects
  const projectsSnap = await db.collection('projects')
    .where('ownerUserId', '==', ownerId)
    .get();

  const projectCount = projectsSnap.size;

  // Award achievements
  if (projectCount === 1) {
    await awardAchievement(ownerId, 'FIRST_PROJECT');
  }
  if (projectCount === 10) {
    await awardAchievement(ownerId, 'PROJECT_MARATHON');
  }
});

/**
 * Check and award achievements when team is updated
 */
exports.onTeamMemberAdded = onDocumentCreated(
  "projects/{projectId}/teamMembers/{memberId}",
  async (event) => {
    const projectId = event.params.projectId;
    const memberData = event.data.data();
    const memberId = memberData.profileId;

    // Check if team is complete
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (projectDoc.exists) {
      const projectData = projectDoc.data();
      const currentSize = projectData.team?.teamSize || 0;
      const requiredSize = projectData.teamSizeRequired;

      // Award Team Builder to project owner
      if (currentSize >= requiredSize) {
        await awardAchievement(projectData.ownerUserId, 'TEAM_BUILDER');
      }
    }

    // Count member's teams
    const allProjectsSnap = await db.collection('projects').get();
    let teamCount = 0;

    for (const projectDoc of allProjectsSnap.docs) {
      const teamMemberDoc = await db
        .collection(`projects/${projectDoc.id}/teamMembers`)
        .doc(memberId)
        .get();
      if (teamMemberDoc.exists) teamCount++;
    }

    // Award Collaboration Star
    if (teamCount >= 5) {
      await awardAchievement(memberId, 'COLLABORATION_STAR');
    }
  }
);

/**
 * Check and award achievements when application is accepted
 */
exports.onApplicationAccepted = onDocumentUpdated(
  "projects/{projectId}/applications/{applicationId}",
  async (event) => {
    const oldData = event.data.before.data();
    const newData = event.data.after.data();

    // Check if just got accepted
    if (oldData.status !== 'Accepted' && newData.status === 'Accepted') {
      const applicantId = newData.profileId;
      const matchScore = newData.matchScore;

      // Award Perfect Match if score >= 90
      if (matchScore >= 90) {
        await awardAchievement(applicantId, 'PERFECT_MATCH');
      }

      // Check acceptance rate
      const allProjectsSnap = await db.collection('projects').get();
      let totalApps = 0;
      let acceptedApps = 0;

      for (const projectDoc of allProjectsSnap.docs) {
        const appsSnap = await db
          .collection(`projects/${projectDoc.id}/applications`)
          .where('profileId', '==', applicantId)
          .get();

        appsSnap.docs.forEach((appDoc) => {
          totalApps++;
          if (appDoc.data().status === 'Accepted') acceptedApps++;
        });
      }

      const acceptanceRate = totalApps > 0 ? (acceptedApps / totalApps) * 100 : 0;

      // Award Acceptance Master if rate >= 80%
      if (acceptanceRate >= 80 && totalApps >= 5) {
        await awardAchievement(applicantId, 'ACCEPTANCE_MASTER');
      }
    }
  }
);

/**
 * Check and award achievements when skills are updated
 */
exports.onSkillAdded = onDocumentCreated(
  "users/{userId}/skills/{skillId}",
  async (event) => {
    const userId = event.params.userId;

    // Count user's skills
    const skillsSnap = await db.collection(`users/${userId}/skills`).get();

    if (skillsSnap.size >= 10) {
      await awardAchievement(userId, 'SKILL_MASTER');
    }

    // Check profile completion
    await checkProfileCompletion(userId);
  }
);

/**
 * Check profile completion for Profile Completionist achievement
 */
async function checkProfileCompletion(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return;

  const userData = userDoc.data();
  const skillsSnap = await db.collection(`users/${userId}/skills`).get();
  const rolesSnap = await db.collection(`users/${userId}/preferredRoles`).get();
  const availabilitySnap = await db.collection(`users/${userId}/availability`).get();

  const hasProfile = userData.profile?.department && userData.profile?.experienceLevel;
  const hasSkills = skillsSnap.size >= 3;
  const hasRoles = rolesSnap.size >= 1;
  const hasAvailability = availabilitySnap.size >= 1;
  const hasVideo = !!userData.videoIntroUrl;
  const hasBio = userData.profile?.bio && userData.profile.bio.length > 20;

  if (hasProfile && hasSkills && hasRoles && hasAvailability && hasVideo && hasBio) {
    await awardAchievement(userId, 'PROFILE_COMPLETIONIST');
  }
}

/**
 * Get user's achievements and progress
 */
exports.getUserAchievements = onCall(async (request) => {
  const { auth } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const achievementsSnap = await db
      .collection(`users/${auth.uid}/achievements`)
      .orderBy('earnedAt', 'desc')
      .get();

    const earned = achievementsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      earnedAt: doc.data().earnedAt?.toDate().toISOString(),
    }));

    // Get all available achievements
    const available = Object.values(ACHIEVEMENTS).filter(
      (ach) => !earned.some((e) => e.id === ach.id)
    );

    const userDoc = await db.collection('users').doc(auth.uid).get();
    const userData = userDoc.data() || {};

    return {
      earned,
      available,
      totalPoints: userData.totalPoints || 0,
      achievementCount: earned.length,
    };
  } catch (error) {
    console.error('Error getting achievements:', error);
    throw new HttpsError("internal", "Failed to get achievements");
  }
});

/**
 * Get leaderboard
 */
exports.getLeaderboard = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { limit = 50 } = data || {};

  try {
    const leaderboardSnap = await db
      .collection('leaderboard')
      .orderBy('totalPoints', 'desc')
      .limit(limit)
      .get();

    const leaderboard = leaderboardSnap.docs.map((doc, index) => ({
      rank: index + 1,
      ...doc.data(),
    }));

    // Find current user's rank
    const userEntry = leaderboard.find((entry) => entry.userId === auth.uid);
    let userRank = null;

    if (!userEntry) {
      // User not in top, find their actual rank
      const allLeaderboard = await db
        .collection('leaderboard')
        .orderBy('totalPoints', 'desc')
        .get();

      const userIndex = allLeaderboard.docs.findIndex((doc) => doc.id === auth.uid);
      if (userIndex !== -1) {
        userRank = {
          rank: userIndex + 1,
          ...allLeaderboard.docs[userIndex].data(),
        };
      }
    } else {
      userRank = userEntry;
    }

    return {
      leaderboard,
      userRank,
    };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw new HttpsError("internal", "Failed to get leaderboard");
  }
});
