"use strict";
const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");

// Keep in sync with VITE_FUNCTIONS_REGION in the front end and the hosting rewrite in firebase.json.
setGlobalOptions({ region: "asia-south1", maxInstances: 10 });

const callables = require("./src/callables");
const triggers = require("./src/triggers");
const chat = require("./src/chat");
const aiRecommendations = require("./src/ai-recommendations-api");
const gamification = require("./src/gamification");

exports.api = onRequest(require("./src/api"));
Object.assign(exports, callables, triggers, chat, aiRecommendations, gamification);
