<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import TopBar from "../TopBar.vue";
import friendsList from "@/FriendsList.vue";
import { onMounted } from "vue";
import { useProgressStore } from "@/stores/progress";
import { useFriendsStore } from "@/stores/friends";
import Activity from "@/Activity.vue";
import Toast from "@/Toast.vue";
import { useFriendRequestsStore } from "@/stores/friendRequests";
const friendRequestsStore = useFriendRequestsStore();
const friendsStore = useFriendsStore();

const auth = useAuthStore();

const progressStore = useProgressStore();

const leaderboard = ref([]);

onMounted(async () => {
    friendRequestsStore.subscribeIncomingRequests();

    const leaderboardEntries = [];

    const myScore = await progressStore.calculateScoreForUser(auth.user.uid);
    leaderboardEntries.push({
        email: auth.user.email,
        score: myScore,
    });
    for (const friend of friendsStore.friendsList) {
        const score = await progressStore.calculateScoreForUser(friend.friendId);
        leaderboardEntries.push({
            email: friend.friendEmail,
            score,
        });
    }

    leaderboard.value = leaderboardEntries.sort((a, b) => b.score - a.score);
});
</script>

<template>
    <TopBar />
    <Toast ref="toastRef" />
    <h1>Leaderboard</h1>

    <div class="leaderboard-table">
        <table>
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="entry in leaderboard" :key="entry.email">
                    <td>{{ entry.email }}</td>
                    <td>{{ entry.score }}</td>
                </tr>
            </tbody>
        </table>
    </div>
    <friendsList />
    <activity />
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
