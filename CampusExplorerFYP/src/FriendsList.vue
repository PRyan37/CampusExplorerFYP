<template>
    <div>
        <h2>Your Friends</h2>
        <button @click="loadFriends">Load Friends</button>
        <ul>
            <li v-for="friend in friendsStore.friendsList" :key="friend.id">{{ friend.friendEmail }}</li>
        </ul>
    </div>
</template>

<script setup>
import { onMounted, nextTick } from 'vue'
import { useFriendsStore } from './stores/friends'
const friendsStore = useFriendsStore()


function loadFriends() {
    console.log('Loading friends...')
    friendsStore.fetchFriends()
}
onMounted(async () => {
    await nextTick()
    loadFriends()
})
</script>