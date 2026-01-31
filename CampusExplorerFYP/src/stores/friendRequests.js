import { defineStore } from "pinia";
import { db } from "../firebase/Firebase";
import { useAuthStore } from "./auth";
import { useFriendsStore } from "./friends";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export const useFriendRequestsStore = defineStore("friendRequests", {
  state: () => ({
    incomingRequests: [],
    outgoingRequests: [],
    loading: false,
    error: null,
  }),
  getters: {
    incomingCount: (state) => state.incomingRequests.length,
    hasIncoming: (state) => state.incomingRequests.length > 0,
  },
  actions: {
    async subscribeIncomingRequests() {
      console.log("[friendRequests] Subscribing to incoming friend requests..");

      const auth = useAuthStore();
      console.log("[friendRequests] auth.user:", auth.user);

      if (!auth.user) {
        console.warn("[friendRequests] no auth.user, cannot subscribe");
        return;
      }

      if (this._unsubIncoming) {
        this._unsubIncoming();
        this._unsubIncoming = null;
      }

      this.loading = true;
      this.error = null;

      try {
        const incomingRequestRef = collection(db, "friendRequests");
        const q = query(
          incomingRequestRef,
          where("toUserId", "==", auth.user.uid),
          orderBy("timestamp", "desc"),
        );

        console.log("[friendRequests] query prepared:", q);

        this._unsubIncoming = onSnapshot(
          q,
          (snapshot) => {
            console.log("[friendRequests] snapshot received. docs:", snapshot.docs.length);
            snapshot.docChanges().forEach((change) => {
              console.log("[friendRequests] change", change.type, change.doc.id, change.doc.data());
              if (change.type === "added") {
                // debug action on added
                console.log(
                  "[friendRequests] NEW incoming request from:",
                  change.doc.data().fromEmail,
                );
              }
            });

            this.incomingRequests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            this.loading = false;
          },
          (err) => {
            console.error("[friendRequests] onSnapshot error:", err);
            this.error = err.message || String(err);
            this.loading = false;
          },
        );

        // fallback: also subscribe to the whole collection for debugging only (remove in production)
        this._unsubDebugAll = onSnapshot(
          incomingRequestRef,
          (snapAll) => {
            console.log("[friendRequests] DEBUG all docs count:", snapAll.docs.length);
          },
          (e) => console.error("[friendRequests] DEBUG all onSnapshot error:", e),
        );

        console.log("[friendRequests] subscribed, waiting for changes...");
      } catch (e) {
        console.error("[friendRequests] subscribe error:", e);
        this.loading = false;
        this.error = e.message || String(e);
      }
    },
    unsubscribeIncomingRequests() {
      console.log("[friendRequests.js] Unsubscribing from incoming friend requests...");
      if (this._unsubIncoming) {
        this._unsubIncoming();
        this._unsubIncoming = null;
      }
    },
    async fetchIncomingRequests() {
      console.log("[friendRequests.js] Fetching incoming friend requests...");
      const auth = useAuthStore();
      if (!auth.user) return;
      this.loading = true;
      this.error = null;
      try {
        const incomingRequestRef = collection(db, "friendRequests");
        const q = query(incomingRequestRef, where("toUserId", "==", auth.user.uid));
        const snapshot = await getDocs(q);
        this.incomingRequests = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
        console.log("[friendRequests.js] Incoming friend requests fetched:", this.incomingRequests);
      }
    },
    async fetchOutgoingRequests() {
      const auth = useAuthStore();
      if (!auth.user) return;
      this.loading = true;
      this.error = null;

      try {
        const outgoingRequestRef = collection(db, "friendRequests");
        const q = query(outgoingRequestRef, where("fromUserId", "==", auth.user.uid));
        const snapshot = await getDocs(q);
        this.outgoingRequests = snapshot.docs.map((doc) => doc.data());
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    async sendFriendRequest(toEmail) {
      console.log("[friendRequests.js]Sending friend request to:", toEmail);
      const auth = useAuthStore();
      if (!auth.user) return;
      this.loading = true;
      this.error = null;

      const usersRef = collection(db, "users");
      const qUser = query(usersRef, where("email", "==", toEmail));
      const snapUser = await getDocs(qUser);

      if (snapUser.empty) {
        throw new Error("No user found with that email");
      }
      const friendDoc = snapUser.docs[0];
      const toUserId = friendDoc.id;
      try {
        const outgoingRequestRef = collection(db, "friendRequests");
        await addDoc(outgoingRequestRef, {
          fromUserId: auth.user.uid,
          fromEmail: auth.user.email,
          status: "pending",
          toUserId: toUserId,
          toEmail,
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    async acceptFriendRequest(requestId) {
      console.log("[friendRequests.js] Accepting friend request:", requestId);
      const auth = useAuthStore();
      if (!auth.user) return;
      this.loading = true;
      this.error = null;
      const friendsStore = useFriendsStore();
      const req = this.incomingRequests.find((r) => r.id === requestId);
      if (!req) {
        console.warn("[friendRequests.js] Request not found in state:", requestId);
        return;
      }
      try {
        await friendsStore.addFriend(req.fromUserId, req.fromEmail);
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
        const requestDocRef = doc(db, "friendRequests", requestId);
        await deleteDoc(requestDocRef);
      }
    },
    async rejectFriendRequest(requestId) {
      const auth = useAuthStore();
      if (!auth.user) return;
      this.loading = true;
      this.error = null;

      try {
        const requestDocRef = doc(db, "friendRequests", requestId);
        await deleteDoc(requestDocRef);
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
        this.fetchIncomingRequests();
        this.fetchOutgoingRequests();
      }
    },
  },
});
