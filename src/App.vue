<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { initMockStore } from '@/mocks/mockstore'
import { useParkingWebSocket } from '@/services/websocket'
import { useParkingStore } from '@/stores/parking'

const store = useParkingStore()
const wsUrl = import.meta.env.VITE_WS_URL as string | undefined

if (wsUrl) {
  // WebSocket mode: connect to the device
  const { status, connect } = useParkingWebSocket(wsUrl)

  // Sync connection status to store
  watch(status, (s) => store.updateWsStatus(s), { immediate: true })

  onMounted(() => {
    connect()
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
