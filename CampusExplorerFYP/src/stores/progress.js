import { defineStore } from "pinia";
import { campusAreas } from "@/config/campusAreas";
import { useUserDataStore } from "./userData";
import { useCampusLocs } from "./campusLocs";

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
        const data = await userData.fetchUserData(userId);
        await campusLocs.fetchLocations();
        if (!data) {
          this.cachedScores[userId] = 0;
          return 0;
        }

        const allLocations = campusLocs.locations;

        const pointsPerLocation = 10;
        const bonusPerCompletedArea = 30;

        let discoveredCount = 0;

        campusAreas.forEach((area) => {
          if (data[area.discoveryField]) {
            discoveredCount++;
          }
        });

        allLocations.forEach((location) => {
          if (location.discoveryField && data[location.discoveryField]) {
            discoveredCount++;
          }
        });

        let score = discoveredCount * pointsPerLocation;

        let completedAreas = 0;
        campusAreas.forEach((area) => {
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
    invalidateUserScore(userId) {
      if (userId && this.cachedScores[userId] != null) {
        delete this.cachedScores[userId];
      }
    },
  },
});
