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
}
</style>