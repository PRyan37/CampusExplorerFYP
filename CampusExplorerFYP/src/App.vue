<script setup>
import { useAuthStore } from './stores/auth'
function isAuthenticated() {
  const auth = useAuthStore()
 console.log("IS AUTHENTICATED: ",auth.isAuthenticated)
}
</script>

<template>
  <button @click="isAuthenticated()" >IS AUTHENTICATED</button>
  <RouterView />
</template>


