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
