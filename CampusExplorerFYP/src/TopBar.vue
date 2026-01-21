<script setup>
import AddFriends from './AddFriends.vue';
import FriendsModal from './AddFriendsModal.vue';
import { ref } from 'vue';
import Notifications from './Notifications.vue';
import NotificationsPopUp from './NotificationsPopUp.vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
const auth = useAuthStore();
const router = useRouter();
const showNotificationsPopUp = ref(false);
const showFriendsModal = ref(false);
function openFriendsModal() {
  showFriendsModal.value = true
}
function closeFriendsModal() {
  showFriendsModal.value = false
}
function openNotificationsPopUp() {
  showNotificationsPopUp.value = true
}
function closeNotificationsPopUp() {
  showNotificationsPopUp.value = false
}
function goLeaderboard() {
  router.push('/leaderboard')
}
function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="top-bar">
    <h2>{{ auth.displayName }}</h2>
    <h1 @click="goHome" class="title">Campus Explorer</h1>
    <div class="right-buttons">
      <div @click="goLeaderboard" class="buttons">
        Leaderboard
      </div>
      <Notifications @open-notifications-pop-up="openNotificationsPopUp" />
      <AddFriends @open-friend-modal="openFriendsModal" />
    </div>
    <NotificationsPopUp v-if="showNotificationsPopUp" @close-notifications-pop-up="closeNotificationsPopUp" />
    <FriendsModal v-if="showFriendsModal" @close-friend-modal="closeFriendsModal" />
  </div>
</template>

<style scoped>
.top-bar {
  position: relative;
  width: 100%;
  height: 60px;
  background-color: #9fb9ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  margin: 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}


.right-buttons {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.buttons {
  padding: 4px;
  background-color: #d6d6d6;
  border: 3px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>