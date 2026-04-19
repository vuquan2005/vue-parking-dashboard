<script setup lang="ts">
import { useParkingStore } from '@/stores/parking'
import { Clock, Car } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { formatUnixTimestamp } from '@/utils/time'

const store = useParkingStore()
const eventsNewestFirst = computed(() => {
  const labelFilter = store.selectedSlotLabel
  const events = labelFilter
    ? store.events.filter((event) => event.slotLabel === labelFilter)
    : store.events

  return [...events].reverse()
})
const highlightedEventId = ref<number | null>(null)
const latestEventId = ref<number | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | null = null

watch(
  eventsNewestFirst,
  (events) => {
    const newestId = events[0]?.eventId ?? null

    if (newestId === null) {
      return
    }

    // bỏ qua sự kiện đầu tiên khi khởi động để tránh highlight nhầm
    // if (latestEventId.value === null) {
    //   latestEventId.value = newestId
    //   return
    // }

    if (newestId !== latestEventId.value) {
      highlightedEventId.value = newestId
      latestEventId.value = newestId

      if (highlightTimer) {
        clearTimeout(highlightTimer)
      }

      highlightTimer = setTimeout(() => {
        highlightedEventId.value = null
        highlightTimer = null
      }, 1600)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (highlightTimer) {
    clearTimeout(highlightTimer)
  }
})
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
    <div class="mb-5 shrink-0 flex items-center justify-between gap-3">
      <h2 class="flex items-center gap-2 text-base font-semibold text-gray-700">
        <Clock class="w-5 h-5 text-gray-500" />
        Lịch sử ra vào
      </h2>

      <button v-if="store.selectedSlotLabel" type="button"
        class="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
        @click="store.toggleSlotLabelFilter(store.selectedSlotLabel)">
        {{ store.selectedSlotLabel }} x
      </button>
    </div>

    <TransitionGroup name="log-list" tag="div"
      class="flex flex-col gap-3 overflow-y-auto overflow-x-hidden pr-2 min-h-0 flex-1">
      <div v-for="event in eventsNewestFirst" :key="event.eventId" :class="[
        'cursor-pointer rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-shadow hover:shadow-sm',
        event.eventId === highlightedEventId ? 'log-item-highlight' : '',
        store.selectedSlotLabel === event.slotLabel ? 'border-indigo-300 bg-indigo-50/40 shadow-sm' : '',
      ]" @click="store.toggleSlotLabelFilter(event.slotLabel)">
        <!-- Header row: badge + timestamp -->
        <div class="mb-2 flex items-center justify-between">
          <span :class="[
            'rounded-md px-2.5 py-1 text-xs font-bold tracking-wide uppercase',
            event.type === 'IN'
              ? 'bg-red-100 text-red-700'
              : 'bg-emerald-100 text-emerald-700',
          ]">
            {{ event.type === 'IN' ? 'Xe vào' : 'Xe ra' }}
          </span>
          <span class="text-xs text-gray-600">{{
            formatUnixTimestamp(event.timestamp)
            }}</span>
        </div>

        <!-- Details -->
        <div class="space-y-1 text-sm text-gray-600">
          <p class="flex items-center">
            <span class="text-gray-400 flex items-center gap-1">
              <Car class="w-3.5 h-3.5" />
              Vị trí
            </span>
            <span class="ml-2 font-bold text-gray-700">{{ event.slotLabel }}</span>
          </p>
          <p>
            <span class="text-gray-400">⇆</span>
            Trạng thái:
            <span :class="[
              'font-semibold',
              event.status === 'Success' ? 'text-emerald-600' : 'text-yellow-600',
            ]">
              {{ event.status }}
            </span>
          </p>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.log-list-enter-active,
.log-list-leave-active {
  transition: all 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.log-list-enter-from,
.log-list-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.98);
}

.log-list-move {
  transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.log-item-highlight {
  animation: log-item-flash 1.6s ease;
}

@keyframes log-item-flash {
  0% {
    background-color: rgba(255, 255, 153, 0.05);
    border-color: rgba(215, 215, 0, 0.3);
    box-shadow: 0 0 4px rgba(255, 255, 153, 0.4);
  }

  30% {
    background-color: rgba(255, 255, 102, 0.05);
    border-color: rgba(216, 216, 0, 0.3);
    box-shadow: 0 0 6px rgba(255, 255, 102, 0.4);
  }

  100% {
    background-color: transparent;
  }
}
</style>
