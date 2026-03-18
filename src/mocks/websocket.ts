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

function pick<T>(arr: T[], index: number): T {
    if (index < 0 || index >= arr.length) {
        throw new Error(`pick() index out of bounds: ${index} (array length: ${arr.length})`)
    }
    const item = arr[index]
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

function buildInitialSlots(): ParkingSlot[][] {
    const rows = ['A', 'B', 'C']
    const cols = [1, 2, 3, 4]
    const noPalletIds = new Set<string>([`B${randInt(1, 4)}`, `C${randInt(1, 4)}`])
    return rows.map((r) =>
        cols.map((c) => {
            const id = `${r}${c}`
            const status = noPalletIds.has(id) ? 'NO_PALLET' : 'EMPTY'
            return { id, status }
        }),
    )
}

function mutateSlots(slots: ParkingSlot[][]): {
    slots: ParkingSlot[][]
    event?: ParkingEvent
} {
    if (slots.length === 0) return { slots }

    const newSlots = slots.map((row) => row.map((s) => ({ ...s })))

    const rowLetters = ['A', 'B', 'C']
    const rowOf = (id: string) => id[0]!
    const colOf = (id: string) => Number(id.slice(1))
    const slotAt = (row: string, col: number): ParkingSlot | undefined => {
        const rowIndex = rowLetters.indexOf(row)
        if (rowIndex === -1) return undefined
        return newSlots[rowIndex]?.[col - 1]
    }

    const allSlots = newSlots.flat()

    function swapSlots(a: ParkingSlot, b: ParkingSlot) {
        const tmpStatus = a.status
        const tmpPlate = a.plateNumber
        a.status = b.status
        a.plateNumber = b.plateNumber
        b.status = tmpStatus
        b.plateNumber = tmpPlate
    }

    function makeEvent(
        forSlot: ParkingSlot,
        type: EventType,
        plateNumber: string,
        status: EventStatus,
    ): ParkingEvent {
        return {
            id: Date.now(),
            type,
            plateNumber,
            slotId: forSlot.id,
            status,
            timestamp: timeNow(),
        }
    }

    // ── Priority 1: Advance any PROCESSING slot ───────────────────────────
    const processingSlots = allSlots.filter((s) => s.status === 'PROCESSING')
    if (processingSlots.length > 0) {
        const cur = pick(processingSlots, 0)
        if (cur.plateNumber) {
            if (Math.random() < 0.5) {
                cur.status = 'OCCUPIED'
                return {
                    slots: newSlots,
                    event: makeEvent(cur, 'IN', cur.plateNumber, 'Success'),
                }
            }
            const plate = cur.plateNumber
            cur.status = 'EMPTY'
            cur.plateNumber = undefined
            return { slots: newSlots, event: makeEvent(cur, 'OUT', plate, 'Success') }
        }
        cur.status = 'EMPTY'
        return { slots: newSlots }
    }

    // ── Priority 2: Advance PENDING slots (middle and top rows) ──────────
    const pendingSlots = allSlots.filter((s) => s.status === 'PENDING')
    if (pendingSlots.length > 0) {
        const cur = pick(pendingSlots, 0)
        const row = rowOf(cur.id)
        const col = colOf(cur.id)

        if (row === 'B') {
            // Middle row: needs the A-slot in the same column to be NO_PALLET
            const aBelow = slotAt('A', col)

            if (aBelow?.status === 'NO_PALLET') {
                // Space below is clear — begin entry
                cur.status = 'PROCESSING'
                cur.plateNumber = randomHex()
                return {
                    slots: newSlots,
                    event: makeEvent(cur, 'IN', cur.plateNumber, 'Processing'),
                }
            }

            // A-slot below is blocked — if occupied, trigger its evacuation first
            if (aBelow?.status === 'OCCUPIED') {
                const plate = aBelow.plateNumber || randomHex()
                aBelow.status = 'PROCESSING'
                return {
                    slots: newSlots,
                    event: makeEvent(aBelow, 'OUT', plate, 'Processing'),
                }
            }

            // Slide PENDING horizontally toward the column that has A-row NO_PALLET
            const aNoPallet = allSlots.find((s) => rowOf(s.id) === 'A' && s.status === 'NO_PALLET')
            if (aNoPallet) {
                const npCol = colOf(aNoPallet.id)
                const dir = npCol > col ? 1 : -1
                const neighbor = slotAt('B', col + dir)
                if (neighbor && neighbor.status !== 'PROCESSING') {
                    swapSlots(cur, neighbor)
                }
            } else {
                // No A-row NO_PALLET exists — shift right to avoid permanent deadlock
                const neighbors = [slotAt('B', col - 1), slotAt('B', col + 1)].filter(
                    (s): s is ParkingSlot => s !== undefined && s.status !== 'PROCESSING',
                )
                if (neighbors.length > 0) {
                    // Prefer moving right (col + 1) if available, otherwise left
                    const rightNeighbor = slotAt('B', col + 1)
                    const fallback =
                        rightNeighbor && rightNeighbor.status !== 'PROCESSING'
                            ? rightNeighbor
                            : pick(neighbors, 0)
                    swapSlots(cur, fallback)
                }
            }
            return { slots: newSlots }
        }

        if (row === 'C') {
            // Top row: needs BOTH the B-slot and the A-slot in the same column to be NO_PALLET
            const bBelow = slotAt('B', col)
            const aBelow = slotAt('A', col)
            const bothClear = bBelow?.status === 'NO_PALLET' && aBelow?.status === 'NO_PALLET'

            if (bothClear) {
                // Both levels below are clear — begin entry
                cur.status = 'PROCESSING'
                cur.plateNumber = randomHex()
                return {
                    slots: newSlots,
                    event: makeEvent(cur, 'IN', cur.plateNumber, 'Processing'),
                }
            }

            // Find a column where both B-row and A-row slots are NO_PALLET
            let targetCol: number | null = null
            for (let c = 1; c <= 4; c++) {
                if (
                    slotAt('B', c)?.status === 'NO_PALLET' &&
                    slotAt('A', c)?.status === 'NO_PALLET'
                ) {
                    targetCol = c
                    break
                }
            }

            if (targetCol !== null && targetCol !== col) {
                // Slide PENDING toward the aligned column
                const dir = targetCol > col ? 1 : -1
                const neighbor = slotAt('C', col + dir)
                if (neighbor && neighbor.status !== 'PROCESSING') {
                    swapSlots(cur, neighbor)
                }
            } else {
                // No aligned column yet — trigger evacuation of the nearest blocker
                if (bBelow?.status === 'OCCUPIED') {
                    const plate = bBelow.plateNumber || randomHex()
                    bBelow.status = 'PROCESSING'
                    return {
                        slots: newSlots,
                        event: makeEvent(bBelow, 'OUT', plate, 'Processing'),
                    }
                }
                if (aBelow?.status === 'OCCUPIED') {
                    const plate = aBelow.plateNumber || randomHex()
                    aBelow.status = 'PROCESSING'
                    return {
                        slots: newSlots,
                        event: makeEvent(aBelow, 'OUT', plate, 'Processing'),
                    }
                }
                // Swap with adjacent C slot to try another column (prefer col + 1)
                const neighbors = [slotAt('C', col - 1), slotAt('C', col + 1)].filter(
                    (s): s is ParkingSlot => s !== undefined && s.status !== 'PROCESSING',
                )
                if (neighbors.length > 0) {
                    const rightNeighbor = slotAt('C', col + 1)
                    const fallback =
                        rightNeighbor && rightNeighbor.status !== 'PROCESSING'
                            ? rightNeighbor
                            : pick(neighbors, 0)
                    swapSlots(cur, fallback)
                }
            }
            return { slots: newSlots }
        }
    }

    // ── Priority 3: Randomly start a car exit (OCCUPIED → PROCESSING) ────
    const occupiedSlots = allSlots.filter((s) => s.status === 'OCCUPIED')
    if (occupiedSlots.length > 0 && Math.random() < 0.4) {
        const idx = Math.floor(Math.random() * occupiedSlots.length)
        const cur = pick(occupiedSlots, idx)
        cur.status = 'PROCESSING'
        return {
            slots: newSlots,
            event: makeEvent(cur, 'OUT', cur.plateNumber || randomHex(), 'Processing'),
        }
    }

    // ── Priority 4: Start a new parking attempt for an EMPTY slot ────────
    const emptySlots = allSlots.filter((s) => s.status === 'EMPTY')
    if (emptySlots.length > 0) {
        const idx = Math.floor(Math.random() * emptySlots.length)
        const cur = pick(emptySlots, idx)
        const row = rowOf(cur.id)

        if (row === 'A') {
            // Bottom row: cars enter directly without waiting
            cur.status = 'PROCESSING'
            cur.plateNumber = randomHex()
            return {
                slots: newSlots,
                event: makeEvent(cur, 'IN', cur.plateNumber, 'Processing'),
            }
        }

        // Middle (B) or top (C) row: must wait for the shaft below to clear
        cur.status = 'PENDING'
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
    private slots: ParkingSlot[][] = buildInitialSlots()

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
