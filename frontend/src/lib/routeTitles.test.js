import { describe, expect, it } from "vitest";
import { titleForPath } from "./routeTitles";

describe("titleForPath", () => {
  it.each([
    ["/", "Projects - TeamSync"],
    ["/login", "Sign in - TeamSync"],
    ["/profile", "Profile - TeamSync"],
    ["/dashboard", "Overview - TeamSync"],
    ["/team-lab", "Team Lab - TeamSync"],
    ["/projects/new", "Post a project - TeamSync"],
    ["/projects/abc123", "Project details - TeamSync"],
    ["/projects/abc123/edit", "Edit project - TeamSync"],
  ])("%s -> %s", (path, title) => expect(titleForPath(path)).toBe(title));

  it("ignores trailing slashes", () => {
    expect(titleForPath("/profile/")).toBe("Profile - TeamSync");
  });

  it("labels unknown paths as not found", () => {
    expect(titleForPath("/nope")).toBe("Page not found - TeamSync");
    expect(titleForPath("/projects/a/b/c")).toBe("Page not found - TeamSync");
  });
});
