<template>
    <div class="add-area">
        <h1 class="title">ADD AREA</h1>

        <form @submit.prevent="onSubmit">
            <div class="form-group">
                <label for="areaId">Area ID</label>
                <input id="areaId" v-model="areaId" type="text" placeholder="e.g. scienceBlock" />
            </div>

            <div class="form-group">
                <label for="displayName">Display Name</label>
                <input id="displayName" v-model="displayName" type="text" placeholder="e.g. Science Block" />
            </div>

            <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" v-model="description" rows="4"
                    placeholder="Enter a description for this area"></textarea>
            </div>

            <div class="form-group">
                <label for="color">Color</label>
                <input id="color" v-model="color" type="color" />
            </div>

            <div class="form-group polygon-info">
                <span>Polygon points: {{ polygonPoints.length }} <span v-if="polygonPoints.length < 3">(min 3)</span></span>
                <button type="button" class="clear-btn" @click="clearPolygon">Clear Polygon</button>
            </div>

            <button type="submit" :disabled="isSubmitting || polygonPoints.length < 3">Add Area</button>
        </form>

        <div ref="mapEl" class="leaflet-map"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase/Firebase";
import { useToastStore } from "./stores/toast";
import { useCampusAreasStore } from "./stores/campusAreas";

const mapEl = ref(null);
const areaId = ref("");
const displayName = ref("");
const description = ref("");
const color = ref("#1e90ff");
const polygonPoints = ref([]);
const isSubmitting = ref(false);

const toast = useToastStore();
const campusAreasStore = useCampusAreasStore();
const functions = getFunctions(app);
const addAreaCall = httpsCallable(functions, "addArea");

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

let map = null;
let polygonLayer = null;
const vertexMarkers = [];
const drawnAreaIds = new Set();

function drawArea(area) {
    if (drawnAreaIds.has(area.id)) return;
    L.polygon(area.polygon, {
        color: area.color ?? "#1e90ff",
        fillColor: area.fillColor ?? area.color ?? "#1e90ff",
        fillOpacity: 0,
        weight: 2,
    }).addTo(map);
    drawnAreaIds.add(area.id);
}

watch(() => campusAreasStore.areas, (areas) => {
    if (!map) return;
    areas.forEach(drawArea);
}, { deep: true });

function updatePolygonPreview() {
    if (polygonLayer) {
        map.removeLayer(polygonLayer);
        polygonLayer = null;
    }
    if (polygonPoints.value.length >= 2) {
        polygonLayer = L.polygon(polygonPoints.value, {
            color: color.value,
            fillColor: color.value,
            fillOpacity: 0.15,
            weight: 2,
        }).addTo(map);
    }
}

function clearPolygon() {
    polygonPoints.value = [];
    vertexMarkers.forEach((m) => map.removeLayer(m));
    vertexMarkers.length = 0;
    if (polygonLayer) {
        map.removeLayer(polygonLayer);
        polygonLayer = null;
    }
}

async function onSubmit() {
    if (polygonPoints.value.length < 3) {
        toast.show("Place at least 3 points on the map.", { type: "error", duration: 4000 });
        return;
    }

    const trimmedId = areaId.value.trim();
    const existing = campusAreasStore.areas.find((a) => a.id === trimmedId);
    if (existing) {
        const shouldReplace = window.confirm(
            `An area with id "${trimmedId}" already exists.\n\nIf you continue, it will be replaced.\n\nDo you want to continue?`,
        );
        if (!shouldReplace) return;
    }

    isSubmitting.value = true;
    try {
        await campusAreasStore.startListeningAreas();
        await addAreaCall({
            areaId: areaId.value,
            displayName: displayName.value,
            description: description.value,
            color: color.value,
            polygon: polygonPoints.value.map(([lat, lng]) => ({ lat, lng })),
        });
        toast.show(`Area "${displayName.value}" added!`, { type: "success", duration: 4000 });
        areaId.value = "";
        displayName.value = "";
        description.value = "";
        color.value = "#1e90ff";
        clearPolygon();
    } catch (e) {
        console.error("addArea failed:", e);
        toast.show(e.message, { type: "error", duration: 5000 });
    } finally {
        isSubmitting.value = false;
    }
}

onMounted(async () => {
    await nextTick();
    await campusAreasStore.startListeningAreas();

    map = L.map(mapEl.value).setView([53.2803, -9.06], 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // draw existing areas
    campusAreasStore.areas.forEach(drawArea);

    map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        polygonPoints.value.push([lat, lng]);
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`Point ${polygonPoints.value.length}`).openPopup();
        vertexMarkers.push(marker);
        updatePolygonPreview();
    });

    setTimeout(() => map.invalidateSize(), 0);
});

onBeforeUnmount(() => {
    if (map) {
        map.remove();
        map = null;
    }
});
</script>

<style scoped>
.add-area {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
}

.title {
    text-align: center;
    margin-bottom: 1.5rem;
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

input[type="text"],
select,
textarea {
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
}

input[type="text"]:focus,
select:focus,
textarea:focus {
    outline: none;
    border-color: #2563eb;
}

textarea {
    resize: vertical;
}

input[type="color"] {
    height: 40px;
    padding: 2px 4px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    cursor: pointer;
    width: 80px;
}

.polygon-info {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}

.clear-btn {
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 0.85rem;
}

.clear-btn:hover {
    background: #f1f5f9;
}

button[type="submit"] {
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

button[type="submit"]:hover {
    background-color: #1d4ed8;
}

button[type="submit"]:disabled {
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
</style>
