import { describe, expect, it } from "vitest";
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE, validateProjectForm } from "./projectValidation";

const now = new Date("2026-10-17T10:00:00");

const valid = () => ({
  form: { title: "Study planner", description: "A planner", domainArea: "Education", teamSizeRequired: 4, deadline: "2026-12-01" },
  requiredSkills: [{ skillId: "s1" }],
  requiredRoles: [{ roleId: "r1", slots: 2 }],
  now,
});

describe("validateProjectForm", () => {
  it("accepts a complete, valid project", () => {
    expect(validateProjectForm(valid())).toBe("");
  });

  it("requires at least one skill and one role", () => {
    expect(validateProjectForm({ ...valid(), requiredSkills: [] })).toMatch(/at least one required skill/);
    expect(validateProjectForm({ ...valid(), requiredRoles: [] })).toMatch(/at least one required skill/);
    expect(validateProjectForm({ ...valid(), requiredSkills: undefined })).toMatch(/at least one required skill/);
  });

  it("requires title, description and domain, ignoring whitespace-only values", () => {
    for (const field of ["title", "description", "domainArea"]) {
      const input = valid();
      input.form[field] = "   ";
      expect(validateProjectForm(input), field).toMatch(/Complete the title/);
    }
  });

  it.each([
    [MIN_TEAM_SIZE - 1, false],
    [MIN_TEAM_SIZE, true],
    [MAX_TEAM_SIZE, true],
    [MAX_TEAM_SIZE + 1, false],
    [3.5, false],
    ["abc", false],
    ["", false],
    [-4, false],
  ])("team size %s valid=%s", (size, ok) => {
    const input = valid();
    input.form.teamSizeRequired = size;
    input.requiredRoles = [{ roleId: "r1", slots: 1 }];
    const result = validateProjectForm(input);
    if (ok) expect(result).toBe("");
    else expect(result).toMatch(/whole number between 2 and 20/);
  });

  it("accepts a numeric string team size from the form input", () => {
    const input = valid();
    input.form.teamSizeRequired = "5";
    expect(validateProjectForm(input)).toBe("");
  });

  it("validates the deadline", () => {
    const missing = valid();
    missing.form.deadline = "";
    expect(validateProjectForm(missing)).toMatch(/valid project deadline/);

    const garbage = valid();
    garbage.form.deadline = "not-a-date";
    expect(validateProjectForm(garbage)).toMatch(/valid project deadline/);

    const past = valid();
    past.form.deadline = "2026-10-16";
    expect(validateProjectForm(past)).toMatch(/must be in the future/);
  });

  it("treats a deadline of today as valid until the end of the day", () => {
    const today = valid();
    today.form.deadline = "2026-10-17";
    expect(validateProjectForm(today)).toBe("");
  });

  it("rejects more role positions than the team size", () => {
    const input = valid();
    input.form.teamSizeRequired = 3;
    input.requiredRoles = [{ roleId: "a", slots: 2 }, { roleId: "b", slots: 2 }];
    expect(validateProjectForm(input)).toMatch(/smaller than the requested role positions/);
  });

  it("allows role positions equal to the team size", () => {
    const input = valid();
    input.form.teamSizeRequired = 4;
    input.requiredRoles = [{ roleId: "a", slots: 2 }, { roleId: "b", slots: 2 }];
    expect(validateProjectForm(input)).toBe("");
  });
});
