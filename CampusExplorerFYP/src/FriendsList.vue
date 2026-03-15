<template>
    <div class="friends-card">
        <p v-if="friendsStore.friendsList.length === 0" class="no-friends">
            You have no friends added yet.
        </p>

        <ul v-else class="friends-list">
            <li v-for="friend in friendsStore.friendsList" :key="friend.id" class="friend-item">
                {{ friend.friendEmail }}
            </li>
        </ul>
    </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useFriendsStore } from "./stores/friends";

const friendsStore = useFriendsStore();

onMounted(() => {
    friendsStore.fetchFriends();
});
</script>

<style scoped>
.friends-card {
    background: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.friends-list {
    list-style: none;
    padding: 0;
    margin-top: 10px;
}

.friend-item {
    padding: 10px;
    border-bottom: 1px solid #eee;
}

.friend-item:hover {
    background: #f7f7f7;
}

.no-friends {
    color: #666;
    margin-top: 10px;
}
</style>
