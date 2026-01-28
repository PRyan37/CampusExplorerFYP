<template>
    <h1>Leaflet Map</h1>

    <div id="map" ref="mapEl"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import beerImg from "./assets/BeerIcon.png";
import computerImg from "./assets/ComputerIcon.png";
import foodImg from "./assets/FoodIcon.png";
import engineeringImg from "./assets/EngineeringIcon.png";

const mapEl = ref(null);
let map = null;

const defaultIcon = L.Icon.extend({
    options: {
        iconSize: [32, 32],
        shadowSize: [50, 64],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    },
});

const discoveredIcons = {
    beer: new defaultIcon({ iconUrl: beerImg }),
    computer: new defaultIcon({ iconUrl: computerImg }),
    food: new defaultIcon({ iconUrl: foodImg }),
    engineering: new defaultIcon({ iconUrl: engineeringImg }),
};

onMounted(async () => {
    await nextTick();
    if (!mapEl.value) return;

    map = L.map(mapEl.value).setView([53.2803, -9.06], 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    L.marker([53.28027348648772, -9.058721065521242], { icon: discoveredIcons.computer })
        .addTo(map)
        .bindPopup("Computer Science Building");
    L.marker([53.27984730218445, -9.060936570167543], { icon: discoveredIcons.food })
        .addTo(map)
        .bindPopup("Campus Cafeteria");
    L.marker([53.283952206483185, -9.063854813575746], { icon: discoveredIcons.engineering })
        .addTo(map)
        .bindPopup("Engineering Building");
    L.marker([53.277980540805586, -9.05839115381241], { icon: discoveredIcons.beer })
        .addTo(map)
        .bindPopup("Come here for a beer!");
});

onBeforeUnmount(() => {
    if (map) {
        map.remove();
        map = null;
    }
});
</script>

<style scoped></style>
