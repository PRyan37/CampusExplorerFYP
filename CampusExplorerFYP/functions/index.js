/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const cors = require("cors")({
  origin: ["http://localhost:5173", "https://campusexplorer-4a01d.web.app"],
});

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
// exports.helloWorld = onRequest((req, res) => {
//   cors(req, res, () => {
//     logger.info("Hello logs!", { structuredData: true });
//     res.status(200).send("Hello from Firebase!");
//   });
// });
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

const { onCall, HttpsError } = require("firebase-functions/v2/https");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

exports.createUserProfile = onCall(async (request) => {
  const { auth } = request;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const uid = auth.uid;
  const email = (auth.token?.email || "").trim().toLowerCase();

  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        email: email || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return { ok: true };
});

exports.sendFriendRequest = onCall(async (request) => {
  const { data, auth } = request;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");
  // who is sending the request
  const fromUserId = auth.uid;
  const fromEmail = auth.token.email || null;

  const toEmailRaw = data && data.toEmail;
  const toEmail = (toEmailRaw || "").trim().toLowerCase();
  if (!toEmail) throw new HttpsError("invalid-argument", "toEmail is required.");

  // Find target user by email
  const usersRef = db.collection("users");
  const snap = await usersRef.where("email", "==", toEmail).limit(1).get();
  if (snap.empty) throw new HttpsError("not-found", "No user found with that email.");

  const friendDoc = snap.docs[0];
  const toUserId = friendDoc.id;
  // cannot send emails to yourself
  if (toUserId === fromUserId) {
    throw new HttpsError("failed-precondition", "You cannot add yourself as a friend.");
  }

  const requestId = `${fromUserId}_${toUserId}`;
  const reverseRequestId = `${toUserId}_${fromUserId}`;

  const reqRef = db.collection("friendRequests").doc(requestId);
  const reverseRef = db.collection("friendRequests").doc(reverseRequestId);

  //checking are they are already friends
  const alreadyFriends = await db
    .collection("friends")
    .where("userId", "==", fromUserId)
    .where("friendId", "==", toUserId)
    .limit(1)
    .get();

  if (!alreadyFriends.empty) {
    throw new HttpsError("failed-precondition", "You are already friends.");
  }
  const toNotifRef = admin.firestore().collection(`notifications/${toUserId}/inbox`).doc();

  const fromNotifRef = admin.firestore().collection(`notifications/${fromUserId}/inbox`).doc();

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(reqRef);
    if (existing.exists) {
      const status = existing.data()?.status;
      if (status === "pending") {
        throw new HttpsError("failed-precondition", "Friend request already sent.");
      }
      throw new HttpsError("failed-precondition", "A request record already exists.");
    }

    const reverse = await tx.get(reverseRef);
    if (reverse.exists && reverse.data()?.status === "pending") {
      throw new HttpsError(
        "failed-precondition",
        "This user already sent you a friend request. Check your incoming requests.",
      );
    }

    tx.set(reqRef, {
      fromUserId,
      fromEmail,
      toUserId,
      toEmail,
      status: "pending",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2) receiver notification
    tx.set(toNotifRef, {
      type: "FRIEND_REQUEST",
      requestId,
      ownerId: toUserId,
      ownerEmail: toEmail,
      fromUserId,
      fromName: fromEmail || "someone",
      message: `New friend request from ${fromEmail || "someone"}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });

    // 3) sender notification
    tx.set(fromNotifRef, {
      type: "FRIEND_REQUEST_SENT",
      requestId,
      ownerId: fromUserId,
      ownerEmail: fromEmail,
      toUserId,
      toEmail,
      message: `Friend request sent to ${toEmail}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });
  });

  return { requestId: requestId };
});

