<script setup>
import { ref, computed, onMounted } from "vue";
import TopBar from "@/TopBar.vue";
import { campusIcons } from "@/config/campusIcons";
import { campusAreas } from "@/config/campusAreas";
import { useAuthStore } from "@/stores/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/Firebase";
import { useProgressStore } from "@/stores/progress";

const progressStore = useProgressStore();
const auth = useAuthStore();
const myScore = ref(0);

const totalLocations = campusIcons.length + campusAreas.length;
const discoveredLocations = ref(0);

// Track which item is expanded (by its discoveryField)
const expandedField = ref(null);

function toggleDescription(loc) {
    if (!loc.discovered) return; // only discovered items can expand
    if (expandedField.value === loc.field) {
        expandedField.value = null; // collapse if already open
    } else {
        expandedField.value = loc.field; // expand this one
    }
}

const areaGroups = ref(
    campusAreas.map((area) => ({
        name: area.displayName,
        field: area.discoveryField,
        color: area.color ?? "#1e90ff",
        discovered: false,
        description: area.description ?? "",
        children: campusIcons
            .filter((loc) => loc.areaId === area.id)
            .map((loc) => ({
                name: loc.displayName,
                field: loc.discoveryField,
                discovered: false,
                description: loc.description ?? "",
            })),
    })),
);

const standaloneIcons = ref(
    campusIcons
        .filter((loc) => !loc.areaId)
        .map((loc) => ({
            name: loc.displayName,
            field: loc.discoveryField,
            discovered: false,
            description: loc.description ?? "",
        })),
);

const progressPercent = computed(() => {
    return Math.round((discoveredLocations.value / totalLocations) * 100);
});
onMounted(async () => {
    myScore.value = await progressStore.calculateScoreForUser(auth.user.uid);

    if (auth.user) {
        const userRef = doc(db, "users", auth.user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            let count = 0;

            areaGroups.value.forEach((area) => {
                if (data[area.field]) {
                    area.discovered = true;
                    count++;
                }
                area.children.forEach((child) => {
                    if (data[child.field]) {
                        child.discovered = true;
                        count++;
                    }
                });
            });

            standaloneIcons.value.forEach((loc) => {
                if (data[loc.field]) {
                    loc.discovered = true;
                    count++;
                }
            });

            discoveredLocations.value = count;
        }
    }
});
</script>

<template>
    <TopBar />

    <h1 class="title">Journey</h1>

    <div class="progress-section">
        <h2>Progress</h2>
        <p class="progress-text">{{ discoveredLocations }} / {{ totalLocations }} discovered</p>

        <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }">
                <span v-if="progressPercent > 10" class="progress-label"> {{ progressPercent }}% </span>
            </div>
        </div>

        <p v-if="progressPercent === 100" class="complete-msg">You've discovered everything!</p>
        <p>You have a score of {{ myScore }}</p>
    </div>

    <div class="locations-section">
        <h2>Locations</h2>
        <div v-for="area in areaGroups" :key="area.field" class="area-group">
            <div class="area-header" :class="{
                discovered: area.discovered,
                undiscovered: !area.discovered,
                clickable: area.discovered,
            }" :style="{ borderLeftColor: area.color }" @click="toggleDescription(area)">
                <span class="status-icon">{{ area.discovered ? "✔" : "?" }}</span>
                <span class="loc-name">{{ area.discovered ? area.name : "???" }}</span>
                <span class="area-badge" :style="{ backgroundColor: area.color }">Area</span>
                <span v-if="area.discovered" class="expand-arrow">
                    {{ expandedField === area.field ? "▲" : "▼" }}
                </span>
            </div>

            <div class="description-slider" :class="{ open: expandedField === area.field }">
                <p class="description-text">{{ area.description }}</p>
            </div>

            <ul class="children-list">
                <template v-for="child in area.children" :key="child.field">
                    <li :class="{
                        discovered: child.discovered,
                        undiscovered: !child.discovered,
                        clickable: child.discovered,
                    }" @click="toggleDescription(child)">
                        <span class="status-icon">{{ child.discovered ? "✔" : "?" }}</span>
                        <span class="loc-name">{{ child.discovered ? child.name : "???" }}</span>
                        <span v-if="child.discovered" class="expand-arrow">
                            {{ expandedField === child.field ? "▲" : "▼" }}
                        </span>
                    </li>
                    <li class="description-slider" :class="{ open: expandedField === child.field }">
                        <p class="description-text">{{ child.description }}</p>
                    </li>
                </template>
            </ul>
        </div>

        <!-- Standalone icons -->
        <div v-if="standaloneIcons.length" class="standalone-group">
            <h3>Other Locations</h3>
            <ul class="children-list">
                <template v-for="loc in standaloneIcons" :key="loc.field">
                    <li :class="{
                        discovered: loc.discovered,
                        undiscovered: !loc.discovered,
                        clickable: loc.discovered,
                    }" @click="toggleDescription(loc)">
                        <span class="status-icon">{{ loc.discovered ? "✔" : "?" }}</span>
                        <span class="loc-name">{{ loc.discovered ? loc.name : "???" }}</span>
                        <span v-if="loc.discovered" class="expand-arrow">
                            {{ expandedField === loc.field ? "▲" : "▼" }}
                        </span>
                    </li>
                    <li class="description-slider" :class="{ open: expandedField === loc.field }">
                        <p class="description-text">{{ loc.description }}</p>
                    </li>
                </template>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.title {
    margin: 0;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
}

.progress-section {
    margin: 40px auto 0;
    max-width: 500px;
    padding: 0 20px;
}

.progress-text {
    font-size: 1.1rem;
    margin-bottom: 8px;
    color: #333;
}

.progress-bar-bg {
    width: 100%;
    height: 30px;
    background-color: #e0e0e0;
    border-radius: 15px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background-color: #4caf50;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: width 0.6s ease-in-out;
    min-width: 0;
}

.progress-label {
    color: white;
    font-weight: bold;
    font-size: 0.85rem;
}

.complete-msg {
    margin-top: 12px;
    font-size: 1.2rem;
    color: #4caf50;
    font-weight: bold;
}

.locations-section {
    margin: 30px auto 40px;
    max-width: 500px;
    padding: 0 20px;
}

.locations-section h2 {
    margin-bottom: 12px;
}

/* ---- Area groups ---- */
.area-group {
    margin-bottom: 16px;
}

.area-header {
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 8px;
    font-size: 1.05rem;
    font-weight: bold;
    border-left: 4px solid;
}

.discovered {
    background-color: #e8f5e9;
}

.undiscovered {
    background-color: #f5f5f5;
    color: #999;
}

.area-badge {
    font-size: 0.7rem;
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    text-transform: uppercase;
    font-weight: bold;
}

/* ---- Clickable items ---- */
.clickable {
    cursor: pointer;
}

.clickable:hover {
    filter: brightness(0.95);
}

.expand-arrow {
    font-size: 0.75rem;
    color: #888;
    margin-left: auto;
    flex-shrink: 0;
}

/* ---- Slide-out description ---- */
.description-slider {
    margin-top: 4px;
    max-height: 0;
    overflow: hidden;
    transition:
        max-height 0.4s ease,
        padding 0.4s ease;
    padding: 0 14px 0 30px;
    list-style: none;
}

.description-slider.open {
    max-height: 200px;
    padding: 8px 14px 12px 30px;
    background-color: #e8f5e9;
    border-left: 4px solid #4caf50;
    border-radius: 6px;
}

.description-text {
    margin: 0;
    font-size: 0.9rem;
    color: #555;
    line-height: 1.4;
}

/* ---- Children list ---- */
.children-list {
    list-style: none;
    padding: 0;
    margin: 4px 0 0 0;
}

.children-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px 8px 30px;
    margin-bottom: 4px;
    border-radius: 6px;
    font-size: 0.95rem;
    border-left: 4px solid transparent;
}

.children-list li.discovered {
    border-left-color: #81c784;
}

.children-list li.undiscovered {
    border-left-color: #e0e0e0;
}

.children-list li.description-slider {
    padding: 0 14px 0 30px;
    border-left-color: transparent;
    background-color: transparent;
}

.children-list li.description-slider.open {
    padding: 8px 14px 12px 44px;
    background-color: #e8f5e9;
    border-left-color: #81c784;
}

/* ---- Standalone ---- */
.standalone-group {
    margin-top: 20px;
}

.standalone-group h3 {
    margin-bottom: 8px;
    font-size: 1rem;
    color: #555;
}

.status-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
}

.loc-name {
    flex: 1;
}
</style>
