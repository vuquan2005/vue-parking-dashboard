<script setup lang="ts">
import { useParkingStore } from '@/stores/parking'
import { Clock, Car } from 'lucide-vue-next'

const store = useParkingStore()
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
    <h2 class="mb-5 shrink-0 flex items-center gap-2 text-base font-semibold text-gray-700">
      <Clock class="w-5 h-5 text-gray-500" />
      Lịch sử ra vào
    </h2>

    <div class="flex flex-col gap-3 overflow-y-auto pr-2 min-h-0 flex-1">
      <div
        v-for="event in store.events"
        :key="event.id"
        class="rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-shadow hover:shadow-sm"
      >
        <!-- Header row: badge + timestamp -->
        <div class="mb-2 flex items-center justify-between">
          <span
            :class="[
              'rounded-md px-2.5 py-1 text-xs font-bold tracking-wide uppercase',
              event.type === 'IN' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700',
            ]"
          >
            {{ event.type === 'IN' ? 'Xe vào' : 'Xe ra' }}
          </span>
          <span class="text-xs text-gray-600">{{ event.timestamp }}</span>
        </div>

        <!-- Details -->
        <div class="space-y-1 text-sm text-gray-600">
          <p class="flex items-center">
            <span class="font-semibold text-gray-500">#</span>
            <span class="ml-1">{{ event.plateNumber }}</span>
            <span class="ml-15 text-gray-400 flex items-center gap-1">
              <Car class="w-3.5 h-3.5" />
              Vị trí
            </span>
            <span class="ml-2 font-bold text-gray-700">{{ event.slotId }}</span>
          </p>
          <p>
            <span class="text-gray-400">⇆</span>
            Trạng thái:
            <span
              :class="[
                'font-semibold',
                event.status === 'Success' ? 'text-emerald-600' : 'text-yellow-600',
              ]"
            >
              {{ event.status }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
