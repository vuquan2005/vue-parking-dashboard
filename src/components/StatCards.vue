<script setup lang="ts">
import { useParkingStore } from '@/stores/parking'

const store = useParkingStore()
</script>

<template>
  <div class="grid grid-cols-4 gap-4">
    <!-- Tổng số ô -->
    <div
      class="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md"
    >
      <p class="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">Tổng số ô</p>
      <p class="text-3xl font-bold text-gray-800">{{ store.totalSlots }}</p>
    </div>

    <!-- Trống -->
    <div
      class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center shadow-sm transition-shadow hover:shadow-md"
    >
      <p class="mb-1 text-xs font-semibold tracking-wider text-emerald-600 uppercase">Trống</p>
      <p class="text-3xl font-bold text-emerald-600">{{ store.emptyCount }}</p>
    </div>

    <!-- Đã đỗ (Đầy) -->
    <div
      class="rounded-xl border border-orange-200 bg-orange-50 p-4 text-center shadow-sm transition-shadow hover:shadow-md"
    >
      <p class="mb-1 text-xs font-semibold tracking-wider text-orange-600 uppercase">Đã đỗ</p>
      <p class="text-3xl font-bold text-orange-600">{{ store.fullCount }}</p>
    </div>

    <!-- Đang xử lý -->
    <div
      class="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center shadow-sm transition-shadow hover:shadow-md"
    >
      <p class="mb-1 text-xs font-semibold tracking-wider text-yellow-600 uppercase">Đang xử lý</p>
      <p class="text-3xl font-bold text-yellow-600">{{ store.processingCount }}</p>
    </div>
  </div>
</template>
