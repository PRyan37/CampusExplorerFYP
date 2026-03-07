import { defineStore } from "pinia";
import { db } from "../firebase/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { campusAreas } from "@/config/campusAreas";
import { campusIcons } from "@/config/campusIcons";

export const useProgressStore = defineStore("progress", {
  state: () => ({
    score: 0,
    error: null,
    loading: false,
  }),

  actions: {
    async calculateScoreForUser(userId) {
      this.loading = true;
      this.error = null;

      try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;

        const data = snap.data();

        const pointsPerLocation = 10;
        const bonusPerCompletedArea = 30;

        let discoveredCount = 0;

        campusAreas.forEach((area) => {
          if (data[area.discoveryField]) {
            discoveredCount++;
          }
        });

        campusIcons.forEach((icon) => {
          if (data[icon.discoveryField]) {
            discoveredCount++;
          }
        });

        let score = discoveredCount * pointsPerLocation;

        let completedAreas = 0;
        campusAreas.forEach((area) => {
          const children = campusIcons.filter((loc) => loc.areaId === area.id);
          if (children.length === 0) return;

          const allChildrenDiscovered = children.every((loc) => !!data[loc.discoveryField]);

          const areaDiscovered = !!data[area.discoveryField];

          if (areaDiscovered && allChildrenDiscovered) {
            completedAreas++;
          }
        });

        score += completedAreas * bonusPerCompletedArea;

        return score;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
