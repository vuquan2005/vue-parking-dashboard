/**
 * WebSocket-level mock: generates Protobuf-typed data and feeds it through
 * the real `dispatch()` pipeline (decode → mappers → Pinia stores).
 *
 * This exercises the full data path instead of writing directly to stores.
 */

import {
    Parking,
    SlotStatus_Status,
    ParkingEvent_EventType,
    ParkingSteps_Task,
    ScanResults_WifiAuthMode,
    DeviceStatus_WifiMode,
    type SlotStatus,
    type ParkingEvent as ProtoParkingEvent,
    type ParkingSteps,
} from '@/services/parking'
import { dispatch, setStatus } from '@/services/websocket'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomBytes(len: number): Uint8Array {
    const buf = new Uint8Array(len)
    for (let i = 0; i < len; i++) buf[i] = Math.floor(Math.random() * 256)
    return buf
}

let eventIdCounter = 1

// ---------------------------------------------------------------------------
// Initial mock protobuf data
// ---------------------------------------------------------------------------

const rfidA3 = randomBytes(10)
const rfidB1 = randomBytes(10)
const rfidB2 = randomBytes(10)
const rfidC1 = randomBytes(10)
const rfidC3 = randomBytes(10)
const rfidA1 = randomBytes(10)

function buildInitialSlots(): SlotStatus[] {
    return [
        { slotId: 1, status: SlotStatus_Status.EMPTY, rfid: [] },
        { slotId: 2, status: SlotStatus_Status.EMPTY, rfid: [] },
        { slotId: 3, status: SlotStatus_Status.OCCUPIED, rfid: [rfidA3] },
        { slotId: 4, status: SlotStatus_Status.EMPTY, rfid: [] },

        { slotId: 5, status: SlotStatus_Status.OCCUPIED, rfid: [rfidB1] },
        { slotId: 6, status: SlotStatus_Status.PROCESSING, rfid: [rfidB2] },
        { slotId: 7, status: SlotStatus_Status.NO_PALLET, rfid: [] },
        { slotId: 8, status: SlotStatus_Status.EMPTY, rfid: [] },

        { slotId: 9, status: SlotStatus_Status.PENDING, rfid: [rfidC1] },
        { slotId: 10, status: SlotStatus_Status.EMPTY, rfid: [] },
        { slotId: 11, status: SlotStatus_Status.OCCUPIED, rfid: [rfidC3] },
        { slotId: 12, status: SlotStatus_Status.NO_PALLET, rfid: [] },
    ]
}

function buildInitialEvents(): ProtoParkingEvent[] {
    return [
        {
            eventId: eventIdCounter++,
            slotId: 3,
            timestamp: Date.now() - 1000 * 60 * 60 * 2,
            eventType: ParkingEvent_EventType.IN,
            rfid: rfidA3,
            step: 5,
            totalSteps: 5,
            currentStep: undefined,
        },
        {
            eventId: eventIdCounter++,
            slotId: 5,
            timestamp: Date.now() - 1000 * 60 * 45,
            eventType: ParkingEvent_EventType.IN,
            rfid: rfidB1,
            step: 5,
            totalSteps: 5,
            currentStep: undefined,
        },
        {
            eventId: eventIdCounter++,
            slotId: 6,
            timestamp: Date.now() - 1000 * 60 * 2,
            eventType: ParkingEvent_EventType.OUT,
            rfid: rfidB2,
            step: 2,
            totalSteps: 5,
            currentStep: { stepId: 2, task: ParkingSteps_Task.MOVE_LEFT },
        },
        {
            eventId: eventIdCounter++,
            slotId: 9,
            timestamp: Date.now() - 1000 * 30,
            eventType: ParkingEvent_EventType.IN,
            rfid: rfidC1,
            step: 1,
            totalSteps: 5,
            currentStep: { stepId: 1, task: ParkingSteps_Task.MOVE_UP },
        },
        {
            eventId: eventIdCounter++,
            slotId: 1,
            timestamp: Date.now() - 1000 * 60 * 60 * 5,
            eventType: ParkingEvent_EventType.OUT,
            rfid: rfidA1,
            step: 5,
            totalSteps: 5,
            currentStep: undefined,
        },
    ]
}

// ---------------------------------------------------------------------------
// Encode → decode → dispatch  (full pipeline)
// ---------------------------------------------------------------------------

function sendMockMessage(msg: Parameters<typeof Parking.encode>[0]) {
    const bytes = Parking.encode(msg).finish()
    const decoded = Parking.decode(bytes)
    dispatch(decoded)
}

// ---------------------------------------------------------------------------
// Simulation state (mutable copies of slot / event arrays)
// ---------------------------------------------------------------------------

let slots: SlotStatus[] = []
let events: ProtoParkingEvent[] = []

// RFID tracking for occupied slots (slotId → rfid bytes)
const slotRfidMap = new Map<number, Uint8Array>()

// ---------------------------------------------------------------------------
// Periodic simulation logic
// ---------------------------------------------------------------------------

const TASKS: ParkingSteps_Task[] = [
    ParkingSteps_Task.MOVE_UP,
    ParkingSteps_Task.MOVE_LEFT,
    ParkingSteps_Task.PICK_UP,
    ParkingSteps_Task.MOVE_RIGHT,
    ParkingSteps_Task.MOVE_DOWN,
]

