import { createLogger } from '@/utils/logger'
import { WiFiMode } from '@/type'
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
} from '@/type'

const log = createLogger('WebSocket')

function timeNow() {
    return Math.floor(Date.now() / 1000)
}

function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
    const item = arr[Math.floor(Math.random() * arr.length)]
    if (item === undefined) {
        throw new Error('pick() called with empty array')
    }
    return item
}

function randomHex() {
    const bytes = Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, '0')
            .toUpperCase(),
    )

    return bytes.join(':')
}

function buildInitialSlots(): ParkingSlot[] {
    const slots: ParkingSlot[] = []
    const rows = ['A', 'B', 'C']
    const cols = [1, 2, 3, 4]
    const noPalletIds = new Set<string>([`B${randInt(1, 4)}`, `C${randInt(1, 4)}`])
    for (const r of rows) {
        for (const c of cols) {
            const id = `${r}${c}`
            const status = noPalletIds.has(id) ? 'NO_PALLET' : 'EMPTY'
            slots.push({ id, status })
        }
    }
    return slots
}

function mutateSlots(slots: ParkingSlot[]): {
    slots: ParkingSlot[]
    event?: ParkingEvent
} {
    if (slots.length === 0) return { slots }

    const processingSlot = slots.find((s) => s.status === 'PROCESSING')
    const slot = processingSlot ?? pick(slots)
    const nextAction = Math.random()

    const newSlots = slots.map((s) => ({ ...s }))
    const idx = newSlots.findIndex((s) => s.id === slot.id)
    if (idx < 0) return { slots: newSlots }
    const cur = newSlots[idx]
    if (!cur) return { slots: newSlots }
    const hasProcessing = newSlots.some((s) => s.status === 'PROCESSING')

    if (cur.status === 'NO_PALLET') {
        const row = cur.id.slice(0, 1)
        const col = Number(cur.id.slice(1))
        if (Number.isNaN(col)) return { slots: newSlots }

        const neighborIds = [`${row}${col - 1}`, `${row}${col + 1}`]
        const neighbors = neighborIds
            .map((id) => newSlots.find((s) => s.id === id))
            .filter((s): s is ParkingSlot => s !== undefined)

        if (neighbors.length === 0) return { slots: newSlots }

        const target = pick(neighbors)
        const curStatus = cur.status
        const curPlate = cur.plateNumber

        cur.status = target.status
        cur.plateNumber = target.plateNumber
        target.status = curStatus
        target.plateNumber = curPlate

        return { slots: newSlots }
    }

    const createEvent = (
        type: EventType,
        plateNumber: string,
        status: EventStatus,
    ): ParkingEvent => ({
        id: Date.now(),
        type,
        plateNumber,
        slotId: cur.id,
        status,
        timestamp: timeNow(),
    })

    if (cur.status === 'EMPTY') {
        if (!hasProcessing && nextAction < 0.6) {
            cur.status = 'PROCESSING'
            cur.plateNumber = randomHex()
            return { slots: newSlots, event: createEvent('IN', cur.plateNumber, 'Processing') }
        }
        return { slots: newSlots }
    }

    if (cur.status === 'PROCESSING') {
        if (cur.plateNumber && nextAction < 0.5) {
            cur.status = 'OCCUPIED'
            return { slots: newSlots, event: createEvent('IN', cur.plateNumber, 'Success') }
        }
        if (cur.plateNumber && nextAction >= 0.5) {
            cur.status = 'EMPTY'
            const plate = cur.plateNumber
            cur.plateNumber = undefined
            return { slots: newSlots, event: createEvent('OUT', plate, 'Success') }
        }
        return { slots: newSlots }
    }

    if (cur.status === 'OCCUPIED') {
        if (!hasProcessing && nextAction < 0.6) {
            cur.status = 'PROCESSING'
            return {
                slots: newSlots,
                event: createEvent('OUT', cur.plateNumber || randomHex(), 'Processing'),
            }
        }
        return { slots: newSlots }
    }

    return { slots: newSlots }
}

function mockScanResults(): BeaconNetwork[] {
    const base: BeaconNetwork[] = [
        { ssid: 'ETEK_PARKING', rssi: -42, encryption: 3, channel: 6 },
        { ssid: 'VuQuan-Home', rssi: -55, encryption: 2, channel: 11 },
        { ssid: 'Cafe_Free_WiFi', rssi: -68, encryption: 0, channel: 1 },
        { ssid: 'Warehouse_AP', rssi: -72, encryption: 7, channel: 3 },
        { ssid: 'IoT-Lab', rssi: -80, encryption: 4, channel: 9 },
    ]
    return base.map((n) => ({ ...n, rssi: n.rssi + randInt(-3, 3) }))
}

