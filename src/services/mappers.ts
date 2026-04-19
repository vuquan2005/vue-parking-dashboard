/**
 * Protobuf → UI type mapping utilities.
 *
 * Converts raw protobuf messages from parking.ts into the UI types
 * defined in @/type.ts for use in the Pinia store.
 */

import type {
    ParkingEvent as ProtoParkingEvent,
    ParkingStatus as ProtoParkingStatus,
    ScanResults as ProtoScanResults,
    ScanResults_AP as ProtoAP,
    DeviceStatus as ProtoDeviceStatus,
} from '@/services/parking'
import {
    ParkingStatus_Status,
    ParkingEvent_EventType,
    parkingStatus_StatusToJSON,
    parkingEvent_EventTypeToJSON,
    scanResults_WifiAuthModeToJSON,
    deviceStatus_WifiModeToJSON,
} from '@/services/parking'

import type {
    ParkingSlot,
    ParkingEvent,
    SlotStatus,
    EventType,
    EventStatus,
    AccessPoint,
    DeviceInfo,
    WifiAuthMode,
    WifiMode,
} from '@/type'

// ---------------------------------------------------------------------------
// Slot ID ↔ Label mapping
// ---------------------------------------------------------------------------

const COLUMNS = 4
const PALLET_FIRST_ROW_COLUMNS = COLUMNS // A1..A4
const PALLET_OTHER_ROW_COLUMNS = COLUMNS - 1 // B1..B3, C1..C3, ...

/**
 * Convert a numeric slot_id (1-based) into a label like "A1", "B3", etc.
 *
 * Row = letter (A, B, C, …), Column = number within row (1-based).
 * slot_id 1 → A1, slot_id 5 → B1, slot_id 12 → C4
 */
export function slotIdToLabel(slotId: number): string {
    const rowIndex = Math.floor((slotId - 1) / COLUMNS)
    const colIndex = ((slotId - 1) % COLUMNS) + 1
    const rowLetter = String.fromCharCode(65 + rowIndex) // A=65
    return `${rowLetter}${colIndex}`
}

/**
 * Convert pallet_id (1-based) into label with uneven row capacities:
 * - Row A has 4 positions (A1..A4)
 * - Following rows have 3 positions each (B1..B3, C1..C3, ...)
 */
export function palletIdToLabel(palletId: number): string {
    if (palletId <= 0) return ''

    if (palletId <= PALLET_FIRST_ROW_COLUMNS) {
        return `A${palletId}`
    }

    const remaining = palletId - PALLET_FIRST_ROW_COLUMNS - 1
    const rowOffset = Math.floor(remaining / PALLET_OTHER_ROW_COLUMNS) + 1
    const colIndex = (remaining % PALLET_OTHER_ROW_COLUMNS) + 1
    const rowLetter = String.fromCharCode(65 + rowOffset)

    return `${rowLetter}${colIndex}`
}

// ---------------------------------------------------------------------------
// Byte array → hex string
// ---------------------------------------------------------------------------

/**
 * Convert a Uint8Array of bytes into a colon-delimited hex string.
 *
 * Example: Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]) → "DE:AD:BE:EF"
 */
export function bytesToHex(bytes: Uint8Array): string {
    if (bytes.length === 0) return ''
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(':')
}

// ---------------------------------------------------------------------------
// Protobuf SlotStatus → UI ParkingSlot
// ---------------------------------------------------------------------------

function mapProtoStatusToUI(status: ParkingStatus_Status): SlotStatus {
    switch (status) {
        case ParkingStatus_Status.EMPTY:
            return 'EMPTY'
        case ParkingStatus_Status.OCCUPIED:
            return 'OCCUPIED'
        case ParkingStatus_Status.PROCESSING:
            return 'PROCESSING'
        case ParkingStatus_Status.PENDING:
            return 'PENDING'
        case ParkingStatus_Status.UNKNOWN:
        case ParkingStatus_Status.UNRECOGNIZED:
        default:
            return 'EMPTY'
    }
}

