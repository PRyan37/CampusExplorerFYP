<script setup>
import { watch } from "vue";
import { useToastStore } from "@/stores/toast";
const toast = useToastStore();
watch(
    () => toast.toasts.length,
    (n, o) => {
        console.log("[Toast.vue] toasts length changed", o, "->", n, toast.toasts);
    },
    { immediate: true },
);
</script>

<template>
    <div class="toast-box" v-if="toast.toasts.length">
        <div v-for="t in toast.toasts" :key="t.id" class="toast">
            {{ t.message }}
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
