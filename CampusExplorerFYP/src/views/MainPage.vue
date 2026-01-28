<script setup>
import LeafletMap from "../LeafletMap.vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import TopBar from "../TopBar.vue";

const auth = useAuthStore();
const router = useRouter();

async function logout() {
  console.log("LOG OUT1: ", auth.isAuthenticated);
  await auth.logout();
  router.push("/login");
  console.log("LOG OUT2: ", auth.isAuthenticated);
}
</script>

<template>
  <TopBar />
  <div class="container-fluid mt-2 main-page">
    <div class="row align-items-center">
      <div class="col-12 col-md-8 text-center">
        <h1 class="h3 mb-0">Campus Explorer</h1>
      </div>
      <div class="col-12 col-md-4">
        <div class="d-flex justify-content-end mt-2 mt-md-0">
          <button @click="logout">Logout</button>
        </div>
      </div>
    </div>
    <div class="map-wrapper">
      <LeafletMap />
    </div>
  </div>
</template>

<style scoped>
.app-root {
  margin: 0;
  padding: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-page {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
}

.map-wrapper {
  flex: 1 1 auto;
  min-height: 0;
  /* important */
}

.controls {
  justify-content: flex-end;
  display: flex;
  gap: 8px;

  margin: 12px 0;
}
</style>
