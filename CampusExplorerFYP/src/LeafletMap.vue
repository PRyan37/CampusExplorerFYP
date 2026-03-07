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
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import beerImg from "./assets/BeerIcon.png";
import computerImg from "./assets/ComputerIcon.png";
import foodImg from "./assets/FoodIcon.png";
import engineeringImg from "./assets/EngineeringIcon.png";
import questionMarkImg from "./assets/QuestionMarkIcon.png";
import bookImg from "./assets/BookIcon.png";
import gymImg from "./assets/GymIcon.png";
import sportsImg from "./assets/SportsIcon.png";
import socialImg from "./assets/SocialIcon.png";
import healthImg from "./assets/HealthIcon.png";
import dramaImg from "./assets/DramaIcon.png";
import bankImg from "./assets/BankIcon.png";
import shopImg from "./assets/ShopIcon.png";
import accomImg from "./assets/AccomIcon.png";
import { useAuthStore } from "./stores/auth";
import { db } from "./firebase/Firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useToastStore } from "./stores/toast";
import { campusIcons } from "./config/campusIcons";
import { campusAreas } from "./config/campusAreas";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase/Firebase";

const auth = useAuthStore();
const toast = useToastStore();
const functions = getFunctions(app);
const markDiscoveredCall = httpsCallable(functions, "markDiscovered");

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

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
  gaaPitches: new defaultIcon({ iconUrl: sportsImg }),
  theHub: new defaultIcon({ iconUrl: socialImg }),
  healthCentre: new defaultIcon({ iconUrl: healthImg }),
  humanBiologyBuilding: new defaultIcon({ iconUrl: bookImg }),
  arasUiChathail: new defaultIcon({ iconUrl: bookImg }),
  mailServicesCenter: new defaultIcon({ iconUrl: bookImg }),
  dramaCenter: new defaultIcon({ iconUrl: dramaImg }),
  orbsenBuilding: new defaultIcon({ iconUrl: bookImg }),
  boi: new defaultIcon({ iconUrl: bankImg }),
  smokeys: new defaultIcon({ iconUrl: foodImg }),
  studentUnionShop: new defaultIcon({ iconUrl: shopImg }),
  jamesHardimanLibrary: new defaultIcon({ iconUrl: bookImg }),
  artsMillenniumBuilding: new defaultIcon({ iconUrl: bookImg }),
  corribVillage: new defaultIcon({ iconUrl: accomImg }),
  dunlinVillage: new defaultIcon({ iconUrl: accomImg }),
};

const discoveryFlags = {
  computerScienceBuildingDiscovered: false,
  anBhiaLannDiscovered: false,
  engineeringBuildingDiscovered: false,
  sultDiscovered: false,
  baileyAllenDiscovered: false,
  kingfisherDiscovered: false,
  gaaPitchesDiscovered: false,
  danganDiscovered: false,
  southBuildingsDiscovered: false,
  theHubDiscovered: false,
  healthCentreDiscovered: false,
  humanBiologyBuildingDiscovered: false,
  arasUiChathailDiscovered: false,
  mailServicesCenterDiscovered: false,
  dramaCenterDiscovered: false,
  orbsenBuildingDiscovered: false,
  boiDiscovered: false,
  smokeysDiscovered: false,
  concourseDiscovered: false,
  centralCampusDiscovered: false,
  studentUnionShopDiscovered: false,
  jamesHardimanLibraryDiscovered: false,
  artsMillenniumBuildingDiscovered: false,
  northCampusDiscovered: false,
  studentAccomDiscovered: false,
  corribVillageDiscovered: false,
  dunlinVillageDiscovered: false,
};

let watchId = null;
let marker, circle, zoomed;

