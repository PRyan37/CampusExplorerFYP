<script setup>
import { ref } from 'vue'
import LeafletMap from '../LeafletMap.vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'



const auth = useAuthStore()
const router = useRouter()

const sult = ref(false)
function toggleSult() {
  sult.value = !sult.value
}
async function logout() {
  console.log("LOG OUT1: ",auth.isAuthenticated)
  await auth.logout()
    router.push('/login') 
    console.log("LOG OUT2: ",auth.isAuthenticated)
}
</script>

<template>
  <h1>Campus Explorer</h1>
  <h2>{{ auth.displayName }}</h2>
  <div class="controls">
    <button @click="toggleSult">Toggle Beer Icon</button>
     <button @click="logout">logout</button>
  </div>
  <LeafletMap :sult="sult" />
</template>

<style scoped>
.controls { display: flex; gap: 8px; justify-content: center; margin: 12px 0; }
</style>