function tick() {
    // 1. Progress any processing event
    const processingEvent = events.find((e) => e.totalSteps > 0 && e.step < e.totalSteps)

    if (processingEvent) {
        const increment = Math.floor(Math.random() * 2) + 1
        processingEvent.step = Math.min(
            processingEvent.step + increment,
            processingEvent.totalSteps,
        )
        const stepIdx = Math.min(processingEvent.step - 1, TASKS.length - 1)
        processingEvent.currentStep = {
            stepId: processingEvent.step,
            task: TASKS[stepIdx]!,
        }

        // Send event update
        sendMockMessage({ parkingEvent: processingEvent })

        // Update slot status
        const slot = slots.find((s) => s.slotId === processingEvent.slotId)
        if (slot) {
            if (processingEvent.step >= processingEvent.totalSteps) {
                // Completed
                if (processingEvent.eventType === ParkingEvent_EventType.IN) {
                    slot.status = SlotStatus_Status.OCCUPIED
                    slot.rfid = [processingEvent.rfid]
                    slotRfidMap.set(slot.slotId, processingEvent.rfid)
                } else {
                    slot.status = SlotStatus_Status.EMPTY
                    slot.rfid = []
                    slotRfidMap.delete(slot.slotId)
                }
            } else if (slot.status === SlotStatus_Status.PENDING) {
                slot.status = SlotStatus_Status.PROCESSING
            }

            sendMockMessage({ parkingStatus: { slots } })
        }
    } else {
        // 2. Maybe start a new event
        const isAnyBusy = slots.some(
            (s) =>
                s.status === SlotStatus_Status.PROCESSING ||
                s.status === SlotStatus_Status.PENDING,
        )

        if (!isAnyBusy && Math.random() < 0.2) {
            const emptySlots = slots.filter((s) => s.status === SlotStatus_Status.EMPTY)
            const occupiedSlots = slots.filter(
                (s) => s.status === SlotStatus_Status.OCCUPIED,
            )

            let newEvent: ProtoParkingEvent | null = null

            if (emptySlots.length > 0 && Math.random() < 0.5) {
                // IN event
                const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)]!
                const rfid = randomBytes(10)
                newEvent = {
                    eventId: eventIdCounter++,
                    slotId: slot.slotId,
                    timestamp: Date.now(),
                    eventType: ParkingEvent_EventType.IN,
                    rfid,
                    step: 0,
                    totalSteps: 5,
                    currentStep: { stepId: 0, task: ParkingSteps_Task.MOVE_UP },
                }
                slot.status = SlotStatus_Status.PROCESSING
            } else if (occupiedSlots.length > 0) {
                // OUT event
                const slot =
                    occupiedSlots[Math.floor(Math.random() * occupiedSlots.length)]!
                const rfid = slotRfidMap.get(slot.slotId) ?? randomBytes(10)
                newEvent = {
                    eventId: eventIdCounter++,
                    slotId: slot.slotId,
                    timestamp: Date.now(),
                    eventType: ParkingEvent_EventType.OUT,
                    rfid,
                    step: 0,
                    totalSteps: 5,
                    currentStep: { stepId: 0, task: ParkingSteps_Task.MOVE_UP },
                }
                slot.status = SlotStatus_Status.PROCESSING
            }

            if (newEvent) {
                events.push(newEvent)
                sendMockMessage({ parkingEvent: newEvent })
                sendMockMessage({ parkingStatus: { slots } })
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Public init
// ---------------------------------------------------------------------------

export function initMockWs() {
    // Simulate "connected" status
    setStatus('connected')

    // Build initial state
    slots = buildInitialSlots()
    events = buildInitialEvents()

    // Track initial RFIDs
    for (const s of slots) {
        if (s.rfid.length > 0) slotRfidMap.set(s.slotId, s.rfid[0]!)
    }

    // Send initial parking status (all slots)
    sendMockMessage({ parkingStatus: { slots } })

    // Send initial events
    for (const event of events) {
        sendMockMessage({ parkingEvent: event })
    }

    // Send mock device status
    sendMockMessage({
        wifiStatus: {
            connected: true,
            wifiMode: DeviceStatus_WifiMode.WIFI_MODE_APSTA,
            staSsid: 'ParkingNet',
            staIp: '192.168.1.42',
            apSsid: 'ESP32-Parking',
            apIp: '192.168.4.1',
            apPassword: 'parking123',
            rssi: -55,
            channel: 6,
            freeHeap: 123456,
            minFreeHeap: 98000,
            maxFreeBlockSize: 65536,
            uptimeSeconds: 3600,
        },
    })

    // Send mock scan results
    sendMockMessage({
        scanResults: {
            accessPoints: [
                {
                    ssid: 'ParkingNet',
                    bssid: new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0x01]),
                    rssi: -45,
                    channel: 6,
                    encryption: ScanResults_WifiAuthMode.WIFI_AUTH_WPA2_PSK,
                },
                {
                    ssid: 'Office-5G',
                    bssid: new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66]),
                    rssi: -62,
                    channel: 36,
                    encryption: ScanResults_WifiAuthMode.WIFI_AUTH_WPA2_WPA3_PSK,
                },
                {
                    ssid: 'Guest',
                    bssid: new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x01]),
                    rssi: -78,
                    channel: 1,
                    encryption: ScanResults_WifiAuthMode.WIFI_AUTH_OPEN,
                },
            ],
        },
    })

    // Start periodic simulation
    setInterval(tick, 2000)
}
