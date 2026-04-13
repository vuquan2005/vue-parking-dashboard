export type SlotStatus = 'NO_PALLET' | 'EMPTY' | 'OCCUPIED' | 'PROCESSING' | 'PENDING'

export interface ParkingSlot {
    slotLabel: string
    status: SlotStatus
    palletId: string
}

export type EventType = 'IN' | 'OUT'
export type EventStatus = 'Success' | 'Processing'

export interface ParkingEvent {
    eventId: number
    type: EventType
    slotLabel: string
    status: EventStatus
    timestamp: number
}

// ---------------------------------------------------------------------------
// Device / WiFi types
// ---------------------------------------------------------------------------

export type WifiAuthMode =
    | 'OPEN'
    | 'WEP'
    | 'WPA_PSK'
    | 'WPA2_PSK'
    | 'WPA_WPA2_PSK'
    | 'ENTERPRISE'
    | 'WPA3_PSK'
    | 'WPA2_WPA3_PSK'
    | 'WAPI_PSK'
    | 'OWE'
    | 'WPA3_ENT_192'
    | 'WPA3_EXT_PSK'
    | 'WPA3_EXT_PSK_MIXED_MODE'
    | 'DPP'
    | 'WPA3_ENTERPRISE'
    | 'WPA2_WPA3_ENTERPRISE'
    | 'WPA_ENTERPRISE'
    | 'UNKNOWN'

export type WifiMode = 'NULL' | 'STA' | 'AP' | 'APSTA' | 'NAN' | 'UNKNOWN'

export interface AccessPoint {
    ssid: string
    bssid: string // formatted MAC "AA:BB:CC:DD:EE:FF"
    rssi: number
    channel: number
    encryption: WifiAuthMode
}

export interface DeviceInfo {
    connected: boolean
    wifiMode: WifiMode
    staSsid: string
    staIp: string
    apSsid: string
    apIp: string
    apPassword?: string
    rssi: number
    channel: number
    freeHeap: number
    minFreeHeap: number
    maxFreeBlockSize: number
    uptimeSeconds: number
}
