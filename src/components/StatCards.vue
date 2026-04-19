<script setup lang="ts">
import { useParkingStore } from '@/stores/parking'
import type { FilterType } from '@/stores/parking'

const store = useParkingStore()

function isActive(filter: FilterType) {
  return store.selectedFilter === filter
}
</script>

<template>
  <div class="grid grid-cols-4 gap-4">
    <!-- Tổng số ô -->
    <div
      class="stat-card rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:shadow-md cursor-pointer select-none"
      :class="{ 'ring-1 ring-gray-400 scale-[1.02] shadow-md': isActive(null) && !store.selectedSlotLabel }" @click="store.clearFilters()">
      <p class="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">Tổng số ô</p>
      <p class="text-3xl font-bold text-gray-800">{{ store.totalSlots - store.noPalletCount }}</p>
    </div>

    <!-- Trống (có pallet, chưa có xe) -->
    <div
      class="stat-card rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center shadow-sm transition-all hover:shadow-md cursor-pointer select-none"
      :class="{ 'ring-2 ring-emerald-400 scale-[1.03] shadow-md': isActive('EMPTY') }"
      @click="store.toggleFilter('EMPTY')">
      <p class="mb-1 text-xs font-semibold tracking-wider text-emerald-600 uppercase">Trống</p>
      <p class="text-3xl font-bold text-emerald-600">{{ store.emptyCount }}</p>
    </div>

    <!-- Có xe -->
    <div
      class="stat-card rounded-xl border border-red-200 bg-red-50 p-4 text-center shadow-sm transition-all hover:shadow-md cursor-pointer select-none"
      :class="{ 'ring-2 ring-red-400 scale-[1.03] shadow-md': isActive('OCCUPIED') }"
      @click="store.toggleFilter('OCCUPIED')">
      <p class="mb-1 text-xs font-semibold tracking-wider text-red-600 uppercase">Có xe</p>
      <p class="text-3xl font-bold text-red-600">{{ store.occupiedCount }}</p>
    </div>

    <!-- Đang xử lý -->
    <div
      class="stat-card rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center shadow-sm transition-all hover:shadow-md cursor-pointer select-none"
      :class="{ 'ring-2 ring-yellow-400 scale-[1.03] shadow-md': isActive('PROCESSING') }"
      @click="store.toggleFilter('PROCESSING')">
      <p class="mb-1 text-xs font-semibold tracking-wider text-yellow-600 uppercase">Đang xử lý</p>
      <p class="text-3xl font-bold text-yellow-600">{{ store.processingCount }}</p>
    </div>

    <!-- Không pallet -->
    <!-- <div
      class="stat-card rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center shadow-sm transition-all hover:shadow-md cursor-pointer select-none"
      :class="{ 'ring-2 ring-gray-400 scale-[1.03] shadow-md': isActive('NO_PALLET') }"
      @click="store.toggleFilter('NO_PALLET')"
    >
      <p class="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">Không pallet</p>
      <p class="text-3xl font-bold text-gray-400">{{ store.noPalletCount }}</p>
    </div> -->
  </div>
</template>
