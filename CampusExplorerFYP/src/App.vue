<script setup>
import Toasty from "./Toasty.vue";
</script>

<template>
  <RouterView />
  <div class="ui-overlay">
    <Toasty />
  </div>
</template>

<style scoped>
.ui-overlay {
  position: absolute;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
}
</style>
