<script setup>
import { ref } from "vue";
import { useAuthStore } from "./stores/auth";
import { onMounted, computed } from "vue";
import { useFriendsStore } from "@/stores/friends";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/Firebase";
import { campusIcons } from "./config/campusIcons";
import { campusAreas } from "./config/campusAreas";

const friendsStore = useFriendsStore();

const auth = useAuthStore();

const recentDiscoveries = ref([]);
const selectedFriendId = ref("");
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
    if (!selectedFriendId.value) return recentDiscoveries.value;

    if (selectedFriendId.value === "me") {
        return recentDiscoveries.value.filter((e) => e.email === auth.user.email);
    }

    const friend = friendsStore.friendsList.find((f) => f.friendId === selectedFriendId.value);
    if (!friend) return [];

    return recentDiscoveries.value.filter((e) => e.email === friend.friendEmail);
});
async function buildActivityEntriesForUser(userId, email) {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return [];

    const userData = userDoc.data();
    const activityEntries = [];

    // iterate over all discovery fields from campusIcons and campusAreas
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

    // current user
    activityEntries.push(...(await buildActivityEntriesForUser(auth.user.uid, auth.user.email)));

    // friends
    for (const friend of friendsStore.friendsList) {
        const friendEntries = await buildActivityEntriesForUser(friend.friendId, friend.friendEmail);
        activityEntries.push(...friendEntries);
    }

    recentDiscoveries.value = activityEntries.sort((a, b) => b.time - a.time);
});
</script>

<template>
    <h1>Recent Discoveries</h1>
    <label for="friendFilter">Filter by Friend:</label>

    <select id="friendFilter" name="friendFilter" v-model="selectedFriendId">
        <option value="">-- All --</option>
        <option value="me">Myself</option>
        <option v-for="friend in friendsStore.friendsList" :key="friend.friendId" :value="friend.friendId">
            {{ friend.friendEmail }}
        </option>
    </select>
    <div class="leaderboard-table">
        <ul>
            <li v-for="entry in filteredDiscoveries" :key="entry.email + entry.location + entry.time">
                <b>{{ entry.email }}</b> discovered <b>{{ entry.location }}</b> at
                {{ entry.time.toLocaleString() }}
            </li>
        </ul>
    </div>
</template>

<style scoped>
.app-root {
    margin: 0;
    padding: 0;
}

.leaderboard-table {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin: 12px 0;
}
</style>
