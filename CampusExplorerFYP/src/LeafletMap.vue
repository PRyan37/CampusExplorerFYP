<template>
  <audio ref="audioEl" :src="discoverySfx" preload="auto"></audio>
  <div class="ui-overlay">
    <Toast ref="toastRef" />
  </div>
  <div class="container-fluid py-3">
    <div class="row">
      <div class="col-12 col-md-3 mb-3">
        <div class="d-grid gap-2">
          <button class="btn btn-outline-danger btn-sm" @click="undiscoverAll">
            Reset Discoveries
          </button>
          <button class="btn btn-primary btn-sm" @click="getCurrentLocation">
            Center On My Location
          </button>
        </div>
      </div>

      <div class="col-12 col-md-9">
        <div id="map" ref="mapEl" class="leaflet-map"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import Toast from "./Toast.vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import beerImg from "./assets/BeerIcon.png";
import computerImg from "./assets/ComputerIcon.png";
import foodImg from "./assets/FoodIcon.png";
import engineeringImg from "./assets/EngineeringIcon.png";
import questionMarkImg from "./assets/QuestionMarkIcon.png";
import { useAuthStore } from "./stores/auth";
import { db } from "./firebase/Firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import discoverySfx from "./assets/sounds/discoverySound.mp3";

const auth = useAuthStore();
const toastRef = ref(null);

function onDiscoveryUnlocked(name) {
  playDiscoverySound();
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
  console.log("[LeafletMap] onDiscoveryUnlocked:", name);
  toastRef.value?.showToast(`You discovered: ${name}!`);
}
const mapEl = ref(null);
let map = null;
let clickHandler = null;

const defaultIcon = L.Icon.extend({
  options: {
    iconSize: [32, 32],
    shadowSize: [50, 64],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  },
});

const audioEl = ref(null);

function playDiscoverySound() {
  const a = audioEl.value;
  if (!a) return;

  a.currentTime = 0;
  a.play().catch((err) => {
    console.warn("Audio play blocked:", err);
  });
}
const unknownIcon = new defaultIcon({ iconUrl: questionMarkImg });

const discoveredIcons = {
  sult: new defaultIcon({ iconUrl: beerImg }),
  computerScienceBuilding: new defaultIcon({ iconUrl: computerImg }),
  anBhiaLann: new defaultIcon({ iconUrl: foodImg }),
  engineeringBuilding: new defaultIcon({ iconUrl: engineeringImg }),
};

let computerScienceBuildingMarker, anBhiaLannMarker, engineeringBuildingMarker, sultMarker;
let computerScienceBuildingDiscovered = false;
let anBhiaLannDiscovered = false;
let engineeringBuildingDiscovered = false;
let sultDiscovered = false;
let watchId = null;
let marker, circle, zoomed;

async function setDiscoveredOnUser(location) {
  if (!auth.user) return;

  try {
    const userRef = doc(db, "users", auth.user.uid);
    const timestampField = `${location}At`;
    await updateDoc(userRef, { [location]: true, [timestampField]: new Date() });
  } catch (e) {
    console.error("[LeafletMap] Failed to update discovery flag", location, e);
  }
}

async function discoverComputerScienceBuilding() {
  computerScienceBuildingMarker.setIcon(discoveredIcons.computerScienceBuilding);
  computerScienceBuildingDiscovered = true;
  await setDiscoveredOnUser("computerScienceBuildingDiscovered");
}

async function discoverAnBhiaLann() {
  anBhiaLannMarker.setIcon(discoveredIcons.anBhiaLann);
  anBhiaLannDiscovered = true;
  await setDiscoveredOnUser("anBhiaLannDiscovered");
}

async function discoverEngineeringBuilding() {
  engineeringBuildingMarker.setIcon(discoveredIcons.engineeringBuilding);
  engineeringBuildingDiscovered = true;
  await setDiscoveredOnUser("engineeringBuildingDiscovered");
}

