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
                <label for="description">Description</label>
                <textarea id="description" v-model="description" rows="4"
                    placeholder="Enter a description for this location"></textarea>
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
                    <option v-for="option in iconChoices" :key="option.value" :value="option.value">
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
import { useToastStore } from "./stores/toast";
import bookImg from "./assets/BookIcon.png";
import gymImg from "./assets/GymIcon.png";
import sportsImg from "./assets/SportsIcon.png";
import socialImg from "./assets/SocialIcon.png";
import healthImg from "./assets/HealthIcon.png";
import dramaImg from "./assets/DramaIcon.png";
import bankImg from "./assets/BankIcon.png";
import shopImg from "./assets/ShopIcon.png";
import accomImg from "./assets/AccomIcon.png";
import carParkImg from "./assets/CarParkIcon.png";
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase/Firebase";
import { useCampusLocs } from "./stores/campusLocs";
import { useCampusAreasStore } from "./stores/campusAreas";
import { ensureCampusDataLoaded } from "@/composables/useCampusData";

const mapEl = ref(null);
const latitude = ref("");
const longitude = ref("");
const locationId = ref("");
const displayName = ref("");
const description = ref("");
const areaId = ref("");
const toast = useToastStore();
const functions = getFunctions(app);
const campusLocsStore = useCampusLocs();
const campusAreasStore = useCampusAreasStore();
const addLocation = httpsCallable(functions, "addLocation");

const areaOptions = computed(() =>
    campusAreasStore.areas.map((area) => ({
        value: area.id,
        label: `${area.id} - ${area.displayName}`,
    })),
);

let map = null;
let marker = null;
const isSubmitting = ref(false);
const iconChoices = [
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
    { label: "Car Park", value: "carPark", preview: carParkImg },
];
const selectedIconKey = ref("");
const selectedIcon = computed(() =>
    iconChoices.find((option) => option.value === selectedIconKey.value),
);
const defaultIcon = L.Icon.extend({
    options: {
        iconSize: [32, 32],
        shadowSize: [50, 64],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    },
});

const iconOptions = {
    beer: new defaultIcon({ iconUrl: beerImg }),
    computer: new defaultIcon({ iconUrl: computerImg }),
    food: new defaultIcon({ iconUrl: foodImg }),
    engineering: new defaultIcon({ iconUrl: engineeringImg }),
    book: new defaultIcon({ iconUrl: bookImg }),
    gym: new defaultIcon({ iconUrl: gymImg }),
    sports: new defaultIcon({ iconUrl: sportsImg }),
    social: new defaultIcon({ iconUrl: socialImg }),
    health: new defaultIcon({ iconUrl: healthImg }),
    drama: new defaultIcon({ iconUrl: dramaImg }),
    bank: new defaultIcon({ iconUrl: bankImg }),
    shop: new defaultIcon({ iconUrl: shopImg }),
    accom: new defaultIcon({ iconUrl: accomImg }),
    carPark: new defaultIcon({ iconUrl: carParkImg }),
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});
const markersById = {};
const areaShapesById = {};
//add markers
function isPointInPolygon(point, polygon) {
    const [lat, lng] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [latI, lngI] = polygon[i];
        const [latJ, lngJ] = polygon[j];

        const intersects =
            lngI > lng !== lngJ > lng && lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;

        if (intersects) inside = !inside;
    }

    return inside;
}

function findAreaIdForLatLng(lat, lng) {
    const match = campusAreasStore.areas.find((area) => isPointInPolygon([lat, lng], area.polygon));
    return match?.id ?? "";
}
function addMarker(location) {
    const icon = iconOptions[location.iconKey];
    const marker = L.marker(location.coords, { icon }).addTo(map).bindPopup(location.displayName);

    marker.setOpacity(1);
    markersById[location.id] = marker;
    return marker;
}
async function onSubmit() {
    try {
        if (!selectedIconKey.value) {
            toast.show("Please select an icon.", { type: "error", duration: 4000 });
            return;
        }

        if (!areaId.value) {
            toast.show("Please place the marker inside a valid area.", { type: "error", duration: 4000 });
            return;
        }

        isSubmitting.value = true;


        const trimmedId = locationId.value.trim();
        const existing = campusLocsStore.locations.find((loc) => loc.id === trimmedId);
        if (existing) {
            const shouldReplace = window.confirm(
                `A location with id "${trimmedId}" already exists.\n\n` +
                `If you continue, the old marker will be replaced.\n\n` +
                `Do you want to continue?`,
            );

            if (!shouldReplace) {
                return;
            }
        }
        await addLocation({
            locationId: locationId.value,
            displayName: displayName.value,
            description: description.value,
            latitude: latitude.value,
            longitude: longitude.value,
            areaId: areaId.value,
            iconKey: selectedIconKey.value,
        });
        console.log("Submitting location:", {
            locationId: locationId.value,
            displayName: displayName.value,
            description: description.value,
            latitude: latitude.value,
            longitude: longitude.value,
            areaId: areaId.value,
            iconKey: selectedIconKey.value,
        });
    } catch (e) {
        console.error("addLocation failed:", e);
        toast.show(e.message, { type: "error", duration: 5000 });
    } finally {
        isSubmitting.value = false;
        loadFirestoreMarkers();
    }
}

onMounted(async () => {
    await nextTick();
    initMapInstance();
});
onBeforeUnmount(() => {
    if (map) {
        map.remove();
        map = null;
    }
});
async function loadFirestoreMarkers() {
    console.log("[AddLocation] Loading markers from Firestore...");

    campusLocsStore.locations.forEach((location) => {
        if (markersById[location.id]) {
            return;
        }
        addMarker(location);
    });
}

async function initMapInstance() {
    await nextTick();
    await ensureCampusDataLoaded();
    await campusAreasStore.startListeningAreas();

    map = L.map(mapEl.value).setView([53.2803, -9.06], 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on("click", (e) => {
        const { lat, lng } = e.latlng;

        latitude.value = lat.toFixed(6);
        longitude.value = lng.toFixed(6);
        areaId.value = findAreaIdForLatLng(lat, lng);

        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng]).addTo(map);
        }
    });

    // add all areas and icons
    campusAreasStore.areas.forEach((area) => {
        const poly = L.polygon(area.polygon, {
            color: area.color ?? "#1e90ff",
            fillColor: area.fillColor ?? area.color ?? "#1e90ff",
            fillOpacity: 0,
            weight: 2,
        }).addTo(map);
        areaShapesById[area.id] = poly;
    });
    loadFirestoreMarkers();

    setTimeout(() => {
        map.invalidateSize();
    }, 0);
}
</script>
<style scoped>
.add-location {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
}

.title {
    text-align: center;
    margin-bottom: 1.5rem;
}

input,
select,
textarea {
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
}

input:focus,
select:focus,
textarea:focus {
    outline: none;
    border-color: #2563eb;
}

textarea {
    resize: vertical;
}

form {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
}

.form-group {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
}

label {
    font-weight: 600;
    margin-bottom: 0.25rem;
}

input,
select {
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
}

input:focus,
select:focus {
    outline: none;
    border-color: #2563eb;
}

button {
    margin-top: 1rem;
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 6px;
    background-color: #2563eb;
    color: white;
    font-weight: 600;
    cursor: pointer;
}

button:hover {
    background-color: #1d4ed8;
}

button:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
}

.leaflet-map {
    width: 100%;
    height: 400px;
    margin-top: 1rem;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
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

.duplicate-warning {
    margin-top: 0.5rem;
    color: #b45309;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
}
</style>
