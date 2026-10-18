import { describe, expect, it } from "vitest";
import { authErrorMessage, isValidEmail } from "./authMessages";

describe("authErrorMessage", () => {
  it("maps known Firebase codes to friendly messages", () => {
    expect(authErrorMessage({ code: "auth/invalid-credential" })).toBe("The email or password is incorrect.");
    expect(authErrorMessage({ code: "auth/email-already-in-use" })).toBe("An account already exists with this email.");
    expect(authErrorMessage({ code: "auth/too-many-requests" })).toMatch(/Too many attempts/);
  });

  it("does not reveal whether an account exists", () => {
    const wrongPassword = authErrorMessage({ code: "auth/wrong-password" });
    const unknownUser = authErrorMessage({ code: "auth/user-not-found" });
    expect(wrongPassword).toBe(unknownUser);
  });

  it("falls back to a generic message and never leaks raw error text", () => {
    const message = authErrorMessage({ code: "auth/something-new", message: "internal detail: key=abc" });
    expect(message).toBe("Unable to complete authentication. Please try again.");
    expect(authErrorMessage(undefined)).toBe(message);
    expect(authErrorMessage(null)).toBe(message);
    expect(authErrorMessage({})).toBe(message);
  });
});

describe("isValidEmail", () => {
  it.each(["a@b.co", "first.last@university.edu", "  padded@example.com  ", "user+tag@example.org"])(
    "accepts %s",
    (value) => expect(isValidEmail(value)).toBe(true),
  );

  it.each(["", "   ", "plain", "@example.com", "user@", "user@example", "a b@example.com", "a@b@c.com", null, undefined, 42])(
    "rejects %s",
    (value) => expect(isValidEmail(value)).toBe(false),
  );
});
