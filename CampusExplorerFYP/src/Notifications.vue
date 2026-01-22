<script setup>
import bellImg from './assets/bell.jpg'
import { useFriendRequestsStore } from './stores/friendRequests';
const friendRequestsStore = useFriendRequestsStore();
const emit = defineEmits(['openNotificationsPopUp']);
function showNotifications() {
  friendRequestsStore.fetchIncomingRequests();
  console.log("Show Notifications Clicked")
  emit('openNotificationsPopUp');
}
</script>

<template>
  <div @click="showNotifications" class="notifications ">
    <img :src="bellImg" alt="Notifications" width="50" height="50" />
    <span v-if="friendRequestsStore.incomingRequests.length" class="notifications-badge"></span>
  </div>

</template>

<style scoped>
.notifications {
  width: 50px;
  height: 50px;
  background-color: #d6d6d6;
  border: 3px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.notifications-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  background-color: red;
  border-radius: 50%;
  border: 2px solid white;
}
</style>