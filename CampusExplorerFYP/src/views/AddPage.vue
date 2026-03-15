<template>
    <TopBar />
    <DevOnly>
        <div class="switch_bar">
            <button class="switch_button" :class="{ active: activeTab === 'friend' }" @click="activeTab = 'friend'">
                Friends
            </button>

            <button class="switch_button" :class="{ active: activeTab === 'location' }" @click="activeTab = 'location'">
                Locations
            </button>
            <button class="switch_button" :class="{ active: activeTab === 'area' }" @click="activeTab = 'area'">
                Areas
            </button>
        </div>
    </DevOnly>
    <div v-if="activeTab === 'friend'">
        <AddFriends />
    </div>
    <div v-if="activeTab === 'location'">
        <AddLocation />
    </div>
    <div v-if="activeTab === 'area'">
        <AddArea />
    </div>
</template>

<script setup>
import TopBar from "@/TopBar.vue";
import AddFriends from "@/AddFriends.vue";
import AddLocation from "@/AddLocation.vue";
import AddArea from "@/AddArea.vue";
import DevOnly from "@/DevOnly.vue";
import { ref } from "vue";

const activeTab = ref("friend");
</script>

<style scoped>
.switch_bar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    padding: 10px 0;
    background-color: #f4f6f8;
    border-bottom: 1px solid #ddd;
}

.switch_button {
    flex: 1;
    padding: 12px 0;
    border: none;
    background: transparent;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.switch_button:hover {
    background-color: #e2e8f0;
}

.switch_button.active {
    background-color: #79153d;
    color: white;
}
</style>
