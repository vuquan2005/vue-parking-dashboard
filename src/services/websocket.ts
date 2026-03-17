import { createLogger } from '@/utils/logger'
import { WiFiMode } from './type'
import type {
    IWebSocketClient,
    WebSocketOptions,
    WsMessage,
    ParkingSlot,
    ParkingEvent,
    BeaconNetwork,
    ESPWiFiStatus,
    EventType,
    EventStatus,
} from './type'

import { mwsClient } from '@/mocks/websocket'

const log = createLogger('WebSocket')

export class WebSocketClient implements IWebSocketClient {
    private url: string
    private reconnectInterval: number
    private maxReconnectInterval: number
    private pingIntervalMs: number
    private pingTimeoutMs: number
    private ws: WebSocket | null = null
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private pingTimer: ReturnType<typeof setInterval> | null = null
    private reconnectAttempts: number = 0
    public lastPingTime = 0
    public lastMessageTime = 0

    public options: WebSocketOptions

    constructor(options: WebSocketOptions = {}) {
        this.options = options
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        this.url =
            options.url || import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}`
        this.reconnectInterval = options.reconnectInterval || 3000
        this.maxReconnectInterval = options.maxReconnectInterval || 30000
        this.pingIntervalMs = options.pingInterval || 5000
        this.pingTimeoutMs = options.pingTimeout || 7500
        this.lastMessageTime = performance.now()
    }

    public get isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN
    }

    public connect() {
        if (this.isSocketActive()) return

        log.i(`Connecting to ${this.url}...`)
        this.ws = new WebSocket(this.url)

        this.ws.onopen = this.handleOpen.bind(this)
        this.ws.onmessage = this.handleMessageEvent.bind(this)
        this.ws.onerror = this.handleError.bind(this)
        this.ws.onclose = this.handleClose.bind(this)
    }

    public disconnect() {
        this.stopReconnectTimer()
        this.stopPingTimer()
        this.reconnectAttempts = 0

        if (this.ws) {
            this.ws.onclose = null
            this.ws.close()
            this.ws = null
        }

        log.i('Manually disconnected')
        if (this.options.onDisconnected) {
            this.options.onDisconnected(1000, 'Manually disconnected')
        }
    }

    public send(data: string | object) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            log.w('Cannot send, not connected')
            return
        }
        const message = typeof data === 'object' ? JSON.stringify(data) : data
        this.ws.send(message)
        log.i('Sent:', message)
    }

    private handleOpen() {
        log.i('Connected')
        this.reconnectAttempts = 0
        this.startPingTimer()
        if (this.options.onConnected) {
            this.options.onConnected()
        }
    }

    private handleMessageEvent(event: MessageEvent) {
        this.lastMessageTime = performance.now()

        const data = event.data
        // log.i('Raw message:', data)

        try {
            const parsed = JSON.parse(data) as WsMessage
            log.i('Parsed JSON:', parsed)

            if (parsed.type === 'wifi_status' && this.lastPingTime > 0) {
                const latency = Math.round(performance.now() - this.lastPingTime)
                this.lastPingTime = 0

                if (parsed.data && typeof parsed.data === 'object') {
                    ;(parsed.data as Record<string, unknown>).latency = latency
                } else {
                    parsed.latency = latency
                }
            }

            if (this.options.onMessage) {
                this.options.onMessage(parsed)
            }
        } catch {
            log.i('Received (Text):', data)
        }
    }

    private handleError(error: Event) {
        log.e('Error:', error)
        if (this.options.onError) {
            this.options.onError(error)
        }
    }

    private handleClose(event: CloseEvent) {
        log.i(`Disconnected (code: ${event.code}, reason: ${event.reason})`)
        if (this.options.onDisconnected) {
            this.options.onDisconnected(event.code, event.reason)
        }

        this.stopPingTimer()
        this.scheduleReconnect()
    }

    private isSocketActive() {
        return (
            this.ws &&
            (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
        )
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) return

        const delay = Math.min(
            this.reconnectInterval * Math.pow(2, this.reconnectAttempts),
            this.maxReconnectInterval,
        )

        log.i(`Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts + 1})...`)
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            this.reconnectAttempts++
            this.connect()
        }, delay)
    }

    private stopReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
    }

    private startPingTimer() {
        this.stopPingTimer()
        this.lastMessageTime = performance.now()

        this.pingTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const now = performance.now()

                if (now - this.lastMessageTime > this.pingTimeoutMs) {
                    log.w(
                        `Connection silent for ${Math.round(now - this.lastMessageTime)}ms, closing...`,
                    )
                    this.ws.close(4000, 'Ping timeout')
                    return
                }

                this.lastPingTime = now
                this.send({ type: 'wifi_status' })
            }
        }, this.pingIntervalMs)
    }

    private stopPingTimer() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer)
            this.pingTimer = null
        }
    }
}

const isMockMode = String(import.meta.env.VITE_WS_MOCK || '').toLowerCase() === 'true'

export const wsClient: IWebSocketClient = isMockMode ? mwsClient : new WebSocketClient()
