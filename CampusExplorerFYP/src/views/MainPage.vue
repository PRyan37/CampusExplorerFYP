<script setup>
import LeafletMap from "../LeafletMap.vue";

import TopBar from "../TopBar.vue";
</script>

<template>
  <!-- The main page of the app, which contains the map and the top bar. -->
  <div class="main-page">
    <TopBar />
    <div class="map-page-content">
      <LeafletMap />
    </div>
  </div>
</template>

<style scoped>
.main-page {
  position: fixed;
  inset: 0;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overscroll-behavior: none;
}

.map-page-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