/**
 * Map a single grid position to a UI ParkingSlot.
 *
 * - If palletId is 0, the slot has no pallet → status = NO_PALLET.
 * - Otherwise, look up status from slots[palletId - 1].
 */
export function mapSlotStatus(
    palletId: number,
    index: number,
    slotsArray: ParkingStatus_Status[],
): ParkingSlot {
    if (palletId === 0) {
        return {
            slotLabel: '',
            status: 'NO_PALLET',
            palletId: '0',
        }
    }

    const palletStatus = slotsArray[palletId - 1] ?? ParkingStatus_Status.UNKNOWN

    return {
        slotLabel: palletIdToLabel(palletId),
        status: mapProtoStatusToUI(palletStatus),
        palletId: String(palletId),
    }
}

// ---------------------------------------------------------------------------
// Protobuf ParkingStatus → UI ParkingSlot[]
// ---------------------------------------------------------------------------

export function mapParkingStatus(status: ProtoParkingStatus): ParkingSlot[] {
    return status.palletGrid.map((palletId, index) =>
        mapSlotStatus(palletId, index, status.slots),
    )
}

// ---------------------------------------------------------------------------
// Protobuf ParkingEvent → UI ParkingEvent
// ---------------------------------------------------------------------------

function mapEventType(eventType: ParkingEvent_EventType): EventType {
    const key = parkingEvent_EventTypeToJSON(eventType)
    if (key === 'IN' || key === 'OUT') return key
    return 'IN' // fallback
}

function deriveEventStatus(event: ProtoParkingEvent): EventStatus {
    if (event.isDone) {
        return 'Success'
    }
    return 'Processing'
}

export function mapParkingEvent(event: ProtoParkingEvent): ParkingEvent {
    return {
        eventId: event.eventId,
        type: mapEventType(event.eventType),
        slotLabel: slotIdToLabel(event.slotId),
        status: deriveEventStatus(event),
        timestamp: Number(event.timestamp),
    }
}

// ---------------------------------------------------------------------------
// Protobuf ScanResults → UI AccessPoint[]
// ---------------------------------------------------------------------------

function mapWifiAuthMode(proto: ProtoAP['encryption']): WifiAuthMode {
    const key = scanResults_WifiAuthModeToJSON(proto)
    // strip "WIFI_AUTH_" prefix → "OPEN", "WPA2_PSK", etc.
    const stripped = key.replace(/^WIFI_AUTH_/, '')
    if (stripped === 'UNRECOGNIZED') return 'UNKNOWN'
    return stripped as WifiAuthMode
}

function mapAccessPoint(ap: ProtoAP): AccessPoint {
    return {
        ssid: ap.ssid,
        bssid: bytesToHex(ap.bssid), // reuse hex formatter for MAC bytes
        rssi: ap.rssi,
        channel: ap.channel,
        encryption: mapWifiAuthMode(ap.encryption),
    }
}

export function mapScanResults(results: ProtoScanResults): AccessPoint[] {
    return results.accessPoints.map(mapAccessPoint)
}

// ---------------------------------------------------------------------------
// Protobuf DeviceStatus → UI DeviceInfo
// ---------------------------------------------------------------------------

function mapWifiMode(proto: ProtoDeviceStatus['wifiMode']): WifiMode {
    const key = deviceStatus_WifiModeToJSON(proto)
    const stripped = key.replace(/^WIFI_MODE_/, '')
    if (stripped === 'UNRECOGNIZED') return 'UNKNOWN'
    return stripped as WifiMode
}

export function mapDeviceStatus(status: ProtoDeviceStatus): DeviceInfo {
    return {
        connected: status.connected,
        wifiMode: mapWifiMode(status.wifiMode),
        staSsid: status.staSsid,
        staIp: status.staIp,
        apSsid: status.apSsid,
        apIp: status.apIp,
        apPassword: status.apPassword,
        rssi: status.rssi,
        channel: status.channel,
        freeHeap: status.freeHeap,
        minFreeHeap: status.minFreeHeap,
        maxFreeBlockSize: status.maxFreeBlockSize,
        uptimeSeconds: status.uptimeSeconds,
    }
}
