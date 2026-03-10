<script setup lang="ts">
import { useParkingStore } from '@/stores/parking'
import { Car } from 'lucide-vue-next'

const store = useParkingStore()

function slotClasses(status: string) {
  const base = 'flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all'
  switch (status) {
    case 'FULL':
      return `${base} border-red-300 bg-red-50 text-red-600`
    case 'PROCESSING':
      return `${base} border-red-300 bg-red-50 text-red-600`
    case 'EMPTY':
    default:
      return `${base} border-emerald-300 bg-emerald-50 text-emerald-600`
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'FULL':
      return 'FULL'
    case 'PROCESSING':
      return 'PROCESSING'
    case 'EMPTY':
    default:
      return 'EMPTY'
  }
}
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col h-full">
    <h2 class="mb-4 shrink-0 flex items-center gap-2 text-base font-semibold text-gray-700">
      <Car class="w-5 h-5 text-gray-500" />
      Sơ đồ bãi đỗ
    </h2>
    <div class="grid grid-cols-4 gap-3 overflow-y-auto pr-1 min-h-0 flex-1">
      <div v-for="slot in store.slots" :key="slot.id" :class="slotClasses(slot.status)">
        <span class="text-lg font-bold leading-none">{{ slot.id }}</span>
        <div class="flex flex-col items-center justify-center w-full mt-1.5">
          <span
            v-if="slot.plateNumber"
            class="rounded bg-white/50 px-2 py-0.5 text-xs font-bold tracking-widest text-gray-800 shadow-sm ring-1 ring-gray-900/10"
          >
            {{ slot.plateNumber }}
          </span>
          <span v-else class="text-[11px] font-semibold tracking-wider uppercase">
            {{ statusLabel(slot.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
