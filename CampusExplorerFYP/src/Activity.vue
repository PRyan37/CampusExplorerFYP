<script setup>
import { ref } from 'vue'
import { useAuthStore } from './stores/auth'
import friendsList from '@/FriendsList.vue'
import { onMounted, } from 'vue'
import { useFriendsStore } from '@/stores/friends'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase/Firebase'
const friendsStore = useFriendsStore()

const auth = useAuthStore()

const recentDiscoveries = ref([])

async function buildActivityEntriesForUser(userId, email) {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) return []

    const userData = userDoc.data()
    const activityEntries = []
    const locations = ['computerScienceBuildingDiscovered', 'sultDiscovered', 'anBhiaLannDiscovered', 'engineeringBuildingDiscovered']
    for (const location of locations) {
        if (userData[location + 'At']) {
            let locationFriendlyName = location
            if (location === 'computerScienceBuildingDiscovered') {
                locationFriendlyName = 'Computer Science Building'
            } else if (location === 'sultDiscovered') {
                locationFriendlyName = 'Sult'
            } else if (location === 'anBhiaLannDiscovered') {
                locationFriendlyName = 'An Bhia Lann'
            } else if (location === 'engineeringBuildingDiscovered') {
                locationFriendlyName = 'Engineering Building'
            }
            activityEntries.push({
                email,
                location: locationFriendlyName,
                time: userData[location + 'At'].toDate()
            })
        }
    }
    return activityEntries
}

onMounted(async () => {
    await friendsStore.fetchFriends()

    const activityEntries = []


    activityEntries.push(...await buildActivityEntriesForUser(auth.user.uid, auth.user.email))

    for (const friend of friendsStore.friendsList) {
        const friendEntries = await buildActivityEntriesForUser(friend.friendId, friend.friendEmail)
        activityEntries.push(...friendEntries)
    }
    recentDiscoveries.value = activityEntries.sort((a, b) => b.time - a.time)


})
</script>

<template>
    <h1>Recent Discoveries</h1>

    <div class="leaderboard-table">

        <ul>
            <li v-for="entry in recentDiscoveries" :key="entry.email + entry.location + entry.time">
                <b>{{ entry.email }}</b> discovered <b>{{ entry.location }}</b> at {{ entry.time.toLocaleString() }}
            </li>
        </ul>
    </div>

    <friendsList />
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