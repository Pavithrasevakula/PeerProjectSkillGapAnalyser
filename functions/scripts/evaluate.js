"use strict";
/**
 * FR-20 evaluation: complementarity matching vs random assignment vs keyword matching.
 * Runs entirely in memory (no Firebase needed):   npm run evaluate
 *
 * Protocol: for every project and every trial, draw a pool of applicants, then let each
 * strategy build a team of the required size by repeatedly picking from the same pool.
 */
const fs = require("fs");
const path = require("path");
const engine = require("../src/matching/engine");
const { generateDataset, toCandidate } = require("./generateData");

const TRIALS = 20;
const POOL_SIZE = 20;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

function formTeam(project, pool, strategy, rng) {
  const team = [];
  let remaining = [...pool];
  while (team.length < project.teamSizeRequired && remaining.length) {
    let pick;
    if (strategy === "random") {
      pick = remaining[Math.floor(rng() * remaining.length)];
    } else if (strategy === "keyword") {
      // Highest keyword score; ties broken at random so no strategy benefits from input order.
      remaining = shuffle(remaining, rng);
      pick = remaining.reduce((best, c) => (engine.keywordScore(project, c) > engine.keywordScore(project, best) ? c : best));
    } else {
      pick = engine.rankCandidates(project, team, remaining)[0].candidate;
    }
    team.push({ ...pick, assignedRoleId: engine.assignRole(project, team, pick) });
    remaining = remaining.filter((c) => c !== pick);
  }
  return team;
}

function measure(project, team) {
  const gap = engine.computeSkillGap(project, team);
  const mustHave = new Set(project.requiredSkills.filter((s) => s.priority === "Must-have").map((s) => s.skillId));
  const tbi = engine.teamBalance(project, team);
  return {
    coverage: tbi.skillCoverageScore,
    residualGap: gap.reduce((a, g) => a + g.gapValue, 0),
    uncoveredMustHave: gap.filter((g) => mustHave.has(g.skillId) && g.gapValue > 0).length,
    tbi: tbi.overallScore,
  };
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };
const fmt = (xs) => `${mean(xs).toFixed(2)} +/- ${sd(xs).toFixed(2)}`;

function main() {
  const data = generateDataset();
  const students = data.users.map(toCandidate);
  const rng = mulberry32(2026);
  const strategies = ["random", "keyword", "complementarity"];
  const samples = Object.fromEntries(strategies.map((s) => [s, { coverage: [], residualGap: [], uncoveredMustHave: [], tbi: [] }]));

  for (const project of data.projects) {
    const eligible = students.filter((c) => c.uid !== project.ownerUserId);
    for (let t = 0; t < TRIALS; t++) {
      const pool = shuffle(eligible, rng).slice(0, POOL_SIZE);
      for (const s of strategies) {
        const m = measure(project, formTeam(project, pool, s, rng));
        for (const k of Object.keys(m)) samples[s][k].push(m[k]);
      }
    }
  }

  const n = samples.random.coverage.length;
  console.log(`\nProjects: ${data.projects.length}  |  trials/project: ${TRIALS}  |  pool: ${POOL_SIZE}  |  team builds per strategy: ${n}`);
  console.log(`Synthetic records: ${data.users.length} users, ${data.projects.length} projects\n`);
  console.table(Object.fromEntries(strategies.map((s) => [s, {
    "Skill coverage % (up)": fmt(samples[s].coverage),
    "Residual gap, levels (down)": fmt(samples[s].residualGap),
    "Uncovered must-haves (down)": fmt(samples[s].uncoveredMustHave),
    "Team Balance Index (up)": fmt(samples[s].tbi),
  }])));

  const outFile = path.join(__dirname, "evaluation_results.json");
  fs.writeFileSync(outFile, JSON.stringify(Object.fromEntries(strategies.map((s) => [s,
    Object.fromEntries(Object.entries(samples[s]).map(([k, v]) => [k, { mean: +mean(v).toFixed(3), sd: +sd(v).toFixed(3) }]))])), null, 2));
  console.log(`Saved ${outFile}`);
}

main();
