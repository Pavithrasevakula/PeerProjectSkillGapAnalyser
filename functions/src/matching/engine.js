"use strict";
/**
 * Complementarity-based matching engine (pure functions, no I/O).
 *
 * Shapes used throughout
 *   project   : { requiredSkills:[{skillId, skillName, minProficiency, priority}],
 *                 requiredRoles:[{roleId, roleName, slots}], teamSizeRequired }
 *   candidate : { uid, name, experienceLevel, skills:{skillId:level 1-5},
 *                 preferredRoles:{roleId:rank}, availability:[{dayOfWeek,startTime,endTime}],
 *                 assignedRoleId? }
 *   team      : candidate[]   (current members)
 */
const cfg = require("./config");

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const pct = (x) => Math.round(clamp01(x) * 10000) / 100; // 0..1 -> 0..100 (2 dp)

/* ------------------------------ availability ------------------------------ */

function toMinutes(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}

function mergeIntervals(intervals) {
  const sorted = intervals.filter(([s, e]) => e > s).map(([s, e]) => [s, e]).sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

function weeklyIntervals(slots = []) {
  const byDay = {};
  for (const slot of slots) {
    const s = toMinutes(slot.startTime);
    const e = toMinutes(slot.endTime);
    if (!slot.dayOfWeek || Number.isNaN(s) || Number.isNaN(e)) continue;
    (byDay[slot.dayOfWeek] = byDay[slot.dayOfWeek] || []).push([s, e]);
  }
  for (const day of Object.keys(byDay)) byDay[day] = mergeIntervals(byDay[day]);
  return byDay;
}

function totalMinutes(byDay) {
  return Object.values(byDay).reduce((sum, list) => sum + list.reduce((a, [s, e]) => a + (e - s), 0), 0);
}

function overlapMinutes(a, b) {
  let total = 0;
  for (const day of Object.keys(a)) {
    const other = b[day];
    if (!other) continue;
    for (const [s1, e1] of a[day]) {
      for (const [s2, e2] of other) total += Math.max(0, Math.min(e1, e2) - Math.max(s1, s2));
    }
  }
  return total;
}

/** Average pairwise weekly overlap of a team, as a 0..1 ratio of the target. */
function teamAvailabilityRatio(members) {
  if (members.length < 2) return 0;
  const sched = members.map((m) => weeklyIntervals(m.availability));
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < sched.length; i++) {
    for (let j = i + 1; j < sched.length; j++) {
      sum += overlapMinutes(sched[i], sched[j]);
      pairs++;
    }
  }
  return clamp01(sum / pairs / cfg.TARGET_OVERLAP_MINUTES);
}

/** How well a candidate's schedule meshes with the existing team (0..1). */
function availabilityFit(team, candidate) {
  const c = weeklyIntervals(candidate.availability);
  if (!team.length) return clamp01(totalMinutes(c) / cfg.TARGET_OVERLAP_MINUTES);
  let sum = 0;
  for (const m of team) sum += overlapMinutes(c, weeklyIntervals(m.availability));
  return clamp01(sum / team.length / cfg.TARGET_OVERLAP_MINUTES);
}

/* ------------------------------ skill coverage ----------------------------- */

const weightOf = (rs) => cfg.PRIORITY_WEIGHT[rs.priority] ?? 1;

/** Highest proficiency in the team for every required skill. */
function coveredLevels(requiredSkills, members) {
  const out = {};
  for (const rs of requiredSkills) {
    let best = 0;
    for (const m of members) best = Math.max(best, (m.skills && m.skills[rs.skillId]) || 0);
    out[rs.skillId] = best;
  }
  return out;
}

/** Weighted coverage in 0..1 (partial credit for partially met proficiency). */
function skillCoverage(requiredSkills, covered) {
  let num = 0;
  let den = 0;
  for (const rs of requiredSkills) {
    const req = rs.minProficiency || 1;
    const w = weightOf(rs);
    num += (w * Math.min(covered[rs.skillId] || 0, req)) / req;
    den += w;
  }
  return den ? num / den : 1;
}

/** Rows for the radar chart / skillGap document. gapValue = max(0, required - covered). */
function computeSkillGap(project, members) {
  const reqs = project.requiredSkills || [];
  const covered = coveredLevels(reqs, members);
  return reqs.map((rs) => ({
    skillId: rs.skillId,
    skillName: rs.skillName,
    requiredLevel: rs.minProficiency || 1,
    coveredLevel: covered[rs.skillId] || 0,
    gapValue: Math.max(0, (rs.minProficiency || 1) - (covered[rs.skillId] || 0)),
  }));
}

/**
 * FR-12: marginal improvement to team coverage if `candidate` joins.
 * A duplicate of an existing strength contributes exactly zero.
 */
