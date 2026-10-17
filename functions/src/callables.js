"use strict";
/** Callable "stored procedures" (Table 24). Every one authenticates and validates its input. */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, FieldValue } = require("./firebase");
const engine = require("./matching/engine");
const svc = require("./services/teamService");
const { loadCandidate, loadProject, loadTeam } = require("./services/loaders");

const requireAuth = (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Please sign in.");
  return request.auth.uid;
};
const requireString = (value, name) => {
  if (typeof value !== "string" || !value.trim() || value.length > 128) {
    throw new HttpsError("invalid-argument", `${name} is required.`);
  }
  return value;
};

async function requireOwnedProject(projectId, uid) {
  const project = await loadProject(db, projectId);
  if (!project) throw new HttpsError("not-found", "Project not found.");
  if (project.ownerUserId !== uid) throw new HttpsError("permission-denied", "Only the project owner can do this.");
  return project;
}

/** Validated INSERT with a computed column: initial marginal-gain match score. */
exports.applyToProject = onCall(async (request) => {
  const uid = requireAuth(request);
  const projectId = requireString(request.data?.projectId, "projectId");
  const roleId = requireString(request.data?.roleId, "roleId");

  const project = await loadProject(db, projectId);
  if (!project) throw new HttpsError("not-found", "Project not found.");
  if (project.status !== "Open") throw new HttpsError("failed-precondition", "This project is not open for applications.");
  
  // Load candidate to get their name
  const candidate = await loadCandidate(db, uid);
  if (!candidate || !Object.keys(candidate.skills).length) {
    throw new HttpsError("failed-precondition", "Add at least one skill to your profile before applying.");
  }
  
  if (project.ownerUserId === uid) {
    throw new HttpsError("invalid-argument", "You cannot apply to your own project.");
  }
  
  if (!(project.requiredRoles || []).some((r) => r.roleId === roleId)) {
    throw new HttpsError("invalid-argument", "That role is not offered by this project.");
  }

  const appRef = db.collection("projects").doc(projectId).collection("applications").doc(uid); // one application per student
  const [existing, team] = await Promise.all([appRef.get(), loadTeam(db, projectId)]);
  if (team.some((m) => m.uid === uid)) throw new HttpsError("already-exists", "You are already on this team.");
  if (existing.exists && existing.get("status") !== "Withdrawn") {
    throw new HttpsError("already-exists", "You have already applied to this project.");
  }

  const result = engine.scoreCandidate(project, team, candidate, { appliedRoleId: roleId });
  
  // Get applicant's video URL if available
  const userDoc = await db.collection("users").doc(uid).get();
  const videoIntroUrl = userDoc.exists ? userDoc.get("videoIntroUrl") : null;
  
  await appRef.set({
    projectId,
    profileId: uid,
    applicantName: candidate.name,
    appliedRoleId: roleId,
    matchScore: result.score,
    status: "Pending",
    appliedAt: FieldValue.serverTimestamp(),
    decidedAt: null,
    videoIntroUrl: videoIntroUrl || null,
  });
  return { matchScore: result.score, explanation: result.explanation };
});

/** Multiple statements in one transaction: verify ownership, capacity and role slot, then decide. */
async function decide(request, decision) {
  const uid = requireAuth(request);
  const projectId = requireString(request.data?.projectId, "projectId");
  const applicationId = requireString(request.data?.applicationId, "applicationId");
  const projectRef = db.collection("projects").doc(projectId);
  const appRef = projectRef.collection("applications").doc(applicationId);

  await db.runTransaction(async (tx) => {
    const [projectSnap, appSnap, membersSnap] = await Promise.all([
      tx.get(projectRef), tx.get(appRef), tx.get(projectRef.collection("teamMembers")),
    ]);
    if (!projectSnap.exists) throw new HttpsError("not-found", "Project not found.");
    if (projectSnap.get("ownerUserId") !== uid) {
      throw new HttpsError("permission-denied", "Only the owner can decide applications.");
    }
    if (!appSnap.exists) throw new HttpsError("not-found", "Application not found.");
    if (appSnap.get("status") !== "Pending") throw new HttpsError("failed-precondition", "Application is already decided.");

    if (decision === "Accepted") {
      if (membersSnap.size >= projectSnap.get("teamSizeRequired")) {
        throw new HttpsError("failed-precondition", "The team is already full.");
      }
      const roleId = appSnap.get("appliedRoleId");
      const slots = (projectSnap.get("requiredRoles") || []).find((r) => r.roleId === roleId)?.slots || 0;
      const filled = membersSnap.docs.filter((d) => d.get("assignedRoleId") === roleId).length;
      if (filled >= slots) throw new HttpsError("failed-precondition", "No open slot remains for that role.");
    }
    tx.update(appRef, { status: decision, decidedAt: FieldValue.serverTimestamp() });
  });
  return { status: decision };
}
exports.acceptApplication = onCall((request) => decide(request, "Accepted"));
exports.rejectApplication = onCall((request) => decide(request, "Rejected"));

/** Read-only stored procedure (FR-15). */
exports.previewCandidateImpact = onCall(async (request) => {
  const uid = requireAuth(request);
  const projectId = requireString(request.data?.projectId, "projectId");
  const candidateUserId = requireString(request.data?.candidateUserId, "candidateUserId");
  await requireOwnedProject(projectId, uid);
  const roleId = typeof request.data?.roleId === "string" ? request.data.roleId : undefined;
  const preview = await svc.previewCandidateImpact(db, projectId, candidateUserId, roleId);
  if (!preview) throw new HttpsError("not-found", "Candidate not found.");
  return preview;
});

/** Procedure that re-populates a derived collection. `includePool` also ranks non-applicants. */
exports.generateRecommendations = onCall({ timeoutSeconds: 120 }, async (request) => {
  const uid = requireAuth(request);
  const projectId = requireString(request.data?.projectId, "projectId");
  await requireOwnedProject(projectId, uid);
  const ranked = await svc.generateRecommendations(db, projectId, { includePool: Boolean(request.data?.includePool) });
  return { count: ranked.length };
});
