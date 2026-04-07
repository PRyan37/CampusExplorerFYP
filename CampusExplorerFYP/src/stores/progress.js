import { defineStore } from "pinia";
import { useUserDataStore } from "./userData";
import { useCampusLocs } from "./campusLocs";
import { useCampusAreasStore } from "./campusAreas";

export const useProgressStore = defineStore("progress", {
  state: () => ({
    score: 0,
    cachedScores: {}, // userId -> score
    error: null,
    loading: false,
  }),

  actions: {
    async calculateScoreForUser(userId, force = false) {
      console.log(`[progress] Calculating score for user ${userId} (force: ${force})`);
      if (!userId) {
        console.warn("[progress] No user ID provided, cannot calculate score.");
        return 0;
      }

      // Check cache first to avoid unnecessary calculations and Firestore reads
      if (this.cachedScores[userId] !== undefined && !force) {
        console.log(
          `[progress] Returning cached score for user ${userId}:`,
          this.cachedScores[userId],
        );
        return this.cachedScores[userId];
      }
      this.loading = true;
      this.error = null;

      try {
        const userData = useUserDataStore();
        const campusLocs = useCampusLocs();
        const campusAreas = useCampusAreasStore();

        // Ensure campus data is loaded before calculating score
        const data = await userData.fetchUserData(userId);
  
        if (!data) {
          this.cachedScores[userId] = 0;
          return 0;
        }

        const allLocations = campusLocs.locations;
        const pointsPerLocation = 10;
        const bonusPerCompletedArea = 30;

        let discoveredCount = 0;
        // Count discovered areas
        campusAreas.areas.forEach((area) => {
          if (data[area.discoveryField]) {
            discoveredCount++;
          }
        });
        // Count discovered locations
        allLocations.forEach((location) => {
          if (location.discoveryField && data[location.discoveryField]) {
            discoveredCount++;
          }
        });

        let score = discoveredCount * pointsPerLocation;

        let completedAreas = 0;
        // Check for completed areas (area discovered + all child locations discovered)
        campusAreas.areas.forEach((area) => {
          const children = allLocations.filter((loc) => loc.areaId === area.id);
          if (children.length === 0) return;

          const allChildrenDiscovered = children.every((loc) => !!data[loc.discoveryField]);

          const areaDiscovered = !!data[area.discoveryField];

          if (areaDiscovered && allChildrenDiscovered) {
            completedAreas++;
            console.log(`[progress] Area completed: ${area.name} (userId: ${userId})`);
          }
        });

        score += completedAreas * bonusPerCompletedArea;
        this.cachedScores[userId] = score;
        return score;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },
    // Invalidate cached score for a specific userId used when we know data has changed and want to recalculate next time
    invalidateUserScore(userId) {
      if (userId && this.cachedScores[userId] != null) {
        delete this.cachedScores[userId];
      }
    },
  },
});