function marginalGain(project, team, candidate) {
  const reqs = project.requiredSkills || [];
  const before = coveredLevels(reqs, team);
  const after = coveredLevels(reqs, [...team, candidate]);
  const coverageBefore = skillCoverage(reqs, before);
  const coverageAfter = skillCoverage(reqs, after);
  const gain = coverageAfter - coverageBefore;
  // Share of the *remaining* gap this candidate closes (0..1).
  const relativeGain = coverageBefore >= 1 ? 0 : clamp01(gain / (1 - coverageBefore));

  const filledSkills = [];
  const duplicatedSkills = [];
  for (const rs of reqs) {
    const lvl = (candidate.skills && candidate.skills[rs.skillId]) || 0;
    if (!lvl) continue;
    const alreadyMet = before[rs.skillId] >= (rs.minProficiency || 1);
    if (!alreadyMet && after[rs.skillId] > before[rs.skillId]) filledSkills.push(rs.skillName);
    else duplicatedSkills.push(rs.skillName); // team already meets this requirement (or has >= level)
  }
  return { gain, relativeGain, coverageBefore, coverageAfter, filledSkills, duplicatedSkills };
}

/* ---------------------------------- roles ---------------------------------- */

function openRoleSlots(project, team) {
  const taken = {};
  for (const m of team) if (m.assignedRoleId) taken[m.assignedRoleId] = (taken[m.assignedRoleId] || 0) + 1;
  return (project.requiredRoles || []).map((r) => ({
    roleId: r.roleId,
    roleName: r.roleName,
    open: Math.max(0, (r.slots || 1) - (taken[r.roleId] || 0)),
  }));
}

function rankScore(candidate, roleId) {
  const rank = candidate.preferredRoles && candidate.preferredRoles[roleId];
  if (!rank) return cfg.UNLISTED_ROLE_SCORE;
  return cfg.ROLE_RANK_SCORES[rank - 1] ?? cfg.UNLISTED_ROLE_SCORE;
}

/** Best open role for a candidate (or the applied role, if given). */
function roleFit(project, team, candidate, appliedRoleId) {
  const slots = openRoleSlots(project, team);
  if (!slots.length) return { score: 0.5, roleId: appliedRoleId || null, roleName: null, rank: null, noSlot: false };

  const open = slots.filter((s) => s.open > 0);
  const pool = appliedRoleId ? open.filter((s) => s.roleId === appliedRoleId) : open;
  if (!pool.length) return { score: 0, roleId: appliedRoleId || null, roleName: null, rank: null, noSlot: true };

  let best = null;
  for (const s of pool) {
    const score = rankScore(candidate, s.roleId);
    if (!best || score > best.score) {
      best = {
        score,
        roleId: s.roleId,
        roleName: s.roleName,
        rank: (candidate.preferredRoles && candidate.preferredRoles[s.roleId]) || null,
        noSlot: false,
      };
    }
  }
  return best;
}

/** Role to record for a candidate joining the team (null when no open role exists). */
function assignRole(project, team, candidate, appliedRoleId) {
  const fit = roleFit(project, team, candidate, appliedRoleId);
  return fit.noSlot ? null : fit.roleId;
}

/* ------------------------------- experience -------------------------------- */

/** 1 when the candidate's level is absent from the team, falling as it is over-represented. */
function experienceFit(team, candidate) {
  if (!team.length) return 1;
  const same = team.filter((m) => m.experienceLevel === candidate.experienceLevel).length;
  return 1 - same / team.length;
}

/** Normalised Shannon entropy of the experience-level distribution (0..1). */
function experienceMixRatio(members) {
  const n = members.length;
  if (n < 2) return 0;
  const counts = cfg.EXPERIENCE_LEVELS.map((lvl) => members.filter((m) => m.experienceLevel === lvl).length);
  let h = 0;
  for (const c of counts) if (c > 0) h -= (c / n) * Math.log(c / n);
  return clamp01(h / Math.log(Math.min(n, cfg.EXPERIENCE_LEVELS.length)));
}

/* ------------------------------ team balance ------------------------------- */

function roleDiversityRatio(project, members) {
  if (!members.length) return 0;
  const distinct = new Set(members.map((m) => m.assignedRoleId).filter(Boolean)).size;
  const requiredDistinct = (project.requiredRoles || []).length || members.length;
  return clamp01(distinct / Math.min(members.length, requiredDistinct));
}

/** FR-17: Team Balance Index and its four sub-scores, all 0..100. */
function teamBalance(project, members) {
  const reqs = project.requiredSkills || [];
  const w = cfg.TBI_WEIGHTS;
  const skillCov = skillCoverage(reqs, coveredLevels(reqs, members));
  const subs = {
    skillCoverageScore: pct(members.length ? skillCov : 0),
    roleDiversityScore: pct(roleDiversityRatio(project, members)),
    experienceMixScore: pct(experienceMixRatio(members)),
    availabilityOverlapScore: pct(teamAvailabilityRatio(members)),
  };
  const overall =
    w.skillCoverage * subs.skillCoverageScore +
    w.roleDiversity * subs.roleDiversityScore +
    w.experienceMix * subs.experienceMixScore +
    w.availabilityOverlap * subs.availabilityOverlapScore;
  return { ...subs, overallScore: Math.round(overall * 100) / 100 };
}

