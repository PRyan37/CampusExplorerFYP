import { createApp } from "vue";
import { createPinia } from "pinia";
import { useAuthStore } from "./stores/auth";
import App from "./App.vue";
import router from "./router";

import "bootstrap/dist/css/bootstrap.min.css";

const app = createApp(App);
app.config.devtools = false;
app.use(createPinia());

// initialize Firebase auth listener before mounting
const authStore = useAuthStore();
authStore.init();
app.use(router);
router.isReady().then(() => {
  app.mount("#app");
});
