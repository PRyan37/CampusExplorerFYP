<script setup>
const emit = defineEmits(['openFriendModal']);
function addFriend() {
  console.log("Add Friend Clicked")
  emit('openFriendModal');
}
</script>

<template>
  <div @click="addFriend" class="add-friends ">
    <b>+</b>
  </div>

</template>

<style scoped>
.add-friends {
  width: 50px;
  height: 50px;
  background-color: #d6d6d6;
  border: 3px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>