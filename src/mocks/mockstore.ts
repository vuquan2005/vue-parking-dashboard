import { useParkingStore } from '@/stores/parking'
import type { ParkingSlot, ParkingEvent } from '@/type'
import { randomHexString } from '@/utils/hex'

export function initMockStore() {
    const parkingStore = useParkingStore()

    const pA3 = randomHexString(4)
    const pB1 = randomHexString(4)
    const pB2 = randomHexString(4)
    const pB3 = randomHexString(4)
    const pC1 = randomHexString(4)
    const pC3 = randomHexString(4)
    const pA1 = randomHexString(4)

    const mockSlots: ParkingSlot[] = [
        { id: 'A1', status: 'EMPTY' },
        { id: 'A2', status: 'NO_PALLET' },
        { id: 'A3', status: 'OCCUPIED', plateNumber: pA3 },
        { id: 'A4', status: 'EMPTY' },

        { id: 'B1', status: 'OCCUPIED', plateNumber: pB1 },
        { id: 'B2', status: 'PROCESSING', plateNumber: pB2 },
        { id: 'B3', status: 'OCCUPIED', plateNumber: pB3 },
        { id: 'B4', status: 'EMPTY' },

        { id: 'C1', status: 'PENDING', plateNumber: pC1 },
        { id: 'C2', status: 'EMPTY' },
        { id: 'C3', status: 'OCCUPIED', plateNumber: pC3 },
        { id: 'C4', status: 'NO_PALLET' },
    ]

    const mockEvents: ParkingEvent[] = [
        {
            id: 1,
            type: 'IN',
            plateNumber: pA3,
            slotId: 'A3',
            status: 'Success',
            timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        },
        {
            id: 2,
            type: 'IN',
            plateNumber: pB1,
            slotId: 'B1',
            status: 'Success',
            timestamp: Date.now() - 1000 * 60 * 45, // 45 minutes ago
        },
        {
            id: 3,
            type: 'OUT',
            plateNumber: pB2,
            slotId: 'B2',
            status: 'Processing',
            process: 45, // 45% complete
            timestamp: Date.now() - 1000 * 60 * 2, // 2 minutes ago
        },
        {
            id: 4,
            type: 'IN',
            plateNumber: pC1,
            slotId: 'C1',
            status: 'Processing',
            process: 10, // 10% complete
            timestamp: Date.now() - 1000 * 30, // 30 seconds ago
        },
        {
            id: 5,
            type: 'OUT',
            plateNumber: pA1,
            slotId: 'A1',
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

        // Progress events over time
        const currentEvents = [...parkingStore.events]
        currentEvents.forEach((event) => {
            if (event.status === 'Processing') {
                const updatedEvent = { ...event }
                updatedEvent.process =
                    (updatedEvent.process || 0) + Math.floor(Math.random() * 15) + 5

                if (updatedEvent.process >= 100) {
                    updatedEvent.process = 100
                    updatedEvent.status = 'Success'

                    // Update slot status accordingly
                    const slotIndex = currentSlots.findIndex(
                        (s) => s.id === updatedEvent.slotId,
                    )
                    if (slotIndex !== -1) {
                        const slot = currentSlots[slotIndex]!
                        if (updatedEvent.type === 'IN') {
                            slot.status = 'OCCUPIED'
                            slot.plateNumber = updatedEvent.plateNumber
                        } else if (updatedEvent.type === 'OUT') {
                            slot.status = 'EMPTY'
                            delete slot.plateNumber
                        }
                        isSlotChanged = true
                    }
                }
                parkingStore.addEvent(updatedEvent)
            }
        })

        // Also process PENDING slots that don't have events mapped (like C1)
        currentSlots.forEach((slot) => {
            if (slot.status === 'PENDING') {
                slot.status = 'PROCESSING'
                isSlotChanged = true
            }
        })

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
                        (e) => e.slotId === s.id && e.status === 'Processing',
                    ),
            )

            const newEvent: Partial<ParkingEvent> = {
                id: Date.now(),
                timestamp: Date.now(),
                status: 'Processing',
                process: 0,
            }

            // 50-50 for IN vs OUT, if possible
            if (emptySlots.length > 0 && Math.random() < 0.5) {
                // IN event
                const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)]!
                newEvent.type = 'IN'
                newEvent.slotId = slot.id
                newEvent.plateNumber = randomHexString(4)

                parkingStore.addEvent(newEvent as ParkingEvent)

                const s = currentSlots.find((s) => s.id === slot.id)!
                s.status = 'PROCESSING'
                isSlotChanged = true
            } else if (occupiedSlots.length > 0) {
                // OUT event
                const slot =
                    occupiedSlots[Math.floor(Math.random() * occupiedSlots.length)]!
                newEvent.type = 'OUT'
                newEvent.slotId = slot.id
                newEvent.plateNumber = slot.plateNumber!

                parkingStore.addEvent(newEvent as ParkingEvent)

                const s = currentSlots.find((s) => s.id === slot.id)!
                s.status = 'PROCESSING'
                isSlotChanged = true
            }
        }

        if (isSlotChanged) {
            parkingStore.updateAllSlot(currentSlots)
        }
    }, 2000)
}
