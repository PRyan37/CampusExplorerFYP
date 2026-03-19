<script setup>
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import journeyImg from "./assets/journeyIcon.png";
import leaderboardImg from "./assets/leaderboard.png";
import homeImg from "./assets/homeIcon.png";
import { computed, ref, onBeforeUnmount } from "vue";
import { useFriendRequestsStore } from "./stores/friendRequests";
const friendRequestsStore = useFriendRequestsStore();

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const menuOpen = ref(false);

const isHome = computed(() => route.path === "/home");
const isLeaderboard = computed(() => route.path === "/leaderboard");
const isJourney = computed(() => route.path === "/journey");
const isAddPage = computed(() => route.path === "/add");

function pushWithCurrentQuery(path) {
  router.push({
    path,
    query: { ...route.query },
  });
}

function goLeaderboard() {
  pushWithCurrentQuery("/leaderboard");
}
function goHome() {
  pushWithCurrentQuery("/home");
}
function goJourney() {
  pushWithCurrentQuery("/journey");
}
function goAddPage() {
  pushWithCurrentQuery("/add");
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

async function logout() {
  menuOpen.value = false;
  await auth.logout();
  router.push({
    path: "/login",
    query: { ...route.query },
  });
}

function handleDocumentClick(e) {
  if (!e.target.closest(".profile-menu")) {
    menuOpen.value = false;
  }
}

document.addEventListener("click", handleDocumentClick);

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<template>
  <header class="top-bar">
    <div class="container-fluid d-flex align-items-center justify-content-between py-2 px-3">
      <div class="profile-menu">
        <button class="auth-name-button" @click.stop="toggleMenu">
          <span class="auth-name-text mb-0">{{ auth.displayName }}</span>
        </button>

        <div v-if="menuOpen" class="profile-dropdown">
          <button class="dropdown-item-button" @click="logout">Logout</button>
        </div>
      </div>

      <div class="d-flex align-items-center gap-2 ms-2">
        <div @click="goHome" class="buttons" :class="{ active: isHome }">
          <img :src="homeImg" alt="Home" />
        </div>
        <div @click="goJourney" class="buttons" :class="{ active: isJourney }">
          <img :src="journeyImg" alt="Journey" />
        </div>
        <div @click="goLeaderboard" class="buttons" :class="{ active: isLeaderboard }">
          <img :src="leaderboardImg" alt="Leaderboard" />
          <span v-if="friendRequestsStore.hasIncoming" class="notification-dot"></span>
        </div>
        <div @click="goAddPage" class="buttons" :class="{ active: isAddPage }">
          <b>+</b>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  background-color: #79153d;
  width: 100%;
}

.buttons {
  position: relative;
}

.notification-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ff3b30;
  border: 2px solid #79153d;
}

.buttons.active {
  border-color: #3b82f6;
}

.auth-name-button {
  background: white;
  border: 3px solid #000;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 100px;
  box-sizing: border-box;
}

.auth-name-text {
  display: block;
  min-width: 0;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.8rem;
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

.profile-menu {
  position: relative;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  min-width: 140px;
  background: white;
  border: 2px solid #000;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  z-index: 4000;
  overflow: hidden;
}

.dropdown-item-button {
  width: 100%;
  border: 0;
  background: white;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
}

.dropdown-item-button:hover {
  background: #f3f4f6;
}
</style>
