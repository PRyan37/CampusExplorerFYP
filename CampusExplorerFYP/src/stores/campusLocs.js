import { defineStore } from "pinia";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/Firebase";

export const useCampusLocs = defineStore("campusLocations", {
  state: () => ({
    locations: [],
    loaded: false,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchLocations(force = false) {
      if (this.loaded && !force) {
        console.log("[campusLocs] Locations already loaded, skipping fetch.");
        return;
      }
      this.loading = true;
      this.error = null;

      try {
        const snapshot = await getDocs(collection(db, "campusLocations"));
        this.locations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        this.loaded = true;
        console.log("[campusLocs] Campus locations fetched:", this.locations);
      } catch (e) {
        console.error("[campusLocs] fetchLocations failed:", e);
        this.error = e.message || String(e);
      } finally {
        this.loading = false;
      }
    },
  },
});
