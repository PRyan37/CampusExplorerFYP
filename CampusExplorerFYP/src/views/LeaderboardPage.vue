<script setup>
import Leaderboard from "../Leaderboard.vue";
import TopBar from "../TopBar.vue";
import FriendsList from "../FriendsList.vue";
import FriendRequests from "../FriendRequests.vue";
import Activity from "../Activity.vue";
import CollapsibleBox from "../CollapsibleBox.vue";
</script>

<template>
    <TopBar />
    <div class="leaderboard-page">
        <CollapsibleBox title="Leaderboard" :startOpen="true">
            <Leaderboard />
        </CollapsibleBox>

        <CollapsibleBox title="Friend Requests">
            <FriendRequests />
        </CollapsibleBox>

        <CollapsibleBox title="Friends List">
            <FriendsList />
        </CollapsibleBox>

        <CollapsibleBox title="Activity">
            <Activity />
        </CollapsibleBox>
    </div>
</template>

<style scoped>
.leaderboard-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
}
</style>
