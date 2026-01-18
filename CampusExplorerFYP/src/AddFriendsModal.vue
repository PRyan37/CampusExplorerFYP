<script setup>
import { ref } from 'vue'
import { useFriendsStore } from './stores/friends'
import { useFriendRequestsStore } from './stores/friendRequests'
const friendsStore = useFriendsStore()
const friendRequestsStore = useFriendRequestsStore()
const emit = defineEmits(['closeFriendModal'])
const email = ref('')
async function onSubmit() {
  try {
    await friendRequestsStore.sendFriendRequest(email.value)
    emit('closeFriendModal')
  } catch (e) {
    console.error('addFriend failed:', e)

  }
}
</script>

<template>
  <div class="backdrop" @click.self="emit('closeFriendModal')">
    <div class="modal">
      <h2>Add Friend</h2>
      <form @submit.prevent="onSubmit">
        <label for="email">Enter the email of the user you would like to add</label>
        <input id="email" type="email" v-model.trim="email" autocomplete="email" required />
        <button type="submit">
          Add Friend
        </button>
        <p class="error" v-if="friendsStore.error">{{ friendsStore.error }}</p>
      </form>
    </div>
  </div>


</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: white;
  padding: 16px 24px;
  border-radius: 6px;
  min-width: 280px;
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