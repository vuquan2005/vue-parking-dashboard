<script setup lang="ts">
import { useParkingStore } from '@/stores/parking'
import { Car } from 'lucide-vue-next'

const store = useParkingStore()

function slotClasses(status: string) {
  const base =
    'relative flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all duration-300'
  switch (status) {
    case 'OCCUPIED':
      return `${base} border-red-300 bg-red-50 text-red-600`
    case 'PROCESSING':
      return `${base} border-yellow-300 bg-yellow-50 text-yellow-600 processing-opacity`
    case 'PENDING':
      return `${base} border-yellow-300 bg-yellow-50/70 text-yellow-600`
    case 'NO_PALLET':
      return `${base} border-dashed border-gray-300 bg-gray-100/60 text-gray-400`
    case 'EMPTY':
    default:
      return `${base} border-emerald-300 bg-emerald-50 text-emerald-600`
  }
}

function filterClasses(status: string) {
  const filter = store.selectedFilter
  if (!filter) return ''
  if (status === filter) return 'scale-[1.005]'
  return 'opacity-30 blur-[1.1px] scale-98'
}

function statusLabel(status: string) {
  switch (status) {
    case 'OCCUPIED':
      return 'CÓ XE'
    case 'PROCESSING':
      return 'ĐANG XỬ LÝ'
    case 'PENDING':
      return 'ĐANG CHỜ'
    case 'NO_PALLET':
      return '---'
    case 'EMPTY':
      return 'TRỐNG'
    default:
      return 'ERROR'
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'OCCUPIED':
      return 'bg-red-100 text-red-700 ring-red-500/20'
    case 'PROCESSING':
      return 'bg-yellow-100 text-yellow-700 ring-yellow-500/20'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700 ring-yellow-500/20'
    case 'NO_PALLET':
      return 'bg-gray-200 text-gray-500 ring-gray-400/20'
    case 'EMPTY':
      return 'bg-emerald-100 text-emerald-700 ring-emerald-500/20'
    default:
      return 'bg-red-100 text-red-700 ring-red-500/20'
  }
}
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col h-full">
    <h2 class="mb-4 shrink-0 flex items-center gap-2 text-base font-semibold text-gray-700">
      <Car class="w-5 h-5 text-gray-500" />
      Sơ đồ bãi đỗ
    </h2>
    <transition-group name="pallet" tag="div" class="grid grid-cols-4 gap-3 overflow-y-auto pr-1 min-h-0 flex-1 relative">
      <div v-for="slot in store.slots" :key="slot.palletId"
        :class="[slotClasses(slot.status), filterClasses(slot.status)]">
        <!-- ID label -->
        <span class="text-lg font-bold leading-none">{{ slot.slotLabel }}</span>

        <div class="flex flex-col items-center justify-center w-full mt-1.5 h-6">
          <span
            class="rounded px-2 py-0.5 font-bold tracking-wider uppercase ring-1 flex items-center justify-center text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
            :class="[
              statusBadgeClass(slot.status),
              slot.rfid ? 'text-xs rounded' : 'text-[10px] rounded-full',
            ]">
            {{ slot.rfid || statusLabel(slot.status) }}
          </span>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.pallet-move {
  transition: transform 0.5s ease-in-out;
}
.processing-opacity {
  animation: processing-opacity 1.4s ease-in-out infinite;
}

@keyframes processing-opacity {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.75;
  }
}
</style>
