import { defineStore } from "pinia";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/Firebase";
import { useAuthStore } from "./auth";
import { useToastStore } from "./toast";
import { useFriendsStore } from "./friends";

let unsub = null;

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    inbox: [],
  }),

  actions: {
    start() {
      const auth = useAuthStore();
      const friendsStore = useFriendsStore();
      console.log("[notifications] start listener for user:", auth.user?.uid);
      if (!auth.user) return;

      const q = query(
        collection(db, "notifications", auth.user.uid, "inbox"),
        orderBy("createdAt", "desc"),
      );

      unsub?.();

      unsub = onSnapshot(q, (snap) => {
        console.log("[notifications] snapshot received, size:", snap.size);
        const prevFirst = this.inbox[0]?.id;
        this.inbox = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const newest = this.inbox[0];

        if (!newest) {
          console.log("[notifications] inbox empty");
          return;
        }

        if (newest.id === prevFirst) {
          console.log("[notifications] no new notifications");
          return;
        }

        console.log("[notifications] new notification:", newest);

        const toast = useToastStore();
        let toastType = "discovery";

        if (
          newest.type === "FRIEND_REQUEST" ||
          newest.type === "FRIEND_REQUEST_SENT" ||
          newest.type === "FRIEND_REQUEST_ACCEPTED"
        ) {
          toastType = "friendRequest";
        }
        if (newest.type === "FRIEND_REQUEST_ACCEPTED") {
          friendsStore.fetchFriends();
        }

        toast.show(newest.message, { type: toastType, duration: 5000 });
      });
    },

    stop() {
      console.log("[notifications] stopping listener");
      unsub?.();
      unsub = null;
      this.inbox = [];
    },
  },
});
