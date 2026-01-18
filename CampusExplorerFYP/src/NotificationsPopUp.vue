<script setup>
import { useFriendsStore } from './stores/friends';
import { useFriendRequestsStore } from './stores/friendRequests';
import { onMounted } from 'vue';

const friendRequestsStore = useFriendRequestsStore();
const friendsStore = useFriendsStore();
const emit = defineEmits(['closeNotificationsPopUp']);

function acceptRequest(requestId) {
    friendRequestsStore.acceptFriendRequest(requestId);
    friendsStore.fetchFriends();
}
onMounted(async () => {
    await friendRequestsStore.fetchIncomingRequests();

});

</script>

<template>
    <div class="backdrop" @click.self="emit('closeNotificationsPopUp')">
        <div class="pop-up-box">
            <ul>
                <li v-for="request in friendRequestsStore.incomingRequests" :key="request.id">
                    {{ request.fromEmail }} wants to be your friend.
                    <button @click="acceptRequest(request.id)">Accept</button>
                    <button @click="friendRequestsStore.rejectFriendRequest(request.id)">Reject</button>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.pop-up-box {
    position: absolute;
    top: 70px;
    right: 10px;
    width: 200px;
    height: 400px;
    background-color: #7decff;
    border: 3px solid black;
    display: flex;
    align-items: center;
    justify-content: center;
}

.backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
}
</style>