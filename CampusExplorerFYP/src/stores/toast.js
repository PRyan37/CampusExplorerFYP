import { defineStore } from "pinia";

export const useToastStore = defineStore("toast", {
  state: () => ({
    toasts: [],
  }),

  actions: {
    show(message, duration = 10000) {
      const id = Date.now() + Math.random();
      console.log("[toast.store] show()", { id, message, duration });
      this.toasts.push({ id, message });

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
