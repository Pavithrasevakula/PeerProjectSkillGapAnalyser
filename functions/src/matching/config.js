"use strict";

/** Tunable constants for the matching engine (single source of truth). */
module.exports = {
  // Weight of a required skill when computing coverage.
  PRIORITY_WEIGHT: { "Must-have": 2, "Nice-to-have": 1 },

  // FR-13: final recommendation score = weighted sum of these four signals (each 0..1).
  RECOMMENDATION_WEIGHTS: { marginalGain: 0.55, roleFit: 0.2, availability: 0.15, experience: 0.1 },

  // Team Balance Index (0-100) = weighted sum of four sub-scores.
  TBI_WEIGHTS: { skillCoverage: 0.4, roleDiversity: 0.25, experienceMix: 0.15, availabilityOverlap: 0.2 },

  // Shared weekly hours treated as "fully sufficient" for collaboration (6 h).
  TARGET_OVERLAP_MINUTES: 360,

  EXPERIENCE_LEVELS: ["Beginner", "Intermediate", "Advanced"],

  // Preference rank 1,2,3 -> score; anything else (or unlisted) -> UNLISTED_ROLE_SCORE.
  ROLE_RANK_SCORES: [1, 0.75, 0.5],
  UNLISTED_ROLE_SCORE: 0.25,
};
