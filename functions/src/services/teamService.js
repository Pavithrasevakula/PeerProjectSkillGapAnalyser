"use strict";
/** Derived-data maintenance: skill gap, Team Balance Index, recommendations, analytics. */
const { FieldValue } = require("../firebase");
const engine = require("../matching/engine");
const { loadProject, loadTeam, loadCandidate, loadCandidates } = require("./loaders");

const TBI_FIELDS = ["skillCoverageScore", "roleDiversityScore", "experienceMixScore", "availabilityOverlapScore", "overallScore"];

/**
 * Recompute the team's skill-gap view and Team Balance Index (FR-16, FR-17, FR-18).
 * Idempotent: an unchanged TBI is not appended to tbiHistory again.
 */
async function recomputeTeam(db, projectId) {
  const project = await loadProject(db, projectId);
  if (!project) return null;
  const projectRef = db.collection("projects").doc(projectId);
  const members = await loadTeam(db, projectId);

  const gap = engine.computeSkillGap(project, members);
  const tbi = engine.teamBalance(project, members);

  await projectRef.collection("team").doc("skillGap").set({
    skills: Object.fromEntries(
      gap.map((g) => [g.skillId, { skillName: g.skillName, requiredLevel: g.requiredLevel, coveredLevel: g.coveredLevel, gapValue: g.gapValue }])
    ),
    computedAt: FieldValue.serverTimestamp(),
  });

  const last = await projectRef.collection("tbiHistory").orderBy("computedAt", "desc").limit(1).get();
  const unchanged = !last.empty && TBI_FIELDS.every((f) => last.docs[0].get(f) === tbi[f]);
  if (!unchanged) await projectRef.collection("tbiHistory").add({ ...tbi, computedAt: FieldValue.serverTimestamp() });

  await projectRef.update({
    team: {
      teamSize: members.length,
      teamBalanceIndex: tbi.overallScore,
      formationStatus: members.length >= project.teamSizeRequired ? "Complete" : "Forming",
      lastComputedAt: FieldValue.serverTimestamp(),
    },
  });

  await refreshTeamBalanceOverview(db);
  return { tbi, gap, teamSize: members.length };
}

/**
 * Rank candidates by marginal gain and (re)write projects/{id}/recommendations.
 * Pool = pending applicants, plus (optionally) other students. Also refreshes the
 * matchScore of pending applications so the owner's review queue stays current (FR-9).
 */
async function generateRecommendations(db, projectId, { includePool = false, poolLimit = 100 } = {}) {
  const project = await loadProject(db, projectId);
  if (!project) return [];
  const projectRef = db.collection("projects").doc(projectId);

  const [team, appsSnap, oldRecs] = await Promise.all([
    loadTeam(db, projectId),
    projectRef.collection("applications").where("status", "==", "Pending").get(),
    projectRef.collection("recommendations").get(),
  ]);

  const memberIds = new Set(team.map((m) => m.uid));
  const appliedRoles = {};
  const applicationRefs = {};
  for (const d of appsSnap.docs) {
    appliedRoles[d.data().profileId] = d.data().appliedRoleId;
    applicationRefs[d.data().profileId] = d.ref;
  }

  const ids = new Set(Object.keys(appliedRoles));
  if (includePool) {
    const pool = await db.collection("users").where("userRole", "in", ["Student", "Both"]).limit(poolLimit).get();
    pool.docs.forEach((d) => ids.add(d.id));
  }
  ids.delete(project.ownerUserId);
  memberIds.forEach((id) => ids.delete(id));

  const candidates = await loadCandidates(db, [...ids]);
  const ranked = engine.rankCandidates(project, team, candidates, appliedRoles).slice(0, 50);

  const writer = db.bulkWriter();
  const keep = new Set(ranked.map((r) => r.candidateId));
  oldRecs.docs.filter((d) => !keep.has(d.id)).forEach((d) => writer.delete(d.ref));
  for (const r of ranked) {
    writer.set(projectRef.collection("recommendations").doc(r.candidateId), {
      profileId: r.candidateId,
      candidateName: r.candidate.name,
      isApplicant: Boolean(applicationRefs[r.candidateId]),
      marginalGainScore: r.marginalGainScore,
      recommendationScore: r.score,
      components: r.components,
      explanationText: r.explanation,
      generatedAt: FieldValue.serverTimestamp(),
    });
    if (applicationRefs[r.candidateId]) writer.update(applicationRefs[r.candidateId], { matchScore: r.score });
  }
  await writer.close();
  return ranked.map(({ candidate, ...rest }) => rest);
}

/** FR-15: read-only what-if for adding one candidate. */
async function previewCandidateImpact(db, projectId, candidateUid, roleId) {
  const [project, team, candidate] = await Promise.all([
    loadProject(db, projectId), loadTeam(db, projectId), loadCandidate(db, candidateUid),
  ]);
  if (!project || !candidate) return null;
  return engine.previewImpact(project, team, candidate, roleId);
}

/** analytics/teamBalanceOverview - average TBI across teams that have members. */
async function refreshTeamBalanceOverview(db) {
  const snap = await db.collection("projects").select("team").get();
  const values = snap.docs.map((d) => d.get("team")).filter((t) => t && t.teamSize > 0).map((t) => t.teamBalanceIndex);
  const averageTBI = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : 0;
  await db.collection("analytics").doc("teamBalanceOverview").set({
    averageTBI, teamsCounted: values.length, updatedAt: FieldValue.serverTimestamp(),
  });
}

/** analytics/skillDemand - how often each skill is required across open projects. */
async function refreshSkillDemand(db) {
  const snap = await db.collection("projects").where("status", "==", "Open").get();
  const demand = {};
  for (const d of snap.docs) for (const rs of d.get("requiredSkills") || []) demand[rs.skillName] = (demand[rs.skillName] || 0) + 1;
  await db.collection("analytics").doc("skillDemand").set({ demand, updatedAt: FieldValue.serverTimestamp() });
}

module.exports = {
  recomputeTeam, generateRecommendations, previewCandidateImpact,
  refreshTeamBalanceOverview, refreshSkillDemand,
};
