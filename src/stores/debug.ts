import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface MessageLog {
    id: number
    timestamp: Date
    direction: 'in' | 'out'
    type: string
    payload: unknown // Decoded protobuf object
}

let nextMessageId = 1
const MAX_MESSAGES = 100

export const useDebugStore = defineStore('debug', () => {
    const messages = ref<MessageLog[]>([])

    function addMessage(direction: 'in' | 'out', decodedPayload: unknown) {
        // Determine the type of the message (the top-level key that is set)
        // Usually protobuf messages have one non-empty field at the root
        let msgType = 'unknown'
        if (decodedPayload && typeof decodedPayload === 'object') {
            for (const [key, value] of Object.entries(decodedPayload)) {
                if (value !== undefined) {
                    msgType = key
                    break
                }
            }
        }

        const log: MessageLog = {
            id: nextMessageId++,
            timestamp: new Date(),
            direction,
            type: msgType,
            payload: decodedPayload,
        }

        messages.value.unshift(log)

        // Cap array to MAX_MESSAGES
        if (messages.value.length > MAX_MESSAGES) {
            messages.value.pop()
        }
    }

    function clearMessages() {
        messages.value = []
    }

    return {
        messages,
        addMessage,
        clearMessages,
    }
})
