"use strict";
/** Firestore triggers and the schedule - the "database automation" layer (FR-11, FR-18). */
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { db, FieldValue } = require("./firebase");
const svc = require("./services/teamService");

const sameJson = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Team roster changed -> recompute coverage, TBI, recommendations. */
exports.onTeamMemberChange = onDocumentWritten("projects/{projectId}/teamMembers/{profileId}", async (event) => {
  const { projectId } = event.params;
  await svc.recomputeTeam(db, projectId);
  await svc.generateRecommendations(db, projectId);
});

/**
 * Project created, or its requirements edited -> recompute.
 * Guarded so that our own writes to `team` do not retrigger this function.
 */
exports.onProjectWrite = onDocumentWritten("projects/{projectId}", async (event) => {
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after = event.data.after.exists ? event.data.after.data() : null;
  if (!after) return;
  const changed =
    !before ||
    !sameJson(before.requiredSkills, after.requiredSkills) ||
    !sameJson(before.requiredRoles, after.requiredRoles) ||
    before.teamSizeRequired !== after.teamSizeRequired;
  if (!changed) return;
  await svc.recomputeTeam(db, event.params.projectId);
  await svc.generateRecommendations(db, event.params.projectId);
});

/**
 * Application created / decided / withdrawn.
 *  - Accepted  -> add to teamMembers (cascades into onTeamMemberChange), idempotently.
 *  - Accepted/Rejected -> in-app notification (FR-11).
 *  - otherwise -> refresh recommendations so the review queue is current.
 */
exports.onApplicationDecided = onDocumentWritten("projects/{projectId}/applications/{applicationId}", async (event) => {
  const { projectId } = event.params;
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after = event.data.after.exists ? event.data.after.data() : null;
  if (after && before && before.status === after.status) return; // e.g. our own matchScore refresh

  if (!after) {
    await svc.generateRecommendations(db, projectId); // withdrawn / deleted
    return;
  }

  if (after.status === "Accepted") {
    const memberRef = db.collection("projects").doc(projectId).collection("teamMembers").doc(after.profileId);
    if (!(await memberRef.get()).exists) {
      await memberRef.set({
        projectId,
        profileId: after.profileId,
        memberName: after.applicantName,
        assignedRoleId: after.appliedRoleId,
        isTeamLead: false,
        joinedAt: FieldValue.serverTimestamp(),
      });
    }
  } else {
    await svc.generateRecommendations(db, projectId);
  }

  if (after.status === "Accepted" || after.status === "Rejected") {
    const project = await db.collection("projects").doc(projectId).get();
    const title = project.get("title") || "a project";
    await db.collection("users").doc(after.profileId).collection("notifications").add({
      type: "application",
      projectId,
      projectTitle: title,
      status: after.status,
      message: `Your application to "${title}" was ${after.status.toLowerCase()}.`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
});

/**
 * A student edits skills -> teams they belong to are recomputed and the review queues of
 * projects they applied to are re-ranked. Queries match the collection-group indexes in
 * firestore.indexes.json.
 */
exports.onStudentSkillChange = onDocumentWritten("users/{uid}/skills/{skillId}", async (event) => {
  const { uid } = event.params;
  const [members, apps] = await Promise.all([
    db.collectionGroup("teamMembers").where("profileId", "==", uid).orderBy("joinedAt", "desc").get(),
    db.collectionGroup("applications").where("profileId", "==", uid).orderBy("appliedAt", "desc").get(),
  ]);
  const memberProjects = new Set(members.docs.map((d) => d.ref.parent.parent.id));
  const appliedProjects = new Set(apps.docs.filter((d) => d.get("status") === "Pending").map((d) => d.ref.parent.parent.id));

  for (const id of memberProjects) {
    await svc.recomputeTeam(db, id);
    await svc.generateRecommendations(db, id);
  }
  for (const id of appliedProjects) if (!memberProjects.has(id)) await svc.generateRecommendations(db, id);
});

/** Daily refresh of the skill-demand view. */
exports.refreshSkillDemand = onSchedule("every 24 hours", async () => {
  await svc.refreshSkillDemand(db);
});
