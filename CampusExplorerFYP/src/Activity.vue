<script setup>
import { useAuthStore } from "./stores/auth";
import { onMounted, computed, ref } from "vue";
import { useFriendsStore } from "@/stores/friends";
import { campusIcons } from "./config/campusIcons";
import { campusAreas } from "./config/campusAreas";
import { useUserDataStore } from "./stores/userData";

const friendsStore = useFriendsStore();
const auth = useAuthStore();
const userDataStore = useUserDataStore();

const recentDiscoveries = ref([]);
const selectedFriendId = ref("");
const selectedTimeRange = ref("ever");

const discoveryMetaByField = [
    ...campusIcons.map((loc) => ({
        field: loc.discoveryField,
        displayName: loc.displayName,
    })),
    ...campusAreas.map((area) => ({
        field: area.discoveryField,
        displayName: area.displayName,
    })),
].reduce((acc, item) => {
    acc[item.field] = { displayName: item.displayName };
    return acc;
}, {});

const filteredDiscoveries = computed(() => {
    let filtered = recentDiscoveries.value;

    if (selectedFriendId.value === "me") {
        filtered = filtered.filter((e) => e.email === auth.user.email);
    } else if (selectedFriendId.value) {
        const friend = friendsStore.friendsList.find((f) => f.friendId === selectedFriendId.value);
        if (!friend) return [];
        filtered = filtered.filter((e) => e.email === friend.friendEmail);
    }

    if (selectedTimeRange.value !== "ever") {
        const now = Date.now();
        const rangeMsByKey = {
            "1h": 1 * 60 * 60 * 1000,
            "6h": 6 * 60 * 60 * 1000,
            "24h": 24 * 60 * 60 * 1000,
            "1w": 7 * 24 * 60 * 60 * 1000,
        };

        const cutoff = now - rangeMsByKey[selectedTimeRange.value];
        filtered = filtered.filter((e) => e.time.getTime() >= cutoff);
    }

    return filtered;
});

async function buildActivityEntriesForUser(userId, email) {
    const userData = await userDataStore.fetchUserData(userId);
    if (!userData) return [];
    const activityEntries = [];

    for (const [discoveryField, meta] of Object.entries(discoveryMetaByField)) {
        const ts = userData[discoveryField + "At"];
        if (!ts) continue;

        activityEntries.push({
            email,
            location: meta.displayName,
            time: ts.toDate(),
        });
    }

    return activityEntries;
}

onMounted(async () => {
    await friendsStore.fetchFriends();

    const activityEntries = [];
    activityEntries.push(...(await buildActivityEntriesForUser(auth.user.uid, auth.user.email)));

    for (const friend of friendsStore.friendsList) {
        const friendEntries = await buildActivityEntriesForUser(friend.friendId, friend.friendEmail);
        activityEntries.push(...friendEntries);
    }

    recentDiscoveries.value = activityEntries.sort((a, b) => b.time - a.time);
});
</script>

<template>
    <div class="activity-card">
        <h1 class="title">Recent Discoveries</h1>

        <div class="filter-row">
            <label for="friendFilter">Filter by Friend:</label>
            <select id="friendFilter" name="friendFilter" v-model="selectedFriendId">
                <option value="">-- All --</option>
                <option value="me">Myself</option>
                <option v-for="friend in friendsStore.friendsList" :key="friend.friendId" :value="friend.friendId">
                    {{ friend.friendEmail }}
                </option>
            </select>
        </div>

        <div class="filter-row">
            <label for="timeFilter">Filter by Time:</label>
            <select id="timeFilter" name="timeFilter" v-model="selectedTimeRange">
                <option value="1h">Last 1 Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="1w">Last 1 Week</option>
                <option value="ever">Ever</option>
            </select>
        </div>

        <ul class="activity-list">
            <li v-for="entry in filteredDiscoveries" :key="`${entry.email}-${entry.location}-${entry.time.getTime()}`"
                class="activity-item">
                <span class="email">{{ entry.email }}</span>
                discovered
                <span class="location">{{ entry.location }}</span>

                <div class="time">
                    {{ entry.time.toLocaleString() }}
                </div>
            </li>
        </ul>
    </div>
</template>

<style scoped>
.activity-card {
    background: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.title {
    margin-bottom: 15px;
}

.filter-row {
    margin-bottom: 15px;
}

select {
    margin-left: 8px;
    padding: 5px;
}

.activity-list {
    list-style: none;
    padding: 0;
}

.activity-item {
    padding: 10px;
    border-bottom: 1px solid #eee;
}

.activity-item:hover {
    background: #f7f7f7;
}

.email {
    font-weight: 600;
}

.location {
    font-weight: 600;
    color: #79153d;
}

.time {
    font-size: 0.9em;
    color: #666;
}
</style>
