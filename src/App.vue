<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'

const { initWebSocket } = useWebSocket()

onMounted(() => {
  initWebSocket()
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
