export type SlotStatus = 'NO_PALLET' | 'EMPTY' | 'OCCUPIED' | 'PROCESSING' | 'PENDING'

export interface ParkingSlot {
    slotLabel: string
    status: SlotStatus
    rfid?: string
}

export type EventType = 'IN' | 'OUT'
export type EventStatus = 'Success' | 'Processing'

export interface ParkingEvent {
    eventId: number
    type: EventType
    rfid: string
    slotLabel: string
    status: EventStatus
    timestamp: number
    process?: number
}
