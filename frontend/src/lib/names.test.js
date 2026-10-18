import { describe, expect, it } from "vitest";
import { displayName, firstName } from "./names";

describe("displayName", () => {
  it("prefers the profile name, trimmed", () => {
    expect(displayName({ fullName: "  Rahul Verma " }, { email: "x@y.com" })).toBe("Rahul Verma");
  });

  it("falls back to the email local part, then a default", () => {
    expect(displayName(null, { email: "rahul.verma@teamsync.demo" })).toBe("rahul.verma");
    expect(displayName({ fullName: "   " }, { email: "sam@example.com" })).toBe("sam");
    expect(displayName(undefined, {})).toBe("User");
    expect(displayName(undefined, undefined)).toBe("User");
  });

  it("ignores non-string names", () => {
    expect(displayName({ fullName: 123 }, { email: "a@b.co" })).toBe("a");
  });
});

describe("firstName", () => {
  it("returns the first word", () => {
    expect(firstName({ fullName: "Ada  Lovelace King" }, null)).toBe("Ada");
  });

  it("handles single names and missing data", () => {
    expect(firstName({ fullName: "Prince" }, null)).toBe("Prince");
    expect(firstName(null, null)).toBe("User");
  });
});
