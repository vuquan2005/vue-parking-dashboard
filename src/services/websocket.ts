/**
 * WebSocket composable for receiving protobuf Parking messages.
 *
 * Usage:
 *   const { status, connect, disconnect, send } = useParkingWebSocket()
 *
 * The composable auto-connects on creation and auto-disconnects on
 * component unmount. It decodes incoming binary frames as Parking
 * protobuf messages and dispatches them to the Pinia store.
 */

import { ref, onUnmounted } from 'vue'
import { Parking } from '@/services/parking'
import { mapParkingStatus, mapParkingEvent } from '@/services/mappers'
import { useParkingStore } from '@/stores/parking'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

const WS_URL = import.meta.env.VITE_WS_URL as string | undefined

// Reconnect config
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

export function useParkingWebSocket(url?: string) {
    const resolvedUrl = url ?? WS_URL
    const status = ref<ConnectionStatus>('disconnected')

    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let reconnectDelay = RECONNECT_BASE_MS
    let shouldReconnect = true

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

    function dispatch(parking: ReturnType<typeof Parking.decode>) {
        const store = useParkingStore()

        if (parking.parkingStatus) {
            const slots = mapParkingStatus(parking.parkingStatus)
            store.updateAllSlot(slots)
        }

        if (parking.parkingEvent) {
            const event = mapParkingEvent(parking.parkingEvent)
            store.addEvent(event)
        }

        // WifiScanning, ScanResults, DeviceStatus — skipped for now
    }

    // -----------------------------------------------------------------------
    // Connection lifecycle
    // -----------------------------------------------------------------------

    function connect() {
        if (!resolvedUrl) {
            console.warn('[ws] No WebSocket URL configured (set VITE_WS_URL)')
            status.value = 'disconnected'
            return
        }

        cleanup()
        shouldReconnect = true
        status.value = 'connecting'

        try {
            ws = new WebSocket(resolvedUrl)
            ws.binaryType = 'arraybuffer'

            ws.addEventListener('open', () => {
                status.value = 'connected'
                reconnectDelay = RECONNECT_BASE_MS // reset backoff
                console.info('[ws] Connected to', resolvedUrl)
            })

            ws.addEventListener('message', handleMessage)

            ws.addEventListener('close', () => {
                status.value = 'disconnected'
                console.info('[ws] Disconnected')
                scheduleReconnect()
            })

            ws.addEventListener('error', (err) => {
                status.value = 'error'
                console.error('[ws] Error:', err)
                // 'close' event will fire after this, triggering reconnect
            })
        } catch (err) {
            status.value = 'error'
            console.error('[ws] Failed to create WebSocket:', err)
            scheduleReconnect()
        }
    }

    function disconnect() {
        shouldReconnect = false
        cleanup()
        status.value = 'disconnected'
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

    function send(message: Parameters<typeof Parking.encode>[0]) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.warn('[ws] Cannot send – not connected')
            return
        }
        const bytes = Parking.encode(message).finish()
        ws.send(bytes)
    }

    // -----------------------------------------------------------------------
    // Auto-cleanup on component unmount
    // -----------------------------------------------------------------------

    onUnmounted(() => {
        disconnect()
    })

    return {
        /** Reactive connection status */
        status,
        /** Manually connect (auto-called if you want) */
        connect,
        /** Disconnect and stop auto-reconnect */
        disconnect,
        /** Encode and send a Parking protobuf message */
        send,
    }
}
