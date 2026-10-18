const APP_NAME = "TeamSync";

const EXACT_TITLES = {
  "/": "Projects",
  "/login": "Sign in",
  "/profile": "Profile",
  "/dashboard": "Overview",
  "/team-lab": "Team Lab",
  "/projects/new": "Post a project",
};

/** Document title for a pathname, e.g. "/profile" -> "Profile - TeamSync". */
export function titleForPath(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  let page = EXACT_TITLES[path];
  if (!page) {
    if (/^\/projects\/[^/]+\/edit$/.test(path)) page = "Edit project";
    else if (/^\/projects\/[^/]+$/.test(path)) page = "Project details";
    else page = "Page not found";
  }
  return `${page} - ${APP_NAME}`;
}
