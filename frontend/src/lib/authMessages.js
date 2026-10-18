const AUTH_MESSAGES = {
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-login-credentials": "The email or password is incorrect.",
  "auth/wrong-password": "The email or password is incorrect.",
  "auth/user-not-found": "The email or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/weak-password": "Use a password with at least six characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
};

const FALLBACK = "Unable to complete authentication. Please try again.";

/** Map a Firebase Auth error to a short, user-safe message (never leaks raw error text). */
export function authErrorMessage(error) {
  return AUTH_MESSAGES[error?.code] || FALLBACK;
}

/** Basic client-side email shape check; Firebase remains the source of truth. */
export function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
