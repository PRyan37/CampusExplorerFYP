<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
const route = useRoute();
const developerMode = computed(() => route.query.dev === "true");
</script>

<template>
    <slot v-if="developerMode" />
</template>
