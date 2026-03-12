export interface WsMessage {
    type: string
    [key: string]: unknown
}

export interface WebSocketOptions {
    url?: string
    reconnectInterval?: number
    pingInterval?: number
    onConnected?: () => void
    onDisconnected?: (code: number, reason: string) => void
    onMessage?: (message: WsMessage) => void
    onError?: (error: Event) => void
    onRawMessage?: (data: string) => void
}

export class WebSocketClient {
    private url: string
    private reconnectInterval: number
    private pingIntervalMs: number
    private ws: WebSocket | null = null
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private pingTimer: ReturnType<typeof setInterval> | null = null
    public lastPingTime = 0

    public options: WebSocketOptions

    constructor(options: WebSocketOptions = {}) {
        this.options = options
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        this.url =
            options.url || import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}`
        this.reconnectInterval = options.reconnectInterval || 3000
        this.pingIntervalMs = options.pingInterval || 5000
    }

    public get isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN
    }

    public connect() {
        if (this.isSocketActive()) return

        console.log(`[WebSocket] Connecting to ${this.url}...`)
        this.ws = new WebSocket(this.url)

        this.ws.onopen = this.handleOpen.bind(this)
        this.ws.onmessage = this.handleMessageEvent.bind(this)
        this.ws.onerror = this.handleError.bind(this)
        this.ws.onclose = this.handleClose.bind(this)
    }

    public disconnect() {
        this.stopReconnectTimer()
        this.stopPingTimer()

        if (this.ws) {
            this.ws.close()
            this.ws = null
        }

        console.log('[WebSocket] 🛑 Manually disconnected')
        if (this.options.onDisconnected) {
            this.options.onDisconnected(1000, 'Manually disconnected')
        }
    }

    public send(data: string | object) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('[WebSocket] ⚠️ Cannot send, not connected')
            return
        }
        const message = typeof data === 'object' ? JSON.stringify(data) : data
        this.ws.send(message)
        console.log('[WebSocket] 📤 Sent:', message)
    }

    private handleOpen() {
        console.log('[WebSocket] ✅ Connected')
        this.startPingTimer()
        if (this.options.onConnected) {
            this.options.onConnected()
        }
    }

    private handleMessageEvent(event: MessageEvent) {
        const data = event.data
        if (this.options.onRawMessage) {
            this.options.onRawMessage(data)
        }

        try {
            const parsed = JSON.parse(data) as WsMessage
            console.log('[WebSocket] 📦 Parsed JSON:', parsed)
            if (this.options.onMessage) {
                this.options.onMessage(parsed)
            }
        } catch {
            console.log('[WebSocket] 📦 Received (Text):', data)
        }
    }

    private handleError(error: Event) {
        console.error('[WebSocket] ❌ Error:', error)
        if (this.options.onError) {
            this.options.onError(error)
        }
    }

    private handleClose(event: CloseEvent) {
        console.log(`[WebSocket] 🔌 Disconnected (code: ${event.code}, reason: ${event.reason})`)
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

    private startPingTimer() {
        this.stopPingTimer()
        this.pingTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.lastPingTime = performance.now()
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

    private scheduleReconnect() {
        if (this.reconnectTimer) return
        console.log(`[WebSocket] ⏳ Reconnecting in ${this.reconnectInterval / 1000}s...`)
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            this.connect()
        }, this.reconnectInterval)
    }

    private stopReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
    }
}

export const wsClient = new WebSocketClient()