exports.respondToFriendRequest = onCall(async (request) => {
  const { data, auth } = request;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");
  // who is reponding to the request
  const userId = auth.uid;
  const requestId = data && data.requestId;
  const action = (data && data.action) || "";

  if (!requestId || !["accept", "reject"].includes(action)) {
    throw new HttpsError("invalid-argument", "requestId and valid action are required.");
  }

  try {
    const reqRef = db.collection("friendRequests").doc(requestId);
    const reqSnap = await reqRef.get();

    if (!reqSnap.exists) {
      throw new HttpsError("not-found", "Friend request not found.");
    }

    const reqData = reqSnap.data();

    // only the recipient can respond
    if (reqData.toUserId !== userId) {
      throw new HttpsError("permission-denied", "You cannot respond to this request.");
    }

    if (reqData.status !== "pending") {
      throw new HttpsError("failed-precondition", "Request is not pending.");
    }

    if (action === "reject") {
      await reqRef.delete();
      console.log("[respondToFriendRequest] rejected:", requestId);
      return { status: "rejected" };
    }

    // action === "accept"
    const fromUserId = reqData.fromUserId;
    const toUserId = reqData.toUserId;

    const fromEmail = reqData.fromEmail || null;
    const toEmail = reqData.toEmail || null;

    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const friendsRef = db.collection("friends");

    // Create two documents for bidirectional friendship
    batch.set(
      friendsRef.doc(`${fromUserId}_${toUserId}`),
      {
        userId: fromUserId,
        userEmail: fromEmail,
        friendId: toUserId,
        friendEmail: toEmail,
        createdAt: now,
      },
      { merge: true },
    );

    batch.set(
      friendsRef.doc(`${toUserId}_${fromUserId}`),
      {
        userId: toUserId,
        userEmail: toEmail,
        friendId: fromUserId,
        friendEmail: fromEmail,
        createdAt: now,
      },
      { merge: true },
    );

    batch.delete(reqRef);
    const toNotifRef = admin.firestore().collection(`notifications/${toUserId}/inbox`).doc(); // random id
    const fromNotifRef = admin.firestore().collection(`notifications/${fromUserId}/inbox`).doc(); // random id

    await toNotifRef.set({
      type: "FRIEND_REQUEST_ACCEPTED",
      requestId,
      ownerId: toUserId,
      ownerEmail: toEmail,
      fromUserId,
      fromName: fromEmail,
      message: `You are now friends with ${fromEmail}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });

    await fromNotifRef.set({
      type: "FRIEND_REQUEST_ACCEPTED",
      requestId,
      ownerId: fromUserId,
      ownerEmail: fromEmail,
      fromUserId,
      fromName: toEmail,
      message: `You are now friends with ${toEmail}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });
    await batch.commit();
    return { status: "accepted" };
  } catch (err) {
    console.error("[respondToFriendRequest] ERROR:", err);
    if (err instanceof HttpsError) {
      throw err;
    }
    throw new HttpsError("internal", "Failed to respond to friend request.");
  }
});

exports.markDiscovered = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const userId = auth.uid;
  const fromEmail = (auth.token?.email || "").trim().toLowerCase();

  const discoveryField = data?.discoveryField; // e.g. "concourseDiscovered" or "sultDiscovered"
  const displayName = data?.displayName || "a location";

  if (!discoveryField) {
    throw new HttpsError("invalid-argument", "discoveryField is required.");
  }

  if (!/Discovered$/.test(discoveryField)) {
    throw new HttpsError("invalid-argument", "Invalid discoveryField.");
  }

  const timestampField = `${discoveryField}At`;

  await db
    .collection("users")
    .doc(userId)
    .set(
      {
        [discoveryField]: true,
        [timestampField]: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  const friendsSnap = await db.collection("friends").where("userId", "==", userId).get();
  const friendIds = friendsSnap.docs.map((d) => d.data()?.friendId).filter(Boolean);

  if (friendIds.length) {
    const batch = db.batch();
    const createdAt = admin.firestore.FieldValue.serverTimestamp();

    friendIds.forEach((friendId) => {
      const notifRef = db.collection(`notifications/${friendId}/inbox`).doc();
      batch.set(notifRef, {
        type: "FRIEND_DISCOVERY",
        ownerId: friendId,
        fromUserId: userId,
        fromName: fromEmail || "A friend",
        discoveryField,
        displayName,
        message: `${fromEmail || "A friend"} discovered ${displayName}`,
        createdAt,
        read: false,
      });
    });

    await batch.commit();
  }

  return { ok: true, notified: friendIds.length };
});
