<template>
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
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import beerImg from "./assets/BeerIcon.png";
import computerImg from "./assets/ComputerIcon.png";
import foodImg from "./assets/FoodIcon.png";
import engineeringImg from "./assets/EngineeringIcon.png";
import questionMarkImg from "./assets/QuestionMarkIcon.png";
import bookImg from "./assets/BookIcon.png";
import gymImg from "./assets/GymIcon.png";
import { useAuthStore } from "./stores/auth";
import { db } from "./firebase/Firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useToastStore } from "./stores/toast";
import { campusLocations } from "./config/campusLocations";

const auth = useAuthStore();
const toast = useToastStore();

function onDiscoveryUnlocked(name) {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
  console.log("[LeafletMap] onDiscoveryUnlocked:", name);
  toast.show(`You discovered: ${name}!`, { type: "discovery", duration: 5000 });
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

const unknownIcon = new defaultIcon({ iconUrl: questionMarkImg });

const discoveredIcons = {
  sult: new defaultIcon({ iconUrl: beerImg }),
  computerScienceBuilding: new defaultIcon({ iconUrl: computerImg }),
  anBhiaLann: new defaultIcon({ iconUrl: foodImg }),
  engineeringBuilding: new defaultIcon({ iconUrl: engineeringImg }),
  baileyAllen: new defaultIcon({ iconUrl: bookImg }),
  kingfisher: new defaultIcon({ iconUrl: gymImg }),
};

const discoveryFlags = {
  computerScienceBuildingDiscovered: false,
  anBhiaLannDiscovered: false,
  engineeringBuildingDiscovered: false,
  sultDiscovered: false,
  baileyAllenDiscovered: false,
  kingfisherDiscovered: false,
};

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
      map.setView([position.coords.latitude, position.coords.longitude]);
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
const markersById = {};
//add markers
function addMarker(location, icon = unknownIcon) {
  console.log("[LeafletMap] Adding marker:", location.name, location.coords);
  const marker = L.marker(location.coords, { icon }).addTo(map).bindPopup(location.name);

  markersById[location.id] = marker;
  return marker;
}

//setup map and markers
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

  campusLocations.forEach((location) => addMarker(location));
}
function setMarkerIcon(id, icon) {
  const marker = markersById[id]; // or markersById.get(id)
  if (!marker) {
    console.warn(`[LeafletMap] Marker not found for id: ${id}`);
    return;
  }
  marker.setIcon(icon);
}
async function setUpMap() {
  await nextTick();
  if (!mapEl.value) return;
  await initMapInstance();

  if (auth.user) {
    try {
      const userRef = doc(db, "users", auth.user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();

        campusLocations.forEach((loc) => {
          const flag = !!data[loc.discoveryField];
          discoveryFlags[loc.discoveryField] = flag;
          if (flag) {
            setMarkerIcon(loc.id, discoveredIcons[loc.iconKey]);
          }
        });
      }
    } catch (e) {
      console.error("[LeafletMap] Failed to load discovery state", e);
    }
  }

  clickHandler = (e) => {
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
  campusLocations.forEach((loc) => {
    discoveryFlags[loc.discoveryField] = false;
    setMarkerIcon(loc.id, unknownIcon);
  });

  if (auth.user) {
    try {
      const userRef = doc(db, "users", auth.user.uid);
      const reset = {};
      campusLocations.forEach((loc) => {
        reset[loc.discoveryField] = false;
      });
      await updateDoc(userRef, reset);
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
}
async function success(position) {
  console.log("[LeafletMap] success", position);
  if (!map) return;

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const accuracy = 20;
  updateUserLocationMarker(latitude, longitude, accuracy);

  const userLatLng = L.latLng(latitude, longitude);
  const discoverRadius = 50; // meters

  for (const loc of campusLocations) {
    const marker = markersById[loc.id];
    if (
      !marker ||
      discoveryFlags[loc.discoveryField] ||
      userLatLng.distanceTo(marker.getLatLng()) > discoverRadius
    ) {
      continue;
    }

    // mark as discovered
    discoveryFlags[loc.discoveryField] = true;
    setMarkerIcon(loc.id, discoveredIcons[loc.iconKey]);
    await setDiscoveredOnUser(loc.discoveryField);
    onDiscoveryUnlocked(loc.displayName);
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
:deep(#map.leaflet-container) {
  height: 60vh;
  min-height: 400px;
  width: 100%;
}
</style>
