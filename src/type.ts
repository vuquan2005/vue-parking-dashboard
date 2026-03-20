export type SlotStatus = 'NO_PALLET' | 'EMPTY' | 'OCCUPIED' | 'PROCESSING' | 'PENDING'

export interface ParkingSlot {
    id: string
    status: SlotStatus
    plateNumber?: string
}

export type EventType = 'IN' | 'OUT'
export type EventStatus = 'Success' | 'Processing'

export interface ParkingEvent {
    id: number
    type: EventType
    plateNumber: string
    slotId: string
    status: EventStatus
    process?: number
    timestamp: number
}
