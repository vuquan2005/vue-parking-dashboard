export interface IWebSocketClient {
    options: WebSocketOptions
    readonly isConnected: boolean
    connect: () => void
    disconnect: () => void
    send: (data: string | object) => void
}

export interface WsMessage {
    type: string
    data?: unknown
    [key: string]: unknown
}

export interface WebSocketOptions {
    url?: string
    reconnectInterval?: number
    maxReconnectInterval?: number
    pingInterval?: number
    pingTimeout?: number
    onConnected?: () => void
    onDisconnected?: (code: number, reason: string) => void
    onMessage?: (message: WsMessage) => void
    onError?: (error: Event) => void
}

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

/** WiFi mode on ESP32 */
export enum WiFiMode {
    NULL = 0,
    STA = 1,
    AP = 2,
    AP_STA = 3,
}

/** Encryption types from ESP32 WiFi scan */
export enum EncryptionType {
    OPEN = 0,
    WEP = 1,
    WPA_PSK = 2,
    WPA2_PSK = 3,
    WPA_WPA2_PSK = 4,
    WPA2_ENTERPRISE = 5,
    WPA3_PSK = 6,
    WPA2_WPA3_PSK = 7,
}

/** A scanned WiFi network from ESP32 beacon */
export interface BeaconNetwork {
    ssid: string
    rssi: number // dBm, e.g. -30 (excellent) to -90 (weak)
    encryption: EncryptionType | number
    channel?: number
    bssid?: string
}

/** Current ESP32 WiFi status sent via WS */
export interface ESPWiFiStatus {
    type?: string
    mode?: WiFiMode
    connected: boolean
    ssid: string
    ip: string
    mac?: string
    rssi?: number
    channel?: number
    apClients?: number
    free_heap?: number
    min_free_heap?: number
    max_free_block?: number
    uptime?: number
    cpu_freq?: number
    latency?: number
}

/** WiFi connect command to send to ESP32 via WS */
export interface WiFiConnectPayload {
    ssid: string
    pass: string
}
