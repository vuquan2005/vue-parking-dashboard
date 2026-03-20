import { useParkingStore } from '@/stores/parking'
import type { ParkingSlot, ParkingEvent } from '@/type'
import { randomHexString } from '@/utils/hex'

export function initMockStore() {
    const parkingStore = useParkingStore()

    const pA3 = randomHexString(4)
    const pB1 = randomHexString(4)
    const pB2 = randomHexString(4)
    const pC1 = randomHexString(4)
    const pC3 = randomHexString(4)
    const pA1 = randomHexString(4)

    const mockSlots: ParkingSlot[] = [
        { slotLabel: 'A1', status: 'EMPTY' },
        { slotLabel: 'A2', status: 'EMPTY' },
        { slotLabel: 'A3', status: 'OCCUPIED', rfid: pA3 },
        { slotLabel: 'A4', status: 'EMPTY' },

        { slotLabel: 'B1', status: 'OCCUPIED', rfid: pB1 },
        { slotLabel: 'B2', status: 'PROCESSING', rfid: pB2 },
        { slotLabel: 'B3', status: 'NO_PALLET' },
        { slotLabel: 'B4', status: 'EMPTY' },

        { slotLabel: 'C1', status: 'PENDING', rfid: pC1 },
        { slotLabel: 'C2', status: 'EMPTY' },
        { slotLabel: 'C3', status: 'OCCUPIED', rfid: pC3 },
        { slotLabel: 'C4', status: 'NO_PALLET' },
    ]

    const mockEvents: ParkingEvent[] = [
        {
            eventId: 1,
            type: 'IN',
            rfid: pA3,
            slotLabel: 'A3',
            status: 'Success',
            timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        },
        {
            eventId: 2,
            type: 'IN',
            rfid: pB1,
            slotLabel: 'B1',
            status: 'Success',
            timestamp: Date.now() - 1000 * 60 * 45, // 45 minutes ago
        },
        {
            eventId: 3,
            type: 'OUT',
            rfid: pB2,
            slotLabel: 'B2',
            status: 'Processing',
            process: 45, // 45% complete
            timestamp: Date.now() - 1000 * 60 * 2, // 2 minutes ago
        },
        {
            eventId: 4,
            type: 'IN',
            rfid: pC1,
            slotLabel: 'C1',
            status: 'Processing',
            process: 10, // 10% complete
            timestamp: Date.now() - 1000 * 30, // 30 seconds ago
        },
        {
            eventId: 5,
            type: 'OUT',
            rfid: pA1,
            slotLabel: 'A1',
            status: 'Success',
            timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
        },
    ]

    // Initialize store
    parkingStore.updateAllSlot(mockSlots)
    mockEvents.forEach((event) => parkingStore.addEvent(event))

    // Real-time processing mock updates
    setInterval(() => {
        let isSlotChanged = false
        const currentSlots = [...parkingStore.slots]
        // Progress ONLY 1 active event over time to enforce 1 processing slot limit
        const currentEvents = [...parkingStore.events]
        const processingEvent = currentEvents.find((e) => e.status === 'Processing')
        if (processingEvent) {
            const updatedEvent = { ...processingEvent }
            updatedEvent.process =
                (updatedEvent.process || 0) + Math.floor(Math.random() * 15) + 5

            if (updatedEvent.process >= 100) {
                updatedEvent.process = 100
                updatedEvent.status = 'Success'

                // Update slot status accordingly
                const slotIndex = currentSlots.findIndex(
                    (s) => s.slotLabel === updatedEvent.slotLabel,
                )
                if (slotIndex !== -1) {
                    const slot = currentSlots[slotIndex]!
                    if (updatedEvent.type === 'IN') {
                        slot.status = 'OCCUPIED'
                        slot.rfid = updatedEvent.rfid
                    } else if (updatedEvent.type === 'OUT') {
                        slot.status = 'EMPTY'
                        delete slot.rfid
                    }
                    isSlotChanged = true
                }
            } else {
                // Not finished yet, ensure the slot is visually in PROCESSING status
                const slotIndex = currentSlots.findIndex(
                    (s) => s.slotLabel === updatedEvent.slotLabel,
                )
                if (slotIndex !== -1) {
                    const slot = currentSlots[slotIndex]!
                    if (slot.status === 'PENDING') {
                        slot.status = 'PROCESSING'
                        isSlotChanged = true
                    }
                }
            }
            parkingStore.addEvent(updatedEvent)
        } else {
            // Also process PENDING slots that don't have events mapped just in case
            const pendingSlot = currentSlots.find((s) => s.status === 'PENDING')
            if (pendingSlot) {
                pendingSlot.status = 'PROCESSING'
                isSlotChanged = true
            }
        }

        // Check if any slot/event is already processing to only allow 1 slot processing at a time
        const isAnyProcessing =
            currentEvents.some((e) => e.status === 'Processing') ||
            currentSlots.some((s) => s.status === 'PROCESSING' || s.status === 'PENDING')

        // Randomly generate new mock events
        if (!isAnyProcessing && Math.random() < 0.2) {
            // 20% chance every 2 seconds
            const emptySlots = currentSlots.filter((s) => s.status === 'EMPTY')
            const occupiedSlots = currentSlots.filter(
                (s) =>
                    s.status === 'OCCUPIED' &&
                    !currentEvents.find(
                        (e) => e.slotLabel === s.slotLabel && e.status === 'Processing',
                    ),
            )

            const newEvent: Partial<ParkingEvent> = {
                eventId: Date.now(),
                timestamp: Date.now(),
                status: 'Processing',
                process: 0,
            }

            // 50-50 for IN vs OUT, if possible
            if (emptySlots.length > 0 && Math.random() < 0.5) {
                // IN event
                const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)]!
                newEvent.type = 'IN'
                newEvent.slotLabel = slot.slotLabel
                newEvent.rfid = randomHexString(4)

                parkingStore.addEvent(newEvent as ParkingEvent)

                const s = currentSlots.find((s) => s.slotLabel === slot.slotLabel)!
                s.status = 'PROCESSING'
                isSlotChanged = true
            } else if (occupiedSlots.length > 0) {
                // OUT event
                const slot =
                    occupiedSlots[Math.floor(Math.random() * occupiedSlots.length)]!
                newEvent.type = 'OUT'
                newEvent.slotLabel = slot.slotLabel
                newEvent.rfid = slot.rfid!

                parkingStore.addEvent(newEvent as ParkingEvent)

                const s = currentSlots.find((s) => s.slotLabel === slot.slotLabel)!
                s.status = 'PROCESSING'
                isSlotChanged = true
            }
        }

        if (isSlotChanged) {
            parkingStore.updateAllSlot(currentSlots)
        }
    }, 1000)
}
