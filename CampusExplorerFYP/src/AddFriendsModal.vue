```vue // filepath: c:\Users\ryanp\Git\CampusExplorer\CampusExplorerFYP\src\AddFriendsModal.vue
<script setup>
import { ref, computed, onMounted } from "vue";
import { useFriendsStore } from "./stores/friends";
import { useFriendRequestsStore } from "./stores/friendRequests";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/Firebase";
import { useAuthStore } from "@/stores/auth";

const friendsStore = useFriendsStore();
const friendRequestsStore = useFriendRequestsStore();
const authStore = useAuthStore();

const emit = defineEmits(["closeFriendModal"]);

const email = ref("");
const isSubmitting = ref(false);

const users = ref([]);
const loadingUsers = ref(false);
const usersError = ref("");

const MIN_SEARCH_CHARS = 3;

onMounted(async () => {
  try {
    loadingUsers.value = true;
    usersError.value = "";

    const snap = await getDocs(collection(db, "users"));
    users.value = snap.docs
      .map((d) => d.data())
      .filter((u) => u?.email)
      .map((u) => ({
        uid: u.uid,
        email: String(u.email).toLowerCase(),
        displayName: u.displayName ?? u.name ?? "",
      }))
      .filter((u) => u.email !== (authStore.user?.email || "").toLowerCase());
  } catch (e) {
    console.error("[AddFriendsModal] failed to load users:", e);
    usersError.value = "Failed to load users.";
  } finally {
    loadingUsers.value = false;
  }
});

const filteredUsers = computed(() => {
  const q = email.value.trim().toLowerCase();

  // ✅ only start suggesting after 3 characters
  if (q.length < MIN_SEARCH_CHARS) return [];

  return users.value
    .filter(
      (u) => u.email.includes(q) || (u.displayName && u.displayName.toLowerCase().includes(q)),
    )
    .slice(0, 8);
});

const showSuggestions = computed(() => {
  return email.value.trim().length >= MIN_SEARCH_CHARS && filteredUsers.value.length > 0;
});

function chooseUser(u) {
  email.value = u.email;
}

async function onSubmit() {
  try {
    isSubmitting.value = true;
    await friendRequestsStore.sendFriendRequest(email.value);
    emit("closeFriendModal");
  } catch (e) {
    console.error("addFriend failed:", e);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="backdrop" @click.self="emit('closeFriendModal')">
    <div class="add-friend-modal">
      <h2>Add Friend</h2>

      <form @submit.prevent="onSubmit">
        <label for="email">Enter the email of the user you would like to add</label>

        <div class="input-wrap">
          <input id="email" type="email" v-model.trim="email" autocomplete="email" required
            :disabled="friendRequestsStore.loading || isSubmitting" />

          <div v-if="loadingUsers" class="hint">Loading users…</div>
          <div v-else-if="usersError" class="hint error">{{ usersError }}</div>

          <div v-else-if="email.trim().length > 0 && email.trim().length < 3" class="hint">
            Type {{ 3 - email.trim().length }} more character(s) to search…
          </div>

          <ul v-else class="suggestions" v-show="showSuggestions">
            <li v-for="u in filteredUsers" :key="u.email" class="suggestion" @click="chooseUser(u)">
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

/* Suggestions dropdown */
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
```
