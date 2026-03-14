<script setup>
import LeafletMap from "../LeafletMap.vue";

import TopBar from "../TopBar.vue";
</script>

<template>
  <div class="main-page">
    <TopBar />
    <div class="map-page-content">
      <LeafletMap />
    </div>
  </div>
</template>

<style scoped>
.main-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-page-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
