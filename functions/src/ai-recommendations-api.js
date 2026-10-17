"use strict";
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();
const aiRec = require("./matching/ai-recommendations");

/**
 * Get AI-powered personalized project recommendations for a user
 */
exports.getAIProjectRecommendations = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { limit = 10 } = data;

  try {
    const recommendations = await aiRec.getPersonalizedRecommendations(
      auth.uid,
      limit
    );

    return {
      success: true,
      recommendations: recommendations,
      count: recommendations.length,
    };
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    throw new HttpsError("internal", "Failed to generate recommendations");
  }
});

/**
 * Get enhanced match score with AI analysis
 */
exports.getAIEnhancedScore = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { projectId, candidateId, baseScore } = data;

  if (!projectId || !candidateId || baseScore === undefined) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }

  try {
    // Get project and candidate data
    const projectDoc = await db.collection("projects").doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError("not-found", "Project not found");
    }

    const candidateDoc = await db.collection("users").doc(candidateId).get();
    if (!candidateDoc.exists) {
      throw new HttpsError("not-found", "Candidate not found");
    }

    const project = projectDoc.data();
    const candidate = candidateDoc.data();

    // Get candidate skills
    const skillsSnap = await db
      .collection(`users/${candidateId}/skills`)
      .get();
    const skills = {};
    skillsSnap.docs.forEach((doc) => {
      skills[doc.id] = doc.data().proficiencyLevel;
    });
    candidate.skills = skills;
    candidate.uid = candidateId;

    // Compute AI-enhanced score
    const aiScore = await aiRec.computeAIScore(
      project,
      candidate,
      baseScore,
      projectId
    );

    return {
      success: true,
      ...aiScore,
    };
  } catch (error) {
    console.error("Error computing AI score:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to compute AI score");
  }
});

/**
 * Find similar projects based on user's skills and interests
 */
exports.findSimilarProjects = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { limit = 10 } = data;

  try {
    const similarProjects = await aiRec.findSimilarProjects(auth.uid, limit);

    return {
      success: true,
      projects: similarProjects,
      count: similarProjects.length,
    };
  } catch (error) {
    console.error("Error finding similar projects:", error);
    throw new HttpsError("internal", "Failed to find similar projects");
  }
});

/**
 * Batch update recommendations with AI scores for a project
 */
exports.updateRecommendationsWithAI = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { projectId } = data;

  if (!projectId) {
    throw new HttpsError("invalid-argument", "Project ID is required");
  }

  try {
    // Verify user is project owner
    const projectDoc = await db.collection("projects").doc(projectId).get();
    if (!projectDoc.exists) {
      throw new HttpsError("not-found", "Project not found");
    }

    const projectData = projectDoc.data();
    if (projectData.ownerUserId !== auth.uid) {
      throw new HttpsError(
        "permission-denied",
        "Only project owner can update recommendations"
      );
    }

    // Get all recommendations
    const recsSnap = await db
      .collection(`projects/${projectId}/recommendations`)
      .get();

    const project = projectData;
    const batch = db.batch();
    let updated = 0;

    for (const recDoc of recsSnap.docs) {
      const recData = recDoc.data();
      const candidateId = recDoc.id;
      const baseScore = recData.recommendationScore || 0;

      // Get candidate data
      const candidateDoc = await db.collection("users").doc(candidateId).get();
      if (!candidateDoc.exists) continue;

      const candidate = candidateDoc.data();
      const skillsSnap = await db
        .collection(`users/${candidateId}/skills`)
        .get();
      const skills = {};
      skillsSnap.docs.forEach((doc) => {
        skills[doc.id] = doc.data().proficiencyLevel;
      });
      candidate.skills = skills;
      candidate.uid = candidateId;

      // Compute AI score
      const aiScore = await aiRec.computeAIScore(
        project,
        candidate,
        baseScore,
        projectId
      );

      // Update recommendation with AI scores
      batch.update(recDoc.ref, {
        aiEnhancedScore: aiScore.aiScore,
        aiBreakdown: aiScore.breakdown,
        contentSimilarity: aiScore.breakdown.contentSimilarity,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      updated++;
    }

    await batch.commit();

    return {
      success: true,
      updated: updated,
      message: `Updated ${updated} recommendations with AI scores`,
    };
  } catch (error) {
    console.error("Error updating recommendations:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to update recommendations");
  }
});
