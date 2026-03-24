<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { initMockStore } from '@/mocks/mockstore'
import { connect } from '@/services/websocket'

const wsUrl = import.meta.env.VITE_WS_URL as string | undefined

if (wsUrl) {
  // WebSocket mode: connect to the device
  onMounted(() => {
    connect(wsUrl)
  })
} else {
  // Demo mode: no WS URL configured → use mock data
  onMounted(() => {
    initMockStore()
  })
}
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
