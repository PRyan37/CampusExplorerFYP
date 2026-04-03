import { defineStore } from "pinia";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/Firebase";

let unsub = null;

export const useCampusAreasStore = defineStore("campusAreas", {
  state: () => ({
    areas: [],
    loaded: false,
    loading: false,
    error: null,
  }),

  actions: {
    startListeningAreas() {
      if (this.loaded) return Promise.resolve();

      this.loading = true;
      this.error = null;

      return new Promise((resolve, reject) => {
        let firstSnapshot = true;

        unsub = onSnapshot(
          collection(db, "campusAreas"),
          (snapshot) => {
            this.areas = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                polygon: (data.polygon || []).map((p) => [p.lat, p.lng]),
              };
            });
            this.loaded = true;
            this.loading = false;
            if (firstSnapshot) {
              firstSnapshot = false;
              resolve();
            }
          },
          (e) => {
            console.error("[campusAreas] onSnapshot failed:", e);
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
    stopListeningAreas() {
      unsub?.();
      unsub = null;
      this.loaded = false;
    },
  },
});
