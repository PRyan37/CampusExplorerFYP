import { defineStore } from "pinia";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/Firebase";

export const useCampusLocs = defineStore("campusLocations", {
  state: () => ({
    locations: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchLocations() {
      this.loading = true;
      this.error = null;

      try {
        const snapshot = await getDocs(collection(db, "campusLocations"));
        this.locations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("[campusLocs]Campus locations fetched:", this.locations);
      } catch (e) {
        console.error("[campusLocs] fetchLocations failed:", e);
        this.error = e.message || String(e);
      } finally {
        this.loading = false;
      }
    },
  },
});
