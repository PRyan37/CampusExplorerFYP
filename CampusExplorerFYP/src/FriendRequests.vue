<template>
    <div class="requests-card">
        <p v-if="friendRequestsStore.incomingRequests.length === 0" class="no-requests">
            You have no pending friend requests.
        </p>

        <ul v-else class="request-list">
            <li v-for="request in friendRequestsStore.incomingRequests" :key="request.id" class="request-item">
                <span class="request-text">
                    <b>{{ request.fromEmail }}</b> wants to be your friend
                </span>

                <div class="buttons">
                    <button class="accept" @click="acceptRequest(request.id)">Accept</button>

                    <button class="reject" @click="friendRequestsStore.rejectFriendRequest(request.id)">
                        Reject
                    </button>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { useFriendsStore } from "@/stores/friends";
import { useFriendRequestsStore } from "@/stores/friendRequests";

const friendRequestsStore = useFriendRequestsStore();
const friendsStore = useFriendsStore();

function acceptRequest(requestId) {
    friendRequestsStore.acceptFriendRequest(requestId);
    friendsStore.fetchFriends();
}
</script>

<style scoped>
.requests-card {
    background: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.request-list {
    list-style: none;
    padding: 0;
    margin-top: 10px;
}

.request-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
}

.request-item:hover {
    background: #f7f7f7;
}

.buttons {
    display: flex;
    gap: 8px;
}

button {
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
}

.accept {
    background: #79153d;
    color: white;
}

.accept:hover {
    background: #641132;
}

.reject {
    background: #eee;
}

.reject:hover {
    background: #ddd;
}

.no-requests {
    color: #666;
    margin-top: 10px;
}
</style>
