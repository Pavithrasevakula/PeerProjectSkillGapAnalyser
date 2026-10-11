"use strict";
/** Node.js/Express REST facade (served at /api through Firebase Hosting). Read-only, token-authenticated. */
const express = require("express");
const cors = require("cors");
const { admin, db } = require("./firebase");
const svc = require("./services/teamService");

const app = express();
app.use(cors({ origin: true }));

async function authenticate(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!token) return res.status(401).json({ error: "Missing bearer token" });
  try {
    req.uid = (await admin.auth().verifyIdToken(token)).uid;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

async function ownerOnly(req, res, next) {
  const snap = await db.collection("projects").doc(req.params.id).get();
  if (!snap.exists) return res.status(404).json({ error: "Project not found" });
  if (snap.get("ownerUserId") !== req.uid) return res.status(403).json({ error: "Owner only" });
  next();
}

const router = express.Router();
router.get("/health", (_req, res) => res.json({ ok: true }));

router.get("/projects/:id/recommendations", authenticate, ownerOnly, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const snap = await db.collection("projects").doc(req.params.id).collection("recommendations")
      .orderBy("recommendationScore", "desc").limit(limit).get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) { next(err); }
});

router.get("/projects/:id/preview/:candidateId", authenticate, ownerOnly, async (req, res, next) => {
  try {
    const preview = await svc.previewCandidateImpact(db, req.params.id, req.params.candidateId, req.query.roleId);
    if (!preview) return res.status(404).json({ error: "Candidate not found" });
    res.json(preview);
  } catch (err) { next(err); }
});

router.get("/analytics", authenticate, async (_req, res, next) => {
  try {
    const [demand, overview] = await Promise.all([
      db.collection("analytics").doc("skillDemand").get(),
      db.collection("analytics").doc("teamBalanceOverview").get(),
    ]);
    res.json({ skillDemand: demand.data() || {}, teamBalanceOverview: overview.data() || {} });
  } catch (err) { next(err); }
});

app.use(["/api", "/"], router);
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal error" });
});

module.exports = app;
