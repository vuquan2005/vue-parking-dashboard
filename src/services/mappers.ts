/**
 * Protobuf → UI type mapping utilities.
 *
 * Converts raw protobuf messages from parking.ts into the UI types
 * defined in @/type.ts for use in the Pinia store.
 */

import type {
    SlotStatus as ProtoSlotStatus,
    ParkingEvent as ProtoParkingEvent,
    ParkingStatus as ProtoParkingStatus,
    ScanResults as ProtoScanResults,
    ScanResults_AP as ProtoAP,
    DeviceStatus as ProtoDeviceStatus,
} from '@/services/parking'
import {
    SlotStatus_Status,
    ParkingEvent_EventType,
    slotStatus_StatusToJSON,
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

const COLUMNS = 4 // A1..A4, B1..B4, etc.

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

// ---------------------------------------------------------------------------
// RFID byte array → hex string
// ---------------------------------------------------------------------------

/**
 * Convert a Uint8Array of RFID bytes into a colon-delimited hex string.
 *
 * Example: Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]) → "DE:AD:BE:EF"
 */
export function rfidToHex(bytes: Uint8Array): string {
    if (bytes.length === 0) return ''
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(':')
}

// ---------------------------------------------------------------------------
// Protobuf SlotStatus → UI ParkingSlot
// ---------------------------------------------------------------------------

function mapProtoStatusToUI(status: SlotStatus_Status): SlotStatus {
    const key = slotStatus_StatusToJSON(status)
    // slotStatus_StatusToJSON returns 'UNKNOWN', 'NO_PALLET', 'EMPTY', etc.
    // Our UI SlotStatus type is exactly these string values (minus UNKNOWN)
    if (key === 'UNKNOWN' || key === 'UNRECOGNIZED') return 'EMPTY'
    return key as SlotStatus
}

export function mapSlotStatus(
    slot: ProtoSlotStatus,
    index: number,
    rfidArray: Uint8Array[],
): ParkingSlot {
    const palletRfid = slot.palletId > 0 ? rfidArray[slot.palletId - 1] : undefined

    return {
        slotLabel: slotIdToLabel(index + 1),
        status: mapProtoStatusToUI(slot.status),
        palletId: String(slot.palletId),
        rfid: palletRfid && palletRfid.length > 0 ? rfidToHex(palletRfid) : undefined,
    }
}

// ---------------------------------------------------------------------------
// Protobuf ParkingStatus → UI ParkingSlot[]
// ---------------------------------------------------------------------------

export function mapParkingStatus(status: ProtoParkingStatus): ParkingSlot[] {
    return status.slots.map((slot, index) => mapSlotStatus(slot, index, status.rfid))
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
        rfid: rfidToHex(event.rfid),
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
        bssid: rfidToHex(ap.bssid), // reuse hex formatter for MAC bytes
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
