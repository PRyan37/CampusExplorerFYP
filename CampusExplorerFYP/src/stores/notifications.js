import { defineStore } from "pinia";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/Firebase";
import { useAuthStore } from "./auth";
import { useToastStore } from "./toast";

let unsub = null; // module‑level, shared by this store

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    items: [],
  }),

  actions: {
    start() {
      const auth = useAuthStore();
      console.log("[notifications] start listener for user:", auth.user?.uid);
      if (!auth.user) return;

      const q = query(
        collection(db, "notifications", auth.user.uid, "items"),
        orderBy("createdAt", "desc"),
      );

      // unsubscribe if already subscribed
      unsub?.();

      unsub = onSnapshot(q, (snap) => {
        const prevFirst = this.items[0]?.id;
        this.items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const newest = this.items[0];
        if (newest && newest.id !== prevFirst) {
          console.log("[notifications] calling toast for:", newest.message);
          useToastStore().show(newest.message, { type: "friendRequest", duration: 5000 });
        }
      });
    },

    stop() {
      unsub?.();
      unsub = null;
      this.items = [];
    },
  },
});
