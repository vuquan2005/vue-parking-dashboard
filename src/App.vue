<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { initMockStore } from '@/mocks/mockstore'

onMounted(() => {
  initMockStore()
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
