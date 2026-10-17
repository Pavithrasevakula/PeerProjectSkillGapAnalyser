import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

const call = (name) => async (data) => (await httpsCallable(functions, name)(data)).data;

export const applyToProject = call("applyToProject");
export const acceptApplication = call("acceptApplication");
export const rejectApplication = call("rejectApplication");
export const previewCandidateImpact = call("previewCandidateImpact");
export const generateRecommendations = call("generateRecommendations");
export const sendChatMessage = call("sendChatMessage");

/** Turn a Firebase error into a short, user-facing message (NFR: no silent failures). */
export const errorMessage = (err) =>
  err?.message?.replace(/^.*?: /, "") || "Something went wrong. Please try again.";
export const getUserAchievements = call("getUserAchievements");
export const getLeaderboard = call("getLeaderboard");