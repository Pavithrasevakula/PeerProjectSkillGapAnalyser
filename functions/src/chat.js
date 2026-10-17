"use strict";
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * When a project is created, automatically create default chat channels
 */
exports.initializeProjectChat = onDocumentCreated(
  "projects/{projectId}",
  async (event) => {
    const projectId = event.params.projectId;
    const projectData = event.data.data();

    try {
      // Create default channels
      const channelsRef = db.collection(`projects/${projectId}/channels`);

      const defaultChannels = [
        {
          id: "general",
          channelName: "general",
          description: "General team discussion",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: projectData.ownerUserId,
        },
        {
          id: "announcements",
          channelName: "announcements",
          description: "Important project announcements",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: projectData.ownerUserId,
        },
      ];

      const batch = db.batch();
      for (const channel of defaultChannels) {
        const channelRef = channelsRef.doc(channel.id);
        batch.set(channelRef, channel);
      }

      await batch.commit();
      console.log(`Chat channels initialized for project ${projectId}`);
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  }
);

/**
 * Send a chat message (callable function)
 */
exports.sendChatMessage = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { projectId, channelId, text } = data;

  if (!projectId || !channelId || !text) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Message text cannot be empty");
  }

  if (text.length > 2000) {
    throw new HttpsError(
      "invalid-argument",
      "Message text exceeds 2000 characters"
    );
  }

  try {
    // Verify user is a team member or project owner
    const projectRef = db.collection("projects").doc(projectId);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
      throw new HttpsError("not-found", "Project not found");
    }

    const projectData = projectSnap.data();
    const isOwner = projectData.ownerUserId === auth.uid;

    if (!isOwner) {
      const teamMemberRef = projectRef
        .collection("teamMembers")
        .doc(auth.uid);
      const teamMemberSnap = await teamMemberRef.get();

      if (!teamMemberSnap.exists) {
        throw new HttpsError(
          "permission-denied",
          "User is not a member of this project"
        );
      }
    }

    // Get user profile
    const userSnap = await db.collection("users").doc(auth.uid).get();
    const userData = userSnap.data();
    const senderName = userData?.fullName || userData?.email || "Unknown User";

    // Add message
    const messageRef = db
      .collection(`projects/${projectId}/channels/${channelId}/messages`)
      .doc();

    await messageRef.set({
      senderId: auth.uid,
      senderName: senderName,
      text: text.trim(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      edited: false,
    });

    // Update channel last activity
    await db
      .collection(`projects/${projectId}/channels`)
      .doc(channelId)
      .set({
        channelName: channelId,
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageBy: auth.uid,
      }, { merge: true });

    return { success: true, messageId: messageRef.id };
  } catch (error) {
    console.error("Error sending message:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to send message");
  }
});

/**
 * Create a direct message conversation
 */
exports.createDirectMessage = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { recipientId } = data;

  if (!recipientId) {
    throw new HttpsError("invalid-argument", "Recipient ID is required");
  }

  if (recipientId === auth.uid) {
    throw new HttpsError(
      "invalid-argument",
      "Cannot create conversation with yourself"
    );
  }

  try {
    // Create conversation ID (sorted to ensure consistency)
    const participants = [auth.uid, recipientId].sort();
    const conversationId = participants.join("_");

    const conversationRef = db
      .collection("directMessages")
      .doc(conversationId);
    const conversationSnap = await conversationRef.get();

    if (!conversationSnap.exists) {
      // Create new conversation
      await conversationRef.set({
        participants: participants,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { conversationId: conversationId };
  } catch (error) {
    console.error("Error creating direct message:", error);
    throw new HttpsError("internal", "Failed to create conversation");
  }
});

/**
 * Get chat statistics for analytics
 */
exports.getChatStats = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { projectId } = data;

  if (!projectId) {
    throw new HttpsError("invalid-argument", "Project ID is required");
  }

  try {
    // Verify user access
    const projectRef = db.collection("projects").doc(projectId);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
      throw new HttpsError("not-found", "Project not found");
    }

    const projectData = projectSnap.data();
    if (projectData.ownerUserId !== auth.uid) {
      throw new HttpsError(
        "permission-denied",
        "Only project owner can view chat statistics"
      );
    }

    // Get all channels
    const channelsSnap = await db
      .collection(`projects/${projectId}/channels`)
      .get();

    const stats = {
      totalChannels: channelsSnap.size,
      channels: [],
      totalMessages: 0,
      activeMembers: new Set(),
    };

    // Get stats for each channel
    for (const channelDoc of channelsSnap.docs) {
      const messagesSnap = await db
        .collection(
          `projects/${projectId}/channels/${channelDoc.id}/messages`
        )
        .get();

      const messageCount = messagesSnap.size;
      stats.totalMessages += messageCount;

      messagesSnap.docs.forEach((msgDoc) => {
        const msgData = msgDoc.data();
        stats.activeMembers.add(msgData.senderId);
      });

      stats.channels.push({
        channelId: channelDoc.id,
        channelName: channelDoc.data().channelName,
        messageCount: messageCount,
      });
    }

    stats.activeMembersCount = stats.activeMembers.size;
    delete stats.activeMembers; // Remove Set object before returning

    return stats;
  } catch (error) {
    console.error("Error getting chat stats:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to retrieve chat statistics");
  }
});
