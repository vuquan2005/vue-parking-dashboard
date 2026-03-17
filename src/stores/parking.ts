import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type SlotStatus = 'NO_PALLET' | 'EMPTY' | 'OCCUPIED' | 'PROCESSING'
export type EventType = 'IN' | 'OUT'
export type EventStatus = 'Success' | 'Processing'

export interface ParkingSlot {
    id: string
    status: SlotStatus
    plateNumber?: string
}

export interface ParkingEvent {
    id: number
    type: EventType
    plateNumber: string
    slotId: string
    status: EventStatus
    timestamp: string
}

export type FilterType = SlotStatus | null

export const useParkingStore = defineStore('parking', () => {
    const selectedFilter = ref<FilterType>(null)

    function toggleFilter(filter: FilterType) {
        selectedFilter.value = selectedFilter.value === filter ? null : filter
    }

    function addEvent(event: ParkingEvent) {
        events.value.push(event)
        localStorage.setItem('events', JSON.stringify(events.value))
    }

    function updateAllSlot(newSlots: ParkingSlot[]) {
        slots.value = newSlots
        localStorage.setItem('slots', JSON.stringify(newSlots))
    }

    const slots = ref<ParkingSlot[]>([])

    const events = ref<ParkingEvent[]>([])

    const totalSlots = computed(() => slots.value.length)
    const noPalletCount = computed(() => slots.value.filter((s) => s.status === 'NO_PALLET').length)
    const emptyCount = computed(() => slots.value.filter((s) => s.status === 'EMPTY').length)
    const occupiedCount = computed(() => slots.value.filter((s) => s.status === 'OCCUPIED').length)
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
