<script setup>
import { ref } from "vue";

const props = defineProps({
    title: {
        type: String,
        required: true,
    },
    startOpen: {
        type: Boolean,
        default: false,
    },
});

const isOpen = ref(props.startOpen);

function toggleOpen() {
    isOpen.value = !isOpen.value;
}
</script>

<template>
    <div class="component-box">
        <button class="box-header" @click="toggleOpen">
            <span>{{ title }}</span>
            <span class="arrow" :class="{ open: isOpen }">▾</span>
        </button>

        <div v-if="isOpen" class="box-content">
            <slot />
        </div>
    </div>
</template>

<style scoped>
.component-box {
    background: white;
    border: 3px solid black;
    border-radius: 16px;
    overflow: hidden;
}

.box-header {
    width: 100%;
    background: white;
    border: 0;
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
    cursor: pointer;
    text-align: left;
}

.box-content {
    padding: 0 16px 16px 16px;
}

.arrow {
    transition: transform 0.2s ease;
}

.arrow.open {
    transform: rotate(180deg);
}
</style>
