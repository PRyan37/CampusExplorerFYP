<template>
    <div class="leaderboard-card">
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
                        <td class="email">{{ entry.email }}</td>
                        <td class="score">{{ entry.score }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
<script setup>
import { onMounted, ref } from "vue";
import { useProgressStore } from "@/stores/progress";
import { useAuthStore } from "./stores/auth";
import { useFriendsStore } from "@/stores/friends";
const auth = useAuthStore();

const progressStore = useProgressStore();

const friendsStore = useFriendsStore();

const leaderboard = ref([]);
onMounted(async () => {
    await friendsStore.fetchFriends();

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

<style scoped>
.leaderboard-card {
    background: white;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
}

.leaderboard-title {
    margin-bottom: 15px;
}

.leaderboard-table table {
    width: 100%;
    border-collapse: collapse;
}

thead th {
    text-align: left;
    border-bottom: 2px solid #ddd;
    padding: 10px;
}

tbody td {
    padding: 10px;
    border-bottom: 1px solid #eee;
}

tbody tr:hover {
    background-color: #f7f7f7;
}

.email {
    font-weight: 500;
}

.score {
    font-weight: bold;
    color: #79153d;
}
</style>
