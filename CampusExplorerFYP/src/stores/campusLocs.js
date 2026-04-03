import { defineStore } from "pinia";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/Firebase";

let unsub = null;

export const useCampusLocs = defineStore("campusLocations", {
  state: () => ({
    locations: [],
    loaded: false,
    loading: false,
    error: null,
  }),

  actions: {
     startListeningLocations() {
  if (this.loaded) return Promise.resolve();

      this.loading = true;
      this.error = null;

      return new Promise((resolve, reject) => {
        let firstSnapshot = true;

        unsub = onSnapshot(
          collection(db, "campusLocations"),
          (snapshot) => {
            this.locations = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            this.loaded = true;
            this.loading = false;
            if (firstSnapshot) {
              firstSnapshot = false;
              resolve();
            }
          },
          (e) => {
            console.error("[campusLocs] onSnapshot failed:", e);
            this.error = e.message || String(e);
            this.loading = false;
            if (firstSnapshot) {
              firstSnapshot = false;
              reject(e);
            }
          },
        );
      });
    },
     stopListeningLocations() {
      unsub?.();
      unsub = null;
      this.loaded = false;
    },
  },
});