async function setDiscoveredOnUser({ discoveryField, displayName }) {
  if (!auth.user) return;

  try {
    await markDiscoveredCall({ discoveryField, displayName });
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
const areaShapesById = {};
//add markers
function addMarker(location, icon = unknownIcon) {
  const marker = L.marker(location.coords, { icon }).addTo(map).bindPopup(location.displayName);

  markersById[location.id] = marker;

  // hide markers in undiscovered areas
  if (location.areaId && !discoveryFlags[location.areaId + "Discovered"]) {
    marker.setOpacity(0); // invisible but present
  }

  return marker;
}

//setup map and markers
async function initMapInstance() {
  await nextTick();
  if (map) return;

  map = L.map(mapEl.value).setView([53.2803, -9.06], 15);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // add all areas and icons
  campusAreas.forEach((area) => {
    const poly = L.polygon(area.polygon, {
      color: area.color ?? "#1e90ff",
      fillColor: area.fillColor ?? area.color ?? "#1e90ff",
      fillOpacity: area.fillOpacity ?? 0.15,
      weight: 2,
    }).addTo(map);
    areaShapesById[area.id] = poly;
  });

  campusIcons.forEach((location) => addMarker(location));

  setTimeout(() => {
    map.invalidateSize();
  }, 0);
}
function setMarkerIcon(id, icon) {
  const marker = markersById[id];
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

        // sync discovery state from Firestore to map
        campusAreas.forEach((area) => {
          const field = area.discoveryField;
          const flag = !!data[field];
          discoveryFlags[field] = flag;

          if (flag) {
            const shape = areaShapesById[area.id];
            if (shape) {
              shape.setStyle({
                color: area.discoveredColor ?? area.color ?? "#1e90ff",
                fillOpacity: area.discoveredFillOpacity ?? 0,
              });
            }
          }
        });

        campusIcons.forEach((loc) => {
          const flag = !!data[loc.discoveryField];
          discoveryFlags[loc.discoveryField] = flag;
          const marker = markersById[loc.id];
          if (!marker) return;

          if (flag) {
            setMarkerIcon(loc.id, discoveredIcons[loc.id]);
            marker.setOpacity(1);
          } else if (loc.areaId) {
            const areaField = loc.areaId + "Discovered";
            const areaDiscovered = !!data[areaField];
            marker.setOpacity(areaDiscovered ? 1 : 0);
          } else {
            marker.setOpacity(1);
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
  // 1) reset all location flags and icons
  campusIcons.forEach((loc) => {
    discoveryFlags[loc.discoveryField] = false;
    setMarkerIcon(loc.id, unknownIcon);

    const marker = markersById[loc.id];
    if (!marker) return;

    // icons inside an area should go back to hidden
    if (loc.areaId) {
      marker.setOpacity(0);
    } else {
      // standalone icons stay visible but undiscovered
      marker.setOpacity(1);
    }
  });

  campusAreas.forEach((area) => {
    discoveryFlags[area.discoveryField] = false;

    let shape = areaShapesById[area.id];
    // recreate area polygon if missing
    if (!shape && map) {
      const poly = L.polygon(area.polygon, {
        color: area.color ?? "#1e90ff",
        fillColor: area.fillColor ?? area.color ?? "#1e90ff",
        fillOpacity: area.fillOpacity ?? 0.15,
        weight: 2,
      }).addTo(map);
      areaShapesById[area.id] = poly;
    }
    if (shape) {
      shape.setStyle({
        color: area.color ?? "#1e90ff",
        fillColor: area.fillColor ?? area.color ?? "#1e90ff",
        fillOpacity: area.fillOpacity ?? 0.15,
      });
    }
  });
  if (auth.user) {
    try {
      const userRef = doc(db, "users", auth.user.uid);
      const reset = {};
      //set all location and area discovery fields to false and remove timestamps
      campusIcons.forEach((loc) => {
        reset[loc.discoveryField] = false;
        reset[loc.discoveryField + "At"] = null;
      });

      campusAreas.forEach((area) => {
        reset[area.discoveryField] = false;
        reset[area.discoveryField + "At"] = null;
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
  if (!map) return;

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const accuracy = 20;
  updateUserLocationMarker(latitude, longitude, accuracy);

  const userLatLng = L.latLng(latitude, longitude);

  // 1) AREA DISCOVERY
  for (const area of campusAreas) {
    const field = area.discoveryField;
    if (discoveryFlags[field]) continue;

    const shape = areaShapesById[area.id];
    if (!shape) continue;

    //is user inside area
    if (shape.getBounds().contains(userLatLng)) {
      // mark area discovered
      discoveryFlags[field] = true;

      shape.setStyle({
        color: area.discoveredColor ?? area.color ?? "#1e90ff",
        fillOpacity: area.discoveredFillOpacity ?? 0,
      });

      // reveal any markers that belong to this area
      campusIcons.forEach((loc) => {
        if (loc.areaId === area.id) {
          const marker = markersById[loc.id];
          if (marker && !discoveryFlags[loc.discoveryField]) {
            marker.setOpacity(1); // now visible but still "undiscovered" icon
          }
        }
      });

      await setDiscoveredOnUser({ discoveryField: field, displayName: area.displayName });
      onDiscoveryUnlocked(area.displayName);
    }
  }

  // 2) Individual locations
  for (const loc of campusIcons) {
    const marker = markersById[loc.id];
    if (!marker) continue;

    // if this location is inside an area, only allow discovery after area is discovered
    if (loc.areaId) {
      const areaField = loc.areaId + "Discovered";
      if (!discoveryFlags[areaField]) continue;
    }

    if (discoveryFlags[loc.discoveryField]) continue;
    const locRadius = loc.radius ?? 50;
    if (userLatLng.distanceTo(marker.getLatLng()) > locRadius) continue;

    // discover this location
    discoveryFlags[loc.discoveryField] = true;
    setMarkerIcon(loc.id, discoveredIcons[loc.id]);
    marker.setOpacity(1);

    await setDiscoveredOnUser({ discoveryField: loc.discoveryField, displayName: loc.displayName });
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
