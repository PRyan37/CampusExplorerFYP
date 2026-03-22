<script setup>
import { ref, computed } from "vue";
import { useFriendsStore } from "./stores/friends";
import { useFriendRequestsStore } from "./stores/friendRequests";
import { app } from "@/firebase/Firebase";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "./stores/toast";
import { getFunctions, httpsCallable } from "firebase/functions";

const friendsStore = useFriendsStore();
const friendRequestsStore = useFriendRequestsStore();
const authStore = useAuthStore();
const toast = useToastStore();

const functions = getFunctions(app);
const searchUsersCall = httpsCallable(functions, "searchUsers");

const email = ref("");
const isSubmitting = ref(false);

const searchResults = ref([]);
const loadingUsers = ref(false);
const usersError = ref("");

const MIN_SEARCH_CHARS = 3;

async function runSearch() {
  const q = email.value.trim();
  usersError.value = "";

  if (q.length < MIN_SEARCH_CHARS) {
    searchResults.value = [];
    return;
  }

  loadingUsers.value = true;
  try {
    const res = await searchUsersCall({ query: q, limit: 8 });
    const users = (res.data && res.data.users) || [];

    // filter out self by email
    const myEmail = (authStore.user?.email || "").toLowerCase();
    searchResults.value = users.filter((u) => (u.email || "").toLowerCase() !== myEmail);
  } catch (e) {
    console.error("[AddFriends] searchUsers failed:", e);
    usersError.value = "Failed to search users.";
    toast.show("Failed to search users.", { type: "error", duration: 4000 });
  } finally {
    loadingUsers.value = false;
  }
}

const showSuggestions = computed(() => {
  return email.value.trim().length >= MIN_SEARCH_CHARS && searchResults.value.length > 0;
});
function chooseUser(u) {
  if (u.email) {
    email.value = u.email;
  }
}

async function onSubmit() {
  try {
    isSubmitting.value = true;
    await friendRequestsStore.sendFriendRequest(email.value);
  } catch (e) {
    console.error("addFriend failed:", e);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="add-friend-modal">
    <h2>Add Friend</h2>

    <form @submit.prevent="onSubmit">
      <label for="email">Enter the email of the user you would like to add</label>

      <div class="input-wrap">
        <input id="email" type="email" v-model.trim="email" autocomplete="email" required
          :disabled="friendRequestsStore.loading || isSubmitting" @input="runSearch" />

        <div v-if="loadingUsers" class="hint">Searching users…</div>
        <div v-else-if="usersError" class="hint error">{{ usersError }}</div>

        <div v-else-if="email.trim().length > 0 && email.trim().length < MIN_SEARCH_CHARS" class="hint">
          Type {{ MIN_SEARCH_CHARS - email.trim().length }} more character(s) to search…
        </div>

        <ul v-else class="suggestions" v-show="showSuggestions">
          <li v-for="u in searchResults" :key="u.email || u.uid" class="suggestion" @click="chooseUser(u)">
            <span class="s-email">{{ u.email }}</span>
            <span v-if="u.displayName" class="s-name">({{ u.displayName }})</span>
          </li>
        </ul>
      </div>

      <button type="submit" :disabled="friendRequestsStore.loading || isSubmitting">
        Add Friend
      </button>

      <p class="error" v-if="friendsStore.error">{{ friendsStore.error }}</p>
    </form>
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
  z-index: 9999;
}

.add-friend-modal {
  background: white;
  padding: 16px 24px;
  border-radius: 6px;
  min-width: 280px;
  z-index: 10000;
}

form {
  display: grid;
  gap: 0.75rem;
}

.input-wrap {
  position: relative;
  display: grid;
  gap: 6px;
}

input {
  padding: 0.5rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.hint {
  font-size: 0.85rem;
  color: #475569;
}

button {
  margin-top: 0.25rem;
  padding: 0.55rem 0.8rem;
}

.error {
  color: #b91c1c;
  font-size: 0.9rem;
}

.suggestions {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.suggestion {
  padding: 8px 10px;
  cursor: pointer;
  display: flex;
  gap: 6px;
  align-items: center;
}

.suggestion:hover {
  background: #f1f5f9;
}

.s-name {
  color: #64748b;
  font-size: 0.85rem;
}
</style>
