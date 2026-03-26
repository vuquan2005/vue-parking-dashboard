<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { initMockWs } from '@/mocks/mockws'
import { connect } from '@/services/websocket'

const isMock = import.meta.env.VITE_WS_MOCK

if (isMock) {
  onMounted(() => {
    initMockWs()
  })
} else {
  onMounted(() => {
    connect()
  })
}
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
