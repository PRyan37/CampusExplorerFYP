<template>
    <div class="add-location">
        <h1 class="title">ADD LOCATION</h1>

        <form @submit.prevent="onSubmit">
            <div class="form-group">
                <label for="locationId">Location ID</label>
                <input id="locationId" v-model="locationId" type="text" placeholder="e.g. engineeringBuilding" />
            </div>

            <div class="form-group">
                <label for="displayName">Display Name</label>
                <input id="displayName" v-model="displayName" type="text" placeholder="e.g. Engineering Building" />
            </div>

            <div class="form-group">
                <label for="lat">Latitude</label>
                <input id="lat" v-model="latitude" type="number" step="any" />
            </div>

            <div class="form-group">
                <label for="lng">Longitude</label>
                <input id="lng" v-model="longitude" type="number" step="any" />
            </div>
            <div class="form-group">
                <label for="areaId">Area ID</label>
                <select id="areaId" v-model="areaId">
                    <option disabled value="">Select an area</option>
                    <option v-for="area in areaOptions" :key="area.value" :value="area.value">
                        {{ area.label }}
                    </option>
                </select>
            </div>
            <div class="form-group">
                <label for="iconChoice">Icon</label>
                <select id="iconChoice" v-model="selectedIconKey">
                    <option disabled value="">Select an icon</option>
                    <option v-for="option in iconOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </option>
                </select>
            </div>
            <button type="submit" :disabled="isSubmitting">Add Location</button>
        </form>
        <div v-if="selectedIcon" class="icon-preview">
            <p>Selected icon:</p>
            <img :src="selectedIcon.preview" :alt="selectedIcon.label" />
        </div>
        <div ref="mapEl" class="leaflet-map"></div>
    </div>
</template>

<script setup>
import beerImg from "./assets/BeerIcon.png";
import computerImg from "./assets/ComputerIcon.png";
import foodImg from "./assets/FoodIcon.png";
import engineeringImg from "./assets/EngineeringIcon.png";

import bookImg from "./assets/BookIcon.png";
import gymImg from "./assets/GymIcon.png";
import sportsImg from "./assets/SportsIcon.png";
import socialImg from "./assets/SocialIcon.png";
import healthImg from "./assets/HealthIcon.png";
import dramaImg from "./assets/DramaIcon.png";
import bankImg from "./assets/BankIcon.png";
import shopImg from "./assets/ShopIcon.png";
import accomImg from "./assets/AccomIcon.png";
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase/Firebase";
import { campusAreas } from "./config/campusAreas";

const mapEl = ref(null);
const latitude = ref("");
const longitude = ref("");
const locationId = ref("");
const displayName = ref("");
const areaId = ref("");
const functions = getFunctions(app);
const addLocation = httpsCallable(functions, "addLocation");

const areaOptions = computed(() =>
    campusAreas.map((area) => ({
        value: area.id,
        label: `${area.id} - ${area.displayName}`,
    })),
);

let map = null;
let marker = null;
const isSubmitting = ref(false);

const iconOptions = [
    { label: "Beer", value: "beer", preview: beerImg },
    { label: "Computer", value: "computer", preview: computerImg },
    { label: "Food", value: "food", preview: foodImg },
    { label: "Engineering", value: "engineering", preview: engineeringImg },
    { label: "Book", value: "book", preview: bookImg },
    { label: "Gym", value: "gym", preview: gymImg },
    { label: "Sports", value: "sports", preview: sportsImg },
    { label: "Social", value: "social", preview: socialImg },
    { label: "Health", value: "health", preview: healthImg },
    { label: "Drama", value: "drama", preview: dramaImg },
    { label: "Bank", value: "bank", preview: bankImg },
    { label: "Shop", value: "shop", preview: shopImg },
    { label: "Accommodation", value: "accom", preview: accomImg },
];

const selectedIconKey = ref("");
const selectedIcon = computed(() =>
    iconOptions.find((option) => option.value === selectedIconKey.value),
);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

async function onSubmit() {
    try {
        isSubmitting.value = true;
        await addLocation({
            locationId: locationId.value,
            displayName: displayName.value,
            latitude: latitude.value,
            longitude: longitude.value,
            areaId: areaId.value,
            iconKey: selectedIconKey.value,
        });
        console.log("Submitting location:", {
            locationId: locationId.value,
            displayName: displayName.value,
            latitude: latitude.value,
            longitude: longitude.value,
            areaId: areaId.value,
            iconKey: selectedIconKey.value,
        });
    } catch (e) {
        console.error("addLocation failed:", e);
    } finally {
        isSubmitting.value = false;
    }
}

onMounted(async () => {
    await nextTick();

    map = L.map(mapEl.value).setView([53.2803, -9.06], 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on("click", (e) => {
        const { lat, lng } = e.latlng;

        latitude.value = lat.toFixed(6);
        longitude.value = lng.toFixed(6);

        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng]).addTo(map);
        }
    });
});
onBeforeUnmount(() => {
    if (map) {
        map.remove();
        map = null;
    }
});
</script>

<style scoped>
.leaflet-map {
    width: 100%;
    height: 400px;
    margin-top: 1rem;
}

.form-group {
    margin-bottom: 1rem;
}

.icon-preview {
    margin-top: 1rem;
    text-align: center;
}

.icon-preview img {
    width: 48px;
    height: 48px;
    object-fit: contain;
}
</style>
