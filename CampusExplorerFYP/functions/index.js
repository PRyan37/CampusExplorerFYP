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
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

exports.onFriendRequestCreated = onDocumentCreated("friendRequests/{requestId}", async (event) => {
  try {
    const snap = event.data;
    if (!snap) return null;

    const data = snap.data();
    const requestId = snap.id;
    console.log("[functions] onFriendRequestCreated triggered for id:", requestId);

    const toUserId = data.toUserId;
    const fromUserId = data.fromUserId;
    if (!toUserId || !fromUserId) return null;

    let fromName = data.fromEmail || "someone";

    const notifRef = admin.firestore().doc(`notifications/${toUserId}/items/${requestId}`);

    await notifRef.set({
      type: "FRIEND_REQUEST",
      requestId,
      fromUserId,
      fromName,
      message: `New friend request from ${fromName}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });

    console.log("[functions] notification written for toUserId:", toUserId);
    return null;
  } catch (err) {
    console.error("[functions] onFriendRequestCreated ERROR:", err);
    throw err;
  }
});
