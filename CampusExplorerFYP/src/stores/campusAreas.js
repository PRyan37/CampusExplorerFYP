import { defineStore } from "pinia";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/Firebase";

let unsub = null;

// this store manages the campus areas data from Firestore, including real-time updates and error handling
export const useCampusAreasStore = defineStore("campusAreas", {
  state: () => ({
    areas: [],
    loaded: false,
    loading: false,
    error: null,
  }),

  actions: {
    startListeningAreas() {
      console.log("[campusAreas] startListeningAreas called. Loaded:", this.loaded);
      // avoids duplicate listeners
      if (this.loaded){
        console.warn("[campusAreas] startListeningAreas called but areas are already loaded");
        return Promise.resolve();
      }

      this.loading = true;
      this.error = null;

      // promise is used so callers can await until the first batch of data is loaded
      return new Promise((resolve, reject) => {
        let firstSnapshot = true;

        // set up Firestore listener for campusAreas collection
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
    // cleanup listener and reset state when no longer needed (e.g. on logout)
    stopListeningAreas() {
      unsub?.();
      unsub = null;
      this.loaded = false;
    },
  },
});
