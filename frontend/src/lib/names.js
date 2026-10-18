/** Best available display name for the signed-in user. */
export function displayName(account, user) {
  const fullName = typeof account?.fullName === "string" ? account.fullName.trim() : "";
  if (fullName) return fullName;
  return user?.email?.split("@")[0] || "User";
}

/** First word of the display name, used by the compact account menu button. */
export function firstName(account, user) {
  return displayName(account, user).split(/\s+/)[0] || "User";
}