async function discoverSult() {
  sultMarker.setIcon(discoveredIcons.sult);
  sultDiscovered = true;
  await setDiscoveredOnUser("sultDiscovered");
}
function getCurrentLocation() {
  console.log("[LeafletMap] getCurrentLocation clicked");

  if (!map) {
    console.warn("[LeafletMap] Map is not ready yet");
    return;
  }

  if (!("geolocation" in navigator)) {
    alert("Geolocation is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("[LeafletMap] getCurrentPosition success", position);
      success(position);
    },
    (err) => {
      console.error("[LeafletMap] getCurrentPosition error", err);
      error(err);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );
}

onMounted(async () => {
  await setUpMap();
});

async function initMapInstance() {
  await nextTick();
  setTimeout(() => {
    map.invalidateSize();
  }, 0);
  map = L.map(mapEl.value).setView([53.2803, -9.06], 15);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  computerScienceBuildingMarker = L.marker([53.28027348648772, -9.058721065521242], {
    icon: unknownIcon,
  })
    .addTo(map)
    .bindPopup("Computer Science Building");

  anBhiaLannMarker = L.marker([53.27984730218445, -9.060936570167543], { icon: unknownIcon })
    .addTo(map)
    .bindPopup("Campus Cafeteria");

  engineeringBuildingMarker = L.marker([53.283952206483185, -9.063854813575746], {
    icon: unknownIcon,
  })
    .addTo(map)
    .bindPopup("Engineering Building");

  sultMarker = L.marker([53.277980540805586, -9.05839115381241], { icon: unknownIcon })
    .addTo(map)
    .bindPopup("Come here for a beer!");
}
async function setUpMap() {
  await nextTick();
  if (!mapEl.value) return;
  initMapInstance();
  if (auth.user) {
    try {
      const userRef = doc(db, "users", auth.user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        computerScienceBuildingDiscovered = !!data.computerScienceBuildingDiscovered;
        anBhiaLannDiscovered = !!data.anBhiaLannDiscovered;
        engineeringBuildingDiscovered = !!data.engineeringBuildingDiscovered;
        sultDiscovered = !!data.sultDiscovered;
        if (computerScienceBuildingDiscovered)
          computerScienceBuildingMarker.setIcon(discoveredIcons.computerScienceBuilding);
        if (anBhiaLannDiscovered) anBhiaLannMarker.setIcon(discoveredIcons.anBhiaLann);
        if (engineeringBuildingDiscovered)
          engineeringBuildingMarker.setIcon(discoveredIcons.engineeringBuilding);
        if (sultDiscovered) sultMarker.setIcon(discoveredIcons.sult);
      }
    } catch (e) {
      console.error("[LeafletMap] Failed to load discovery state", e);
    }
  }

  clickHandler = (e) => {
    // e.latlng is a LatLng object {lat, lng}
    console.log("Map click:", e.latlng);
    success({ coords: { latitude: e.latlng.lat, longitude: e.latlng.lng, accuracy: 20 } });
  };
  map.on("click", clickHandler);

  if ("geolocation" in navigator) {
    watchId = navigator.geolocation.watchPosition(success, error);
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

async function undiscoverAll() {
  computerScienceBuildingDiscovered = false;
  anBhiaLannDiscovered = false;
  engineeringBuildingDiscovered = false;
  sultDiscovered = false;

  computerScienceBuildingMarker.setIcon(unknownIcon);
  anBhiaLannMarker.setIcon(unknownIcon);
  engineeringBuildingMarker.setIcon(unknownIcon);
  sultMarker.setIcon(unknownIcon);

  if (auth.user) {
    try {
      const userRef = doc(db, "users", auth.user.uid);
      await updateDoc(userRef, {
        computerScienceBuildingDiscovered: false,
        anBhiaLannDiscovered: false,
        engineeringBuildingDiscovered: false,
        sultDiscovered: false,
      });
    } catch (e) {
      console.error("[LeafletMap] Failed to reset discoveries", e);
    }
  }
}

function updateUserLocationMarker(latitude, longitude, accuracy = 20) {
  if (marker) {
    map.removeLayer(marker);
  }
  if (circle) {
    map.removeLayer(circle);
  }

  marker = L.marker([latitude, longitude]).addTo(map);
  circle = L.circle([latitude, longitude], { radius: accuracy }).addTo(map);

  if (!zoomed) {
    zoomed = map.fitBounds(circle.getBounds());
  }
  map.setView([latitude, longitude]);
}

async function success(position) {
  console.log("[LeafletMap] success", position);
  if (!map) return;
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const accuracy = 20;
  updateUserLocationMarker(latitude, longitude, accuracy);
  // 🔹 check discovery radius (~50m) around each POI
  const userLatLng = L.latLng(latitude, longitude);
  const discoverRadius = 50; // meters

  if (
    !computerScienceBuildingDiscovered &&
    userLatLng.distanceTo(computerScienceBuildingMarker.getLatLng()) <= discoverRadius
  ) {
    computerScienceBuildingDiscovered = true;
    computerScienceBuildingMarker.setIcon(discoveredIcons.computerScienceBuilding);
    await setDiscoveredOnUser("computerScienceBuildingDiscovered");
    onDiscoveryUnlocked("Computer Science Building");
  }

  if (
    !anBhiaLannDiscovered &&
    userLatLng.distanceTo(anBhiaLannMarker.getLatLng()) <= discoverRadius
  ) {
    anBhiaLannDiscovered = true;
    anBhiaLannMarker.setIcon(discoveredIcons.anBhiaLann);
    await setDiscoveredOnUser("anBhiaLannDiscovered");
    onDiscoveryUnlocked("An Bhia Lann");
  }

  if (
    !engineeringBuildingDiscovered &&
    userLatLng.distanceTo(engineeringBuildingMarker.getLatLng()) <= discoverRadius
  ) {
    engineeringBuildingDiscovered = true;
    engineeringBuildingMarker.setIcon(discoveredIcons.engineeringBuilding);
    await setDiscoveredOnUser("engineeringBuildingDiscovered");
    onDiscoveryUnlocked("Engineering Building");
  }

  if (!sultDiscovered && userLatLng.distanceTo(sultMarker.getLatLng()) <= discoverRadius) {
    sultDiscovered = true;
    sultMarker.setIcon(discoveredIcons.sult);
    await setDiscoveredOnUser("sultDiscovered");
    onDiscoveryUnlocked("Sult");
  }
}
function error(err) {
  if (err.code === 1) {
    alert("Please allow location access to use this feature.");
  } else {
    alert("Error retrieving location");
  }
}
onBeforeUnmount(() => {
  if (watchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (map) {
    if (clickHandler) {
      map.off("click", clickHandler);
    }
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
.ui-overlay {
  position: absolute;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
}

:deep(#map.leaflet-container) {
  height: 60vh;
  min-height: 400px;
  width: 100%;
}
</style>
