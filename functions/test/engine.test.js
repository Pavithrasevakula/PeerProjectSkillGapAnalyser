"use strict";
const e = require("../src/matching/engine");

const project = {
  teamSizeRequired: 4,
  requiredSkills: [
    { skillId: "py", skillName: "Python", minProficiency: 3, priority: "Must-have" },
    { skillId: "react", skillName: "React", minProficiency: 3, priority: "Must-have" },
    { skillId: "figma", skillName: "Figma", minProficiency: 2, priority: "Nice-to-have" },
  ],
  requiredRoles: [
    { roleId: "be", roleName: "Backend Developer", slots: 2 },
    { roleId: "fe", roleName: "Frontend Developer", slots: 1 },
  ],
};

const mon = (s, t) => ({ dayOfWeek: "Mon", startTime: s, endTime: t });
const person = (uid, skills, extra = {}) => ({
  uid, name: uid, experienceLevel: "Intermediate", skills,
  preferredRoles: {}, availability: [mon("10:00", "13:00")], ...extra,
});

describe("availability helpers", () => {
  test("merges overlapping slots and counts overlap", () => {
    expect(e.mergeIntervals([[60, 120], [100, 180], [200, 240]])).toEqual([[60, 180], [200, 240]]);
    const a = e.weeklyIntervals([mon("10:00", "12:00")]);
    const b = e.weeklyIntervals([mon("11:00", "13:00")]);
    expect(e.overlapMinutes(a, b)).toBe(60);
  });
  test("ignores malformed slots", () => {
    expect(e.weeklyIntervals([{ dayOfWeek: "Mon", startTime: "x", endTime: "y" }])).toEqual({});
  });
});

describe("skill coverage and gap", () => {
  test("gap = max(0, required - covered)", () => {
    const gap = e.computeSkillGap(project, [person("a", { py: 5, react: 1 })]);
    expect(gap.find((g) => g.skillId === "py").gapValue).toBe(0);
    expect(gap.find((g) => g.skillId === "react").gapValue).toBe(2);
    expect(gap.find((g) => g.skillId === "figma").gapValue).toBe(2);
  });
});

describe("complementarity (the core claim)", () => {
  const team = [person("p1", { py: 4 })];
  const duplicate = person("dup", { py: 5 });
  const complement = person("comp", { react: 4 });

  test("a duplicate of an existing strength has zero marginal gain", () => {
    expect(e.marginalGain(project, team, duplicate).gain).toBe(0);
    expect(e.marginalGain(project, team, complement).gain).toBeGreaterThan(0);
  });

  test("candidate filling a gap outranks a stronger duplicate", () => {
    const ranked = e.rankCandidates(project, team, [duplicate, complement]);
    expect(ranked[0].candidateId).toBe("comp");
    expect(ranked[0].filledSkills).toEqual(["React"]);
    expect(ranked[1].duplicatedSkills).toEqual(["Python"]);
  });

  test("keyword baseline cannot tell them apart", () => {
    expect(e.keywordScore(project, duplicate)).toBe(e.keywordScore(project, complement));
  });

  test("scores and explanations are bounded", () => {
    for (const r of e.rankCandidates(project, team, [duplicate, complement])) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.explanation.length).toBeLessThanOrEqual(255);
    }
  });
});

describe("roles", () => {
  test("applied role without an open slot scores zero", () => {
    const full = [person("a", {}, { assignedRoleId: "fe" })];
    expect(e.roleFit(project, full, person("b", {}), "fe").score).toBe(0);
    expect(e.assignRole(project, full, person("b", {}), "fe")).toBeNull();
  });
  test("preference rank drives role fit", () => {
    const c = person("c", {}, { preferredRoles: { be: 1, fe: 3 } });
    expect(e.roleFit(project, [], c).roleId).toBe("be");
    expect(e.roleFit(project, [], c, "fe").score).toBe(0.5);
  });
});

describe("Team Balance Index", () => {
  test("empty team scores 0", () => {
    expect(e.teamBalance(project, []).overallScore).toBe(0);
  });
  test("is bounded and rewards a complete, diverse team", () => {
    const weak = [person("a", { py: 1 }, { assignedRoleId: "be" })];
    const strong = [
      person("a", { py: 4 }, { assignedRoleId: "be", experienceLevel: "Beginner" }),
      person("b", { react: 4 }, { assignedRoleId: "fe", experienceLevel: "Advanced" }),
      person("c", { figma: 3 }, { assignedRoleId: "be", experienceLevel: "Intermediate" }),
    ];
    const w = e.teamBalance(project, weak);
    const s = e.teamBalance(project, strong);
    for (const v of Object.values(s)) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); }
    expect(s.skillCoverageScore).toBe(100);
    expect(s.experienceMixScore).toBe(100);
    expect(s.overallScore).toBeGreaterThan(w.overallScore);
  });
});

describe("previewImpact", () => {
  test("is read-only and reports coverage change", () => {
    const team = [person("p1", { py: 4 })];
    const snapshot = JSON.stringify(team);
    const p = e.previewImpact(project, team, person("c", { react: 4 }));
    expect(JSON.stringify(team)).toBe(snapshot);
    expect(p.coverageAfter).toBeGreaterThan(p.coverageBefore);
    expect(p.skills.find((s) => s.skillId === "react").projectedLevel).toBe(4);
  });
});
