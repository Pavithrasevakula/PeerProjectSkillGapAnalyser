"use strict";
const admin = require("firebase-admin");
const { getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { FieldValue, Timestamp, getFirestore } = require("firebase-admin/firestore");

const app = getApps().length ? getApps()[0] : initializeApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Firebase Admin v14 exposes service clients through modular entry points. Keep a
// small compatibility facade for the existing source and maintenance scripts while
// using the current API internally.
const firestore = () => db;
firestore.FieldValue = FieldValue;
firestore.Timestamp = Timestamp;
admin.firestore = firestore;
admin.auth = () => auth;
admin.apps = getApps();

module.exports = {
  admin,
  app,
  auth,
  db,
  FieldValue,
  Timestamp,
};
