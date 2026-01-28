<script setup>
import { ref } from "vue";

const toasts = ref([]);

function showToast(message) {
    console.log("[Toast] showToast", message);
    const id = Date.now() + Math.random();
    toasts.value.push({ id, message });

    setTimeout(() => {
        toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 2500);
}
defineExpose({ showToast });
</script>

<template>
    <div class="toast-box">
        <div v-for="t in toasts" :key="t.id" class="toast">
            {{ t.message }} <i class="fa-solid fa-check"></i>
        </div>
    </div>
</template>

<style scoped>
.toast-box {
    position: absolute;
    bottom: 30px;
    right: 30px;
    display: flex;
    align-items: flex-end;
    flex-direction: column;
    overflow: hidden;
}

.toast {
    background: #ffffff;
    color: rgb(0, 0, 0);
    padding: 12px 18px;
    border-radius: 8px;
    margin: 10px 0;
    display: block !important;
    box-shadow: 0 0px 20px rgba(0, 0, 0, 0.3);
}
</style>
