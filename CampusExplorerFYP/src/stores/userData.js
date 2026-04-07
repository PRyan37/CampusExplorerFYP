import { defineStore } from "pinia";
import { db } from "@/firebase/Firebase";
import { doc, getDoc } from "firebase/firestore";

export const useUserDataStore = defineStore("userData", {
  state: () => ({
    cache: {}, // userId -> { data, loaded }
    loading: false,
    error: null,
  }),
  actions: {
    // if cached results exist return them, otherwise fetch from firestore and cache
    async fetchUserData(userId, force = false) {
      if (!userId) return null;

      const entry = this.cache[userId];
      if (entry && entry.loaded && !force) {
        console.log(`[userData] Cache hit for ${userId}`);
        return entry.data;
      }
      console.log(`[userData] Firestore read for ${userId} (force: ${force})`);

      this.loading = true;
      this.error = null;
      try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data() : null;

        this.cache[userId] = {
          data,
          loaded: true,
        };

        return data;
      } catch (e) {
        console.error("[userData] fetchUserData error", e);
        this.error = e.message || String(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
    // Invalidate user data cache for a specific userId used when we know data has changed and want to refetch next time
    invalidateUser(userId) {
      if (userId && this.cache[userId]) {
        delete this.cache[userId];
      }
    },
  },
});
