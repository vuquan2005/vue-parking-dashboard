import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type SlotStatus = 'EMPTY' | 'FULL' | 'PROCESSING'
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

export const useParkingStore = defineStore('parking', () => {
    const wsConnected = ref(true)

    const slots = ref<ParkingSlot[]>([
        { id: 'A1', status: 'FULL', plateNumber: 'E2001021' },
        { id: 'A2', status: 'EMPTY' },
        { id: 'A3', status: 'EMPTY' },
        { id: 'A4', status: 'FULL', plateNumber: '51G-56789' },
        { id: 'B1', status: 'PROCESSING', plateNumber: 'F9876543' },
        { id: 'B2', status: 'FULL', plateNumber: '30E-12345' },
        { id: 'B3', status: 'EMPTY' },
        { id: 'B4', status: 'EMPTY' },
        { id: 'C1', status: 'EMPTY' },
        { id: 'C2', status: 'FULL', plateNumber: 'A1B2C3D4' },
        { id: 'C3', status: 'EMPTY' },
        { id: 'C4', status: 'PROCESSING', plateNumber: '30K-99999' },
    ])

    const events = ref<ParkingEvent[]>([
        {
            id: 1,
            type: 'IN',
            plateNumber: 'E2001021',
            slotId: 'A1',
            status: 'Success',
            timestamp: '10:30:45 10/03/2026',
        },
        {
            id: 2,
            type: 'OUT',
            plateNumber: 'A1B2C3D4',
            slotId: 'C2',
            status: 'Success',
            timestamp: '10:15:12 10/03/2026',
        },
        {
            id: 3,
            type: 'IN',
            plateNumber: 'F9876543',
            slotId: 'B1',
            status: 'Processing',
            timestamp: '09:45:00 10/03/2026',
        },
        {
            id: 4,
            type: 'IN',
            plateNumber: '29A-12345',
            slotId: 'D4',
            status: 'Success',
            timestamp: '08:12:30 10/03/2026',
        },
        {
            id: 5,
            type: 'IN',
            plateNumber: '30K-99999',
            slotId: 'C4',
            status: 'Processing',
            timestamp: '07:50:00 10/03/2026',
        },
        {
            id: 6,
            type: 'IN',
            plateNumber: '51G-56789',
            slotId: 'A4',
            status: 'Success',
            timestamp: '07:20:15 10/03/2026',
        },
    ])

    const totalSlots = computed(() => slots.value.length)
    const emptyCount = computed(() => slots.value.filter((s) => s.status === 'EMPTY').length)
    const fullCount = computed(() => slots.value.filter((s) => s.status === 'FULL').length)
    const processingCount = computed(
        () => slots.value.filter((s) => s.status === 'PROCESSING').length,
    )

    return {
        wsConnected,
        slots,
        events,
        totalSlots,
        emptyCount,
        fullCount,
        processingCount,
    }
})
