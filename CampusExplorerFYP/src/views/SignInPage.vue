<template>
  <div class="page">
    <!-- Top right button -->
    <div class="top-bar">
      <button class="intro-btn" @click="goToIntroduction">What is Campus Explorer?</button>
    </div>

    <!-- Sign in card -->
    <div class="signin">
      <h1>{{ needsRegister ? "Create Account" : "Sign In" }}</h1>

      <form @submit.prevent="onSubmit">
        <div class="input-group">
          <label for="email">Email</label>
          <input id="email" type="email" v-model.trim="email" autocomplete="email" required />
        </div>

        <div class="input-group">
          <label for="password">Password</label>
          <input id="password" type="password" v-model="password" autocomplete="current-password" required />
        </div>

        <button class="primary" type="submit" :disabled="auth.loading">
          {{ needsRegister ? "Sign Up" : "Sign In" }}
        </button>

        <button type="button" class="link" @click="needsRegister = !needsRegister">
          {{ needsRegister ? "Have an account? Sign in" : "No account? Create one" }}
        </button>

        <p class="error" v-if="auth.error">{{ auth.error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";

const email = ref("");
const password = ref("");
const needsRegister = ref(false);

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

function goToIntroduction() {
  router.push("/");
}

async function onSubmit() {
  if (!email.value || !password.value) return;

  try {
    if (needsRegister.value) {
      // create account in Firebase Auth
      await auth.register(email.value, password.value);
    } else {
      await auth.login(email.value, password.value);
    }
    // redirect back to original page or home
    const redirect = route.query.redirect || "/home";
    router.replace(redirect);
  } catch {
    // error message is already set in auth.error
  }
}
</script>
<style scoped>
.page {
  min-height: 100vh;
  overflow: hidden;
  background: #f5f5f7;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* Top bar */
.top-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

/* "What is Campus Explorer?" button */
.intro-btn {
  background: transparent;
  border: 2px solid #79153d;
  color: #79153d;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.intro-btn:hover {
  background: #79153d;
  color: white;
}

/* Card */
.signin {
  max-width: 380px;
  width: 100%;
  margin: auto;
  padding: 25px 20px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

/* Title */
h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #79153d;
}

/* Form layout */
form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Input group */
.input-group {
  display: flex;
  flex-direction: column;
}

label {
  font-size: 14px;
  margin-bottom: 5px;
  color: #333;
}

/* Inputs */
input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: 0.2s;
}

input:focus {
  border-color: #79153d;
  outline: none;
  box-shadow: 0 0 0 2px rgba(121, 21, 61, 0.15);
}

/* Primary button */
.primary {
  background: #79153d;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.primary:hover {
  background: #5f1031;
}

/* Toggle link */
button.link {
  background: transparent;
  border: none;
  color: #79153d;
  font-size: 14px;
  cursor: pointer;
}

button.link:hover {
  text-decoration: underline;
}

/* Error */
.error {
  color: #b91c1c;
  font-size: 13px;
  text-align: center;
}
</style>
