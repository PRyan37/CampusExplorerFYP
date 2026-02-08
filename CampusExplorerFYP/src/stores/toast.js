import { defineStore } from "pinia";

// Import sound files (Vite will bundle them)
import discoverySFX from "../assets/sounds/discoverySound.mp3";
import errorSFX from "../assets/sounds/errorSound.mp3";
import friendRequestSFX from "../assets/sounds/friendRequestSound.mp3";

// Pre-create Audio objects so you don't re-download/recreate each time
const sounds = {
  error: new Audio(errorSFX),
  friendRequest: new Audio(friendRequestSFX),
  discovery: new Audio(discoverySFX),
};

Object.values(sounds).forEach((a) => (a.preload = "auto"));

function playSound(type, enabled) {
  if (!enabled) return;

  const audio = sounds[type] || sounds.default;
  try {
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch((err) => {
        console.warn("[toast.store] sound blocked (needs user interaction)", err);
      });
    }
  } catch (e) {
    console.warn("[toast.store] sound play failed", e);
  }
}
export const useToastStore = defineStore("toast", {
  state: () => ({
    toasts: [],
    soundEnabled: true,
  }),

  actions: {
    /**
     * @param {string} message
     * @param {object} opts
     * @param {"error"|"friendRequest"|"discovery"} [opts.type]
     * @param {number} [opts.duration=10000]
     * @param {boolean} [opts.sound=true]
     */
    show(message, opts = {}) {
      const { type = "default", duration = 10000, sound = true } = opts;

      const id = Date.now() + Math.random();
      console.log("[toast.store] show()", { id, message, type, duration });

      // store the type too (useful for styling)
      this.toasts.push({ id, message, type });

      // play the right sound
      if (sound) playSound(type, this.soundEnabled);

      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
        console.log("[toast.store] removed toast id:", id);
      }, duration);
    },
    clearAll() {
      console.log("[toast.store] clearAll called. before:", this.toasts.length);
      this.toasts = [];
    },
  },
});
