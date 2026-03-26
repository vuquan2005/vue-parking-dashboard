/**
 * WebSocket service for receiving protobuf Parking messages.
 *
 * Usage:
 *   import { connect, disconnect, send, sendWifiScan } from '@/services/websocket'
 *
 * The service connects globally and dispatches incoming binary frames as Parking
 * protobuf messages to the Pinia stores.
 */

import { Parking, type WifiConfig } from '@/services/parking'
import {
    mapParkingStatus,
    mapParkingEvent,
    mapScanResults,
    mapDeviceStatus,
} from '@/services/mappers'
import { useParkingStore } from '@/stores/parking'
import { useDeviceStore } from '@/stores/device'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

// Reconnect config
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = RECONNECT_BASE_MS
let shouldReconnect = true
let resolvedUrl = ''

export const getStoredWsUrl = () => localStorage.getItem('ws_url') || ''

export const getDefaultWsUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws`
}

// -----------------------------------------------------------------------
// Core handlers
// -----------------------------------------------------------------------

function handleMessage(event: MessageEvent) {
    if (!(event.data instanceof ArrayBuffer)) {
        console.warn('[ws] Ignoring non-binary message')
        return
    }

    try {
        const bytes = new Uint8Array(event.data)
        const parking = Parking.decode(bytes)
        dispatch(parking)
    } catch (err) {
        console.error('[ws] Failed to decode Parking message:', err)
    }
}

export function dispatch(parking: ReturnType<typeof Parking.decode>) {
    const parkingStore = useParkingStore()
    const deviceStore = useDeviceStore()

    if (parking.parkingStatus) {
        const slots = mapParkingStatus(parking.parkingStatus)
        parkingStore.updateAllSlot(slots)
    }

    if (parking.parkingEvent) {
        const event = mapParkingEvent(parking.parkingEvent)
        parkingStore.addEvent(event)
    }

    if (parking.scanResults) {
        const aps = mapScanResults(parking.scanResults)
        deviceStore.updateScanResults(aps)
    }

    if (parking.wifiStatus) {
        const info = mapDeviceStatus(parking.wifiStatus)
        deviceStore.updateDeviceStatus(info)
    }

    // WifiScanning (incoming) is an ack — no action needed
}

export function setStatus(status: ConnectionStatus) {
    const deviceStore = useDeviceStore()
    deviceStore.updateWsStatus(status)
}

// -----------------------------------------------------------------------
// Connection lifecycle
// -----------------------------------------------------------------------

export function connect() {
    resolvedUrl = getStoredWsUrl() || getDefaultWsUrl()

    if (!resolvedUrl) {
        console.warn('[ws] No WebSocket URL configured')
        setStatus('disconnected')
        return
    }

    cleanup()
    shouldReconnect = true
    setStatus('connecting')

    try {
        ws = new WebSocket(resolvedUrl)
        ws.binaryType = 'arraybuffer'

        ws.addEventListener('open', () => {
            setStatus('connected')
            reconnectDelay = RECONNECT_BASE_MS // reset backoff
            console.info('[ws] Connected to', resolvedUrl)
        })

        ws.addEventListener('message', handleMessage)

        ws.addEventListener('close', () => {
            setStatus('disconnected')
            console.info('[ws] Disconnected')
            scheduleReconnect()
        })

        ws.addEventListener('error', (err) => {
            setStatus('error')
            console.error('[ws] Error:', err)
            // 'close' event will fire after this, triggering reconnect
        })
    } catch (err) {
        setStatus('error')
        console.error('[ws] Failed to create WebSocket:', err)
        scheduleReconnect()
    }
}

export function disconnect() {
    shouldReconnect = false
    cleanup()
    setStatus('disconnected')
}

function cleanup() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
    }
    if (ws) {
        ws.close()
        ws = null
    }
}

function scheduleReconnect() {
    if (!shouldReconnect) return

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        console.info(`[ws] Reconnecting (delay: ${reconnectDelay}ms)…`)
        connect()
    }, reconnectDelay)

    // Exponential backoff
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS)
}

// -----------------------------------------------------------------------
// Send (encode & send a Parking message)
// -----------------------------------------------------------------------

export function send(message: Parameters<typeof Parking.encode>[0]) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('[ws] Cannot send – not connected')
        return
    }
    const bytes = Parking.encode(message).finish()
    ws.send(bytes)
}

/**
 * Send a WifiScanning request to the device.
 * Sets `deviceStore.isScanning = true`; it will be cleared
 * automatically when ScanResults arrive.
 */
export function sendWifiScan() {
    const deviceStore = useDeviceStore()
    deviceStore.setScanning(true)
    send({ wifiScanning: {} })
}

/**
 * Send a WifiConfig message to the device.
 */
export function sendWifiConfig(config: NonNullable<WifiConfig>) {
    send({ wifiConfig: config })
}
