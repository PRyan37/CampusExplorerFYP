<script setup>
import LeafletMap from './LeafletMap.vue';
import { ref } from 'vue';

const sult = ref(false);
const sultActive = () => {
  sult.value = !sult.value;
};
</script>

<template>
  <h1>Campus Explorer</h1>
  <p>
    Welcome to Campus Explorer! This application helps you navigate and explore various campuses using an interactive map powered by Google Maps. Use the map to find buildings, facilities, and other points of interest on campus.
  </p>
    <div class="controls">
    <button @click="sultActive">Computer Science Building</button>
    <button @click="sultActive">Campus Cafeteria</button>
    <button @click="sultActive">Engineering Building</button>
    <button @click="sultActive">Sult</button>
  </div>
  <LeafletMap :sult="sult" />
</template>

<style scoped>
h1{
  text-align: center;
}
.controls {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}


</style>
