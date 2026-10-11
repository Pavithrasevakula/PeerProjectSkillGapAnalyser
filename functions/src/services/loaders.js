"use strict";
/** Firestore -> engine-shape loaders (the only place that knows the document layout). */

async function loadCandidate(db, uid) {
  const userRef = db.collection("users").doc(uid);
  const [userSnap, skillsSnap, rolesSnap, slotsSnap] = await Promise.all([
    userRef.get(),
    userRef.collection("skills").get(),
    userRef.collection("preferredRoles").get(),
    userRef.collection("availability").get(),
  ]);
  if (!userSnap.exists) return null;
  const u = userSnap.data();
  return {
    uid,
    name: u.fullName || "Unknown",
    experienceLevel: (u.profile && u.profile.experienceLevel) || "Beginner",
    skills: Object.fromEntries(skillsSnap.docs.map((d) => [d.id, d.data().proficiencyLevel])),
    preferredRoles: Object.fromEntries(rolesSnap.docs.map((d) => [d.id, d.data().preferenceRank])),
    availability: slotsSnap.docs.map((d) => d.data()),
  };
}

/** Load many candidates with bounded concurrency (keeps us inside Firestore quotas). */
async function loadCandidates(db, uids, concurrency = 20) {
  const out = [];
  for (let i = 0; i < uids.length; i += concurrency) {
    const chunk = await Promise.all(uids.slice(i, i + concurrency).map((uid) => loadCandidate(db, uid)));
    out.push(...chunk.filter(Boolean));
  }
  return out;
}

async function loadProject(db, projectId) {
  const snap = await db.collection("projects").doc(projectId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

/** Current team as engine candidates, each carrying assignedRoleId. */
async function loadTeam(db, projectId) {
  const snap = await db.collection("projects").doc(projectId).collection("teamMembers").get();
  const roleByUid = Object.fromEntries(snap.docs.map((d) => [d.id, d.data().assignedRoleId || null]));
  const members = await loadCandidates(db, snap.docs.map((d) => d.id));
  return members.map((m) => ({ ...m, assignedRoleId: roleByUid[m.uid] }));
}

module.exports = { loadCandidate, loadCandidates, loadProject, loadTeam };
