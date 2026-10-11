"use strict";
/**
 * Bulk-load the synthetic dataset ("DML - Insert").
 *
 *   Emulator : FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed
 *   Real     : GOOGLE_APPLICATION_CREDENTIALS=key.json GCLOUD_PROJECT=<id> npm run seed
 *
 * Seeded users are Firestore documents only (no Auth accounts) - sign up in the UI to log in.
 */
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "peer-team-matcher";

const { db, Timestamp, FieldValue } = require("../src/firebase");
const engine = require("../src/matching/engine");
const svc = require("../src/services/teamService");
const { generateDataset, toCandidate } = require("./generateData");

async function main() {
  const data = generateDataset();
  const candidates = Object.fromEntries(data.users.map((u) => [u.uid, toCandidate(u)]));
  const writer = db.bulkWriter(); // batches and retries internally (well under the 500-op limit per commit)
  let count = 0;
  const put = (ref, doc) => { writer.set(ref, doc); count++; };

  data.roles.forEach((r) => put(db.collection("roles").doc(r.id), { roleName: r.roleName }));
  data.skills.forEach((s) => put(db.collection("skills").doc(s.id), { skillName: s.skillName, skillCategory: s.skillCategory }));

  for (const u of data.users) {
    const ref = db.collection("users").doc(u.uid);
    put(ref, {
      fullName: u.fullName, email: u.email, userRole: u.userRole,
      createdAt: Timestamp.fromDate(u.createdAt),
      profile: { ...u.profile, updatedAt: FieldValue.serverTimestamp() },
    });
    u.skills.forEach((s) => put(ref.collection("skills").doc(s.skillId), s));
    u.preferredRoles.forEach((r) => put(ref.collection("preferredRoles").doc(r.roleId), r));
    u.availability.forEach((slot, i) => put(ref.collection("availability").doc(`slot${i + 1}`), slot));
  }

  for (const p of data.projects) {
    const { applications, teamMembers, deadline, createdAt, ...fields } = p;
    const ref = db.collection("projects").doc(p.id);
    put(ref, { ...fields, deadline: Timestamp.fromDate(deadline), createdAt: Timestamp.fromDate(createdAt) });

    const team = teamMembers.map((m) => ({ ...candidates[m.profileId], assignedRoleId: m.assignedRoleId }));
    teamMembers.forEach((m) =>
      put(ref.collection("teamMembers").doc(m.profileId), { ...m, projectId: p.id, joinedAt: FieldValue.serverTimestamp() }));
    applications.forEach((a, i) => {
      const matchScore = engine.scoreCandidate(p, team, candidates[a.profileId], { appliedRoleId: a.appliedRoleId }).score;
      put(ref.collection("applications").doc(a.profileId), {
        ...a, projectId: p.id, matchScore, appliedAt: Timestamp.fromMillis(createdAt.getTime() + (i + 1) * 3600e3),
        decidedAt: a.status === "Pending" ? null : FieldValue.serverTimestamp(),
      });
    });
  }
  await writer.close();
  console.log(`Loaded ${count} base documents. Computing derived views...`);

  // Derived data (skill gap, TBI, recommendations, analytics) - same code the triggers run.
  for (const p of data.projects) {
    await svc.recomputeTeam(db, p.id);
    await svc.generateRecommendations(db, p.id);
  }
  await svc.refreshSkillDemand(db);
  console.log(`Done: ${data.users.length} users, ${data.projects.length} projects.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
