import { ref } from 'vue'
// import { useParkingStore } from '@/stores/parking'
import { useConfigStore } from '@/stores/config'

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const WS_URL = import.meta.env.VITE_WS_URL || `${WS_PROTOCOL}//${window.location.host}`
const RECONNECT_INTERVAL = 3000

const isConnected = ref(false)
const lastMessage = ref<string | null>(null)

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null
let lastPingTime = 0

export function useWebSocket() {
    const configStore = useConfigStore()
    // const parkingStore = useParkingStore()

    function connect() {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return
        }

        console.log(`[WebSocket] Connecting to ${WS_URL}...`)
        ws = new WebSocket(WS_URL)

        ws.onopen = () => {
            isConnected.value = true
            console.log('[WebSocket] ✅ Connected')

            // Gửi yêu cầu wifi_status định kỳ mỗi 5 giây
            if (pingInterval) clearInterval(pingInterval)
            pingInterval = setInterval(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    lastPingTime = performance.now()
                    send({ type: 'wifi_status' })
                }
            }, 5000)
        }

        ws.onmessage = (event: MessageEvent) => {
            const data = event.data
            lastMessage.value = data

            try {
                const parsed = JSON.parse(data)
                console.log('[WebSocket] 📦 Parsed JSON:', parsed)

                // --- Cấu trúc chung cho tin nhắn từ Arduino ---
                // Mọi tin nhắn sẽ có dạng { type: 'event_name', data: { ... } }

                // --- Xử lý sự kiện từ store ---
                if (parsed.type === 'scan_results' && Array.isArray(parsed.data)) {
                    configStore.handleBeaconData(parsed.data)
                }

                if (parsed.type === 'wifi_status') {
                    const statusData = parsed.data || parsed
                    // Đo độ trễ nếu có yêu cầu trước đó
                    if (lastPingTime > 0) {
                        statusData.latency = Math.round(performance.now() - lastPingTime)
                        lastPingTime = 0 // Reset sau khi nhận
                    }
                    configStore.handleWiFiStatus(statusData)
                }

                // Xử lý các sự kiện parking_store (nếu có)
                if (parsed.type === 'parking_update' && parsed.data) {
                    // parkingStore.updateAllSlot(parsed.data)
                }
            } catch {
                console.log('[WebSocket] 📦 Received:', data)
            }
        }

        ws.onerror = (error: Event) => {
            console.error('[WebSocket] ❌ Error:', error)
        }

        ws.onclose = (event: CloseEvent) => {
            isConnected.value = false
            console.log(
                `[WebSocket] 🔌 Disconnected (code: ${event.code}, reason: ${event.reason})`,
            )

            if (pingInterval) {
                clearInterval(pingInterval)
                pingInterval = null
            }

            // Auto-reconnect
            scheduleReconnect()
        }
    }

    function scheduleReconnect() {
        if (reconnectTimer) return
        console.log(`[WebSocket] ⏳ Reconnecting in ${RECONNECT_INTERVAL / 1000}s...`)
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null
            connect()
        }, RECONNECT_INTERVAL)
    }

    function disconnect() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }
        if (pingInterval) {
            clearInterval(pingInterval)
            pingInterval = null
        }
        if (ws) {
            ws.close()
            ws = null
        }
        isConnected.value = false
        console.log('[WebSocket] 🛑 Manually disconnected')
    }

    function send(data: string | object) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.warn('[WebSocket] ⚠️ Cannot send, not connected')
            return
        }
        const message = typeof data === 'object' ? JSON.stringify(data) : data
        ws.send(message)
        console.log('[WebSocket] 📤 Sent:', message)
    }

    return {
        isConnected,
        lastMessage,
        connect,
        disconnect,
        send,
    }
}
