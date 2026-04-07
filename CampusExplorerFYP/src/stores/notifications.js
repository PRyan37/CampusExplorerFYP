import { defineStore } from "pinia";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db,app } from "@/firebase/Firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuthStore } from "./auth";
import { useToastStore } from "./toast";
import { useFriendsStore } from "./friends";
import { useUserDataStore } from "./userData";
import { useProgressStore } from "./progress";

let unsub = null;
const deleteNotificationCall = httpsCallable(getFunctions(app), "deleteNotification");
let initialLoadDone = false;

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    inbox: [],
  }),

  actions: {
    start() {
      const auth = useAuthStore();
      const friendsStore = useFriendsStore();
      const userDataStore = useUserDataStore();
      const progressStore = useProgressStore();

      console.log("[notifications] start listener for user:", auth.user?.uid);
      if (!auth.user) return;

      const q = query(
        collection(db, "notifications", auth.user.uid, "inbox"),
        orderBy("createdAt", "desc"),
        limit(20),
      );
      // clean up any existing listener before setting up a new one to avoid duplicates
      unsub?.();
// set up Firestore listener for notifications collection
      unsub = onSnapshot(q, (snap) => {
        console.log("[notifications] snapshot received, size:", snap.size);
        const prevFirst = this.inbox[0]?.id;
        this.inbox = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const newest = this.inbox[0];

        if (!newest) {
          console.log("[notifications] inbox empty");
          return;
        }
          let toastType = "discovery";
           const toast = useToastStore();
        if (!initialLoadDone) {
          console.log("[notifications] initial load, showing toast for most recent notification only");
          initialLoadDone = true;
          // process newest for cache invalidation
          if (newest.type === "FRIEND_DISCOVERY" && newest.fromUserId) {
            userDataStore.invalidateUser(newest.fromUserId);
            progressStore.invalidateUserScore(newest.fromUserId);
          }
          if (newest.type === "FRIEND_REQUEST_ACCEPTED") {
            friendsStore.fetchFriends();
          }
          toast.show(newest.message, { type: toastType, duration: 5000 });
          // delete ALL silently — no cascade
          this.inbox.forEach(n => deleteNotificationCall({ notifId: n.id }));
          return;
        }

        if (newest.id === prevFirst) {
          console.log("[notifications] no new notifications");
          return;
        }

        console.log("[notifications] new notification:", newest);

        if (newest.type === "FRIEND_DISCOVERY" && newest.fromUserId) {
          console.log(
            "[notifications] invalidating caches for friend discovery from",
            newest.fromUserId,
          );
          userDataStore.invalidateUser(newest.fromUserId);
          progressStore.invalidateUserScore(newest.fromUserId);
        }

     
      

        if (
          newest.type === "FRIEND_REQUEST" ||
          newest.type === "FRIEND_REQUEST_SENT" ||
          newest.type === "FRIEND_REQUEST_ACCEPTED"
        ) {
          toastType = "friendRequest";
        }
        if (newest.type === "FRIEND_REQUEST_ACCEPTED") {
          console.log("[notifications] fetching friends after friend request accepted");
          friendsStore.fetchFriends();
        }

        toast.show(newest.message, { type: toastType, duration: 5000 });
        try {
          deleteNotificationCall({ notifId: newest.id });
          console.log("[notifications] requested deletion of notification id:", newest.id);
        } catch (error) {
          console.error("[notifications] failed to delete notification:", error);
        }
      });
    },

    stop() {
      console.log("[notifications] stopping listener");
      unsub?.();
      unsub = null;
      this.inbox = [];
      initialLoadDone = false;
    },
  },
});
