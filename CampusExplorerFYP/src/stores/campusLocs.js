import { defineStore } from "pinia";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/Firebase";

let unsub = null;

// this store manages the campus locations data from Firestore, including real-time updates and error handling
export const useCampusLocs = defineStore("campusLocations", {
  state: () => ({
    locations: [],
    loaded: false,
    loading: false,
    error: null,
  }),

  actions: {
    startListeningLocations() {
      // avoids duplicate listeners
      console.log("[campusLocs] startListeningLocations called. Loaded:", this.loaded);
      if (this.loaded){
        console.warn("[campusLocs] startListeningLocations called but locations are already loaded");
        return Promise.resolve();
      } 

      this.loading = true;
      this.error = null;

      // promise is used so callers can await until the first batch of data is loaded
      return new Promise((resolve, reject) => {
        let firstSnapshot = true;

        // set up Firestore listener for campusLocations collection
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
    // cleanup listener and reset state when no longer needed (e.g. on logout)
     stopListeningLocations() {
      unsub?.();
      unsub = null;
      this.loaded = false;
    },
  },
});
