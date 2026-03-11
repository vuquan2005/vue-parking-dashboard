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
    const wsConnected = ref(true)
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

    const slots = ref<ParkingSlot[]>([
        { id: 'A1', status: 'OCCUPIED', plateNumber: 'E2:00:10:21' },
        { id: 'A2', status: 'EMPTY' },
        { id: 'A3', status: 'OCCUPIED' },
        { id: 'A4', status: 'OCCUPIED', plateNumber: '51:G5:67:89' },
        { id: 'B1', status: 'EMPTY', plateNumber: 'F9:87:65:43' },
        { id: 'B2', status: 'OCCUPIED', plateNumber: '30:E1:23:45' },
        { id: 'B3', status: 'EMPTY' },
        { id: 'B4', status: 'NO_PALLET' },
        { id: 'C1', status: 'EMPTY' },
        { id: 'C2', status: 'OCCUPIED', plateNumber: 'A1:B2:C3:D4' },
        { id: 'C3', status: 'NO_PALLET' },
        { id: 'C4', status: 'EMPTY', plateNumber: '30:K9:99:K9' },
    ])

    const events = ref<ParkingEvent[]>([
        {
            id: 1,
            type: 'IN',
            plateNumber: 'E2:00:10:21',
            slotId: 'A1',
            status: 'Success',
            timestamp: '10:30:45 10/03/2026',
        },
        {
            id: 2,
            type: 'OUT',
            plateNumber: 'A1:B2:C3:D4',
            slotId: 'C2',
            status: 'Success',
            timestamp: '10:15:12 10/03/2026',
        },
        {
            id: 3,
            type: 'IN',
            plateNumber: 'F9:87:65:43',
            slotId: 'B1',
            status: 'Success',
            timestamp: '09:45:00 10/03/2026',
        },
        {
            id: 4,
            type: 'IN',
            plateNumber: '29:A1:23:45',
            slotId: 'D4',
            status: 'Success',
            timestamp: '08:12:30 10/03/2026',
        },
        {
            id: 5,
            type: 'IN',
            plateNumber: '30:K9:99:K9',
            slotId: 'C4',
            status: 'Success',
            timestamp: '07:50:00 10/03/2026',
        },
        {
            id: 6,
            type: 'IN',
            plateNumber: '51:G5:F7:89',
            slotId: 'A4',
            status: 'Success',
            timestamp: '07:20:15 10/03/2026',
        },
    ])

    const totalSlots = computed(() => slots.value.length)
    const noPalletCount = computed(() => slots.value.filter((s) => s.status === 'NO_PALLET').length)
    const emptyCount = computed(() => slots.value.filter((s) => s.status === 'EMPTY').length)
    const occupiedCount = computed(() => slots.value.filter((s) => s.status === 'OCCUPIED').length)
    const processingCount = computed(
        () => slots.value.filter((s) => s.status === 'PROCESSING').length,
    )

    return {
        wsConnected,
        selectedFilter,
        toggleFilter,
        slots,
        events,
        totalSlots,
        noPalletCount,
        emptyCount,
        occupiedCount,
        processingCount,
    }
})
