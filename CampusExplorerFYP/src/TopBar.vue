<script setup>
import FriendsModal from "./AddFriendsModal.vue";
import { ref, computed } from "vue";
import NotificationsPopUp from "./NotificationsPopUp.vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import bellImg from "./assets/bell.png";
import leaderboardImg from "./assets/leaderboard.png";
import homeImg from "./assets/homeIcon.png";
import { useFriendRequestsStore } from "./stores/friendRequests";
const friendRequestsStore = useFriendRequestsStore();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const showNotificationsPopUp = ref(false);
const showFriendsModal = ref(false);
const isHome = computed(() => route.path === "/home");
const isLeaderboard = computed(() => route.path === "/leaderboard");
const isNotifications = computed(() => showNotificationsPopUp.value);
const isFriendsModal = computed(() => showFriendsModal.value);

function openFriendsModal() {
  showFriendsModal.value = true;
}
function closeFriendsModal() {
  showFriendsModal.value = false;
}
function openNotificationsPopUp() {
  showNotificationsPopUp.value = true;
}
function closeNotificationsPopUp() {
  showNotificationsPopUp.value = false;
}
function goLeaderboard() {
  router.push("/leaderboard");
}
function goHome() {
  router.push("/home");
}
</script>

<template>
  <header class="top-bar">
    <div class="container-fluid d-flex align-items-center justify-content-between py-2 px-3">
      <h2 class="auth-name mb-0">{{ auth.displayName }}</h2>
      <div class="d-flex align-items-center gap-2 ms-2">
        <div @click="goHome" class="buttons" :class="{ active: isHome }">
          <img :src="homeImg" alt="Home" />
        </div>
        <div @click="goLeaderboard" class="buttons" :class="{ active: isLeaderboard }">
          <img :src="leaderboardImg" alt="Leaderboard" />
        </div>
        <div @click="openFriendsModal" class="buttons" :class="{ active: isFriendsModal }">
          <b>+</b>
        </div>
        <div @click="openNotificationsPopUp" class="buttons" :class="{ active: isNotifications }">
          <img :src="bellImg" alt="Notifications" />
          <span v-if="friendRequestsStore.incomingCount" class="badge">
            {{ friendRequestsStore.incomingCount }}
          </span>
        </div>
      </div>
      <NotificationsPopUp v-if="showNotificationsPopUp" @close-notifications-pop-up="closeNotificationsPopUp" />
      <FriendsModal v-if="showFriendsModal" @close-friend-modal="closeFriendsModal" />
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  background-color: #9fb9ff;
  width: 100%;
}

.buttons.active {
  background: rgb(255, 230, 0);
}

.buttons {
  background-color: white;
  width: 50px;
  height: 50px;
  border-radius: 6px;
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.buttons img {
  border-radius: 6px;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

@media (max-width: 480px) {
  .auth-name {
    font-size: 0.8rem;
    max-width: 45vw;
  }
}
</style>
