import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { SlotStatus, ParkingSlot, ParkingEvent } from '@/type'

export type FilterType = SlotStatus | null

export const useParkingStore = defineStore('parking', () => {
    const selectedFilter = ref<FilterType>(null)

    function toggleFilter(filter: FilterType) {
        selectedFilter.value = selectedFilter.value === filter ? null : filter
    }

    function addEvent(event: ParkingEvent) {
        const existingIndex = events.value.findIndex((e) => e.eventId === event.eventId)
        if (existingIndex >= 0) {
            events.value.splice(existingIndex, 1, event)
        } else {
            events.value.push(event)
        }

        // localStorage.setItem('events', JSON.stringify(events.value))
    }

    function updateAllSlot(newSlots: ParkingSlot[]) {
        slots.value = newSlots
        // localStorage.setItem('slots', JSON.stringify(newSlots))
    }

    const slots = ref<ParkingSlot[]>([])

    const events = ref<ParkingEvent[]>([])

    const totalSlots = computed(() => slots.value.length)
    const noPalletCount = computed(
        () => slots.value.filter((s) => s.status === 'NO_PALLET').length,
    )
    const emptyCount = computed(
        () => slots.value.filter((s) => s.status === 'EMPTY').length,
    )
    const occupiedCount = computed(
        () => slots.value.filter((s) => s.status === 'OCCUPIED').length,
    )
    const processingCount = computed(
        () => slots.value.filter((s) => s.status === 'PROCESSING').length,
    )

    return {
        selectedFilter,
        toggleFilter,
        addEvent,
        updateAllSlot,
        slots,
        events,
        totalSlots,
        noPalletCount,
        emptyCount,
        occupiedCount,
        processingCount,
    }
})
