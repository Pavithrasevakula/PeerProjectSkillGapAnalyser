export const MIN_TEAM_SIZE = 2;
export const MAX_TEAM_SIZE = 20;

const endOfDay = (dateString) => new Date(`${dateString}T23:59:00`);

/**
 * Validate the project form. Returns a user-facing error message, or "" when valid.
 * `now` is injectable so the deadline rule is deterministic in tests.
 */
export function validateProjectForm({ form, requiredSkills, requiredRoles, now = new Date() }) {
  if (!requiredSkills?.length || !requiredRoles?.length) {
    return "Add at least one required skill and one required role.";
  }
  if (!form.title?.trim() || !form.description?.trim() || !form.domainArea?.trim()) {
    return "Complete the title, description, and domain fields.";
  }
  const teamSize = Number(form.teamSizeRequired);
  if (!Number.isInteger(teamSize) || teamSize < MIN_TEAM_SIZE || teamSize > MAX_TEAM_SIZE) {
    return `Team size must be a whole number between ${MIN_TEAM_SIZE} and ${MAX_TEAM_SIZE}.`;
  }
  if (!form.deadline || Number.isNaN(endOfDay(form.deadline).getTime())) {
    return "Choose a valid project deadline.";
  }
  if (endOfDay(form.deadline) < now) {
    return "The deadline must be in the future.";
  }
  const requestedSlots = requiredRoles.reduce((total, role) => total + Number(role.slots || 0), 0);
  if (requestedSlots > teamSize) {
    return "Team size cannot be smaller than the requested role positions.";
  }
  return "";
}
