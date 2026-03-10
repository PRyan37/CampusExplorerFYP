<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import journeyImg from "./assets/journeyIcon.png";
import leaderboardImg from "./assets/leaderboard.png";
import homeImg from "./assets/homeIcon.png";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

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
</script>

<template>
  <header class="top-bar">
    <div class="container-fluid d-flex align-items-center justify-content-between py-2 px-3">
      <h2 class="auth-name mb-0">{{ auth.displayName }}</h2>
      <div class="d-flex align-items-center gap-2 ms-2">
        <div @click="goHome" class="buttons" :class="{ active: isHome }">
          <img :src="homeImg" alt="Home" />
        </div>
        <div @click="goJourney" class="buttons" :class="{ active: isJourney }">
          <img :src="journeyImg" alt="Journey" />
        </div>
        <div @click="goLeaderboard" class="buttons" :class="{ active: isLeaderboard }">
          <img :src="leaderboardImg" alt="Leaderboard" />
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