/* ------------------------------ recommendation ----------------------------- */

const listNames = (names) =>
  names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;

function explain(team, candidate, r) {
  const parts = [];
  if (r.filledSkills.length) {
    parts.push(`Fills ${listNames(r.filledSkills)} (coverage ${r.coverageBefore}% -> ${r.coverageAfter}%)`);
  } else if (r.coverageBefore >= 100) {
    parts.push("Team already covers every required skill");
  } else if (r.duplicatedSkills.length) {
    parts.push(`Mostly repeats ${listNames(r.duplicatedSkills)}, which the team already has`);
  } else {
    parts.push("Adds no new required skills");
  }

  if (r.role.noSlot) parts.push("no open slot for the applied role");
  else if (r.role.roleName) {
    parts.push(r.role.rank ? `${r.role.roleName} is their #${r.role.rank} role choice` : `can take the open ${r.role.roleName} slot`);
  }

  if (team.length) {
    const a = r.components.availability;
    parts.push(a >= 75 ? "strong schedule overlap" : a >= 40 ? "some schedule overlap" : "limited schedule overlap");
    if (r.components.experience >= 60) parts.push(`adds ${candidate.experienceLevel} experience the team lacks`);
  }

  const text = parts.join("; ") + ".";
  return text.length <= 255 ? text : text.slice(0, 252) + "...";
}

/** FR-12/13/14: score one candidate against the current team. */
function scoreCandidate(project, team, candidate, opts = {}) {
  const mg = marginalGain(project, team, candidate);
  const role = roleFit(project, team, candidate, opts.appliedRoleId);
  const availability = availabilityFit(team, candidate);
  const experience = experienceFit(team, candidate);
  const w = cfg.RECOMMENDATION_WEIGHTS;

  const raw =
    w.marginalGain * mg.relativeGain + w.roleFit * role.score + w.availability * availability + w.experience * experience;

  const result = {
    candidateId: candidate.uid,
    score: pct(raw),
    marginalGainScore: pct(mg.relativeGain),
    components: {
      marginalGain: pct(mg.relativeGain),
      roleFit: pct(role.score),
      availability: pct(availability),
      experience: pct(experience),
    },
    coverageBefore: pct(mg.coverageBefore),
    coverageAfter: pct(mg.coverageAfter),
    filledSkills: mg.filledSkills,
    duplicatedSkills: mg.duplicatedSkills,
    role,
  };
  result.explanation = explain(team, candidate, result);
  return result;
}

/** Rank all candidates, best first. Deterministic tie-breaks. */
function rankCandidates(project, team, candidates, appliedRoles = {}) {
  return candidates
    .map((candidate) => ({
      ...scoreCandidate(project, team, candidate, { appliedRoleId: appliedRoles[candidate.uid] }),
      candidate,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.marginalGainScore - a.marginalGainScore ||
        String(a.candidateId).localeCompare(String(b.candidateId))
    );
}

/** FR-15: read-only what-if. Per-skill levels before/after plus coverage and TBI deltas. */
function previewImpact(project, team, candidate, appliedRoleId) {
  const reqs = project.requiredSkills || [];
  const before = coveredLevels(reqs, team);
  const after = coveredLevels(reqs, [...team, candidate]);
  const scored = scoreCandidate(project, team, candidate, { appliedRoleId });
  const joined = { ...candidate, assignedRoleId: scored.role.noSlot ? null : scored.role.roleId };
  return {
    skills: reqs.map((rs) => ({
      skillId: rs.skillId,
      skillName: rs.skillName,
      requiredLevel: rs.minProficiency || 1,
      coveredLevel: before[rs.skillId] || 0,
      projectedLevel: after[rs.skillId] || 0,
    })),
    coverageBefore: scored.coverageBefore,
    coverageAfter: scored.coverageAfter,
    tbiBefore: teamBalance(project, team),
    tbiAfter: teamBalance(project, [...team, joined]),
    score: scored.score,
    explanation: scored.explanation,
  };
}

/* -------------------------------- baselines -------------------------------- */

/** Keyword baseline (FR-20): fraction of required skills the candidate lists, ignoring the team. */
function keywordScore(project, candidate) {
  const reqs = project.requiredSkills || [];
  if (!reqs.length) return 0;
  return reqs.filter((rs) => (candidate.skills && candidate.skills[rs.skillId]) > 0).length / reqs.length;
}

module.exports = {
  toMinutes, mergeIntervals, weeklyIntervals, overlapMinutes,
  coveredLevels, skillCoverage, computeSkillGap, marginalGain,
  openRoleSlots, roleFit, assignRole, experienceFit, experienceMixRatio,
  teamAvailabilityRatio, availabilityFit, teamBalance,
  scoreCandidate, rankCandidates, previewImpact, keywordScore,
};
