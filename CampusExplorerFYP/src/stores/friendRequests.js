import { defineStore } from "pinia";
import { db } from "../firebase/Firebase";
import { useAuthStore } from "./auth";
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebase/Firebase";
const functions = getFunctions(app);

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
      this.loading = true;
      this.error = null;
      const auth = useAuthStore();
      if (!auth.user) return;
      try {
        const call = httpsCallable(functions, "sendFriendRequest");
        await call({ toEmail });
      } catch (e) {
        this.error = e.message || String(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async acceptFriendRequest(requestId) {
      this.loading = true;
      this.error = null;
      const auth = useAuthStore();
      if (!auth.user) return;
      try {
        const call = httpsCallable(functions, "respondToFriendRequest");
        await call({ requestId, action: "accept" });
      } catch (e) {
        this.error = e.message || String(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async rejectFriendRequest(requestId) {
      this.loading = true;
      this.error = null;
      const auth = useAuthStore();
      if (!auth.user) return;
      try {
        const call = httpsCallable(functions, "respondToFriendRequest");
        await call({ requestId, action: "reject" });
      } catch (e) {
        this.error = e.message || String(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