function buildWiFiStatus(overrides: Partial<ESPWiFiStatus> = {}): ESPWiFiStatus {
    const uptime = Math.max(0, Math.floor(performance.now()))
    return {
        type: 'wifi_status',
        mode: WiFiMode.STA,
        connected: true,
        ssid: 'ETEK_PARKING',
        ip: '192.168.1.88',
        mac: '24:6F:28:AA:BB:CC',
        rssi: -48 + randInt(-4, 4),
        channel: 6,
        apClients: 0,
        free_heap: 178000 + randInt(-3000, 3000),
        min_free_heap: 160000,
        max_free_block: 82000,
        uptime,
        cpu_freq: 240,
        latency: randInt(3, 30),
        ...overrides,
    }
}

class MockWebSocketClient implements IWebSocketClient {
    public options: WebSocketOptions
    private connected = false
    private stopped = false
    private timers: Array<ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>> = []
    private slots: ParkingSlot[] = buildInitialSlots()

    constructor(options: WebSocketOptions = {}) {
        this.options = options
    }

    public get isConnected(): boolean {
        return this.connected
    }

    public connect() {
        if (this.connected) return
        this.stopped = false
        log.i('Mock WebSocket connected')

        this.timers.push(
            setTimeout(() => {
                if (this.stopped) return
                this.connected = true
                this.options.onConnected?.()
                this.emit({ type: 'wifi_status', data: buildWiFiStatus({ connected: true }) })
                this.emit({ type: 'parking_update', data: this.slots })
            }, 1500),
        )

        this.timers.push(
            setInterval(() => {
                this.emit({ type: 'wifi_status', data: buildWiFiStatus() })
            }, 5000),
        )

        this.timers.push(
            setInterval(() => {
                const mutated = mutateSlots(this.slots)
                this.slots = mutated.slots
                if (mutated.event) {
                    this.emit({ type: 'parking_event', data: mutated.event })
                }
                this.emit({ type: 'parking_update', data: this.slots })
            }, 2000),
        )
    }

    public disconnect() {
        if (!this.connected && this.timers.length === 0) return
        this.stopTimers()
        this.connected = false
        log.i('Mock WebSocket disconnected')
        this.options.onDisconnected?.(1000, 'Mock disconnected')
    }

    public send(data: string | object) {
        if (this.stopped) return

        let parsed: WsMessage | null = null
        if (typeof data === 'string') {
            try {
                parsed = JSON.parse(data) as WsMessage
            } catch {
                parsed = null
            }
        } else {
            parsed = data as WsMessage
        }
        if (!parsed?.type) return

        if (parsed.type === 'wifi_scan') {
            this.timers.push(
                setTimeout(() => {
                    this.emit({ type: 'scan_results', data: mockScanResults() })
                }, 500),
            )
            return
        }

        if (parsed.type === 'wifi_connect') {
            const requestedSsid =
                parsed.data && typeof parsed.data === 'object'
                    ? String((parsed.data as Record<string, unknown>).ssid || 'ETEK_PARKING')
                    : 'ETEK_PARKING'
            this.timers.push(
                setTimeout(() => {
                    this.connected = true
                    this.emit({
                        type: 'wifi_status',
                        data: buildWiFiStatus({ connected: true, ssid: requestedSsid }),
                    })
                }, 800),
            )
            return
        }

        if (parsed.type === 'wifi_disconnect') {
            this.timers.push(
                setTimeout(() => {
                    this.connected = false
                    this.options.onDisconnected?.(1000, 'Mock disconnect')
                    this.emit({
                        type: 'wifi_status',
                        data: buildWiFiStatus({ connected: false, ssid: '', ip: '' }),
                    })
                }, 600),
            )
        }
    }

    private emit(message: WsMessage) {
        if (this.stopped) return
        this.options.onMessage?.(message)
    }

    private stopTimers() {
        this.stopped = true
        for (const t of this.timers) {
            clearInterval(t as ReturnType<typeof setInterval>)
            clearTimeout(t as ReturnType<typeof setTimeout>)
        }
        this.timers = []
    }
}

let client: IWebSocketClient

if (import.meta.hot) {
    if (!import.meta.hot.data.mwsClient) {
        import.meta.hot.data.mwsClient = new MockWebSocketClient()
    }

    client = import.meta.hot.data.mwsClient

    import.meta.hot.dispose(() => {
        client.disconnect()
    })
} else {
    client = new MockWebSocketClient()
}

export const mwsClient = client
