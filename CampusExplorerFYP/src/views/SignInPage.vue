<!-- filepath: c:\Users\ryanp\Git\CampusExplorer\CampusExplorerFYP\src\SignIn.vue -->
<template>
  <button @click="goToIntroduction">
    What is Campus Explorer?
  </button>
  <div class="signin">
    <h1>{{ needsRegister ? 'Create Account' : 'Sign In' }}</h1>

    <form @submit.prevent="onSubmit">
      <label for="email">Email</label>
      <input id="email" type="email" v-model.trim="email" autocomplete="email" required />

      <label for="password">Password</label>
      <input id="password" type="password" v-model="password" autocomplete="current-password" required />

      <button type="submit" :disabled="auth.loading">
        {{ needsRegister ? 'Sign Up' : 'Sign In' }}
      </button>

      <button type="button" class="link" @click="needsRegister = !needsRegister">
        {{ needsRegister ? 'Have an account? Sign in' : 'No account? Create one' }}
      </button>

      <p class="error" v-if="auth.error">{{ auth.error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const needsRegister = ref(false)

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

function goToIntroduction() {
  router.push('/')
}

async function onSubmit() {
  if (!email.value || !password.value) return

  try {
    if (needsRegister.value) {
      // create account in Firebase Auth
      await auth.register(email.value, password.value)
    } else {
      await auth.login(email.value, password.value)
    }
    // redirect back to original page or home
    const redirect = route.query.redirect || '/home'
    router.replace(redirect)
  } catch {
    // error message is already set in auth.error
  }
}
</script>

<style scoped>
.signin {
  max-width: 360px;
  margin: 4rem auto;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

form {
  display: grid;
  gap: 0.75rem;
}

input {
  padding: 0.5rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

button {
  margin-top: 0.25rem;
  padding: 0.55rem 0.8rem;
}

button.link {
  background: transparent;
  color: #2563eb;
  text-decoration: underline;
}

.error {
  color: #b91c1c;
  font-size: 0.9rem;
}
</style>