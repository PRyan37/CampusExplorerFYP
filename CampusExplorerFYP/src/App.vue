<script setup>
import Toast from "./Toast.vue";
</script>

<template>
  <RouterView />
  <div class="ui-overlay">
    <Toast />
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
