interface StreamingDebugInfo {
  timestamp: number
  event: string
  data?: any
  error?: string
}

class OpenAICompatibleDebugger {
  private logs: StreamingDebugInfo[] = []
  private maxLogs = 100

  log(event: string, data?: any, error?: string) {
    this.logs.push({
      timestamp: Date.now(),
      event,
      data: data ? JSON.stringify(data).substring(0, 200) : undefined,
      error
    })

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OpenAI-Compatible] ${event}:`, data || error || '')
    }
  }

  getLogs(): StreamingDebugInfo[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const openaiCompatibleDebugger = new OpenAICompatibleDebugger()

// Hook into the streaming process
export function debugStreamingRequest(modelId: string, requestData: any) {
  if (modelId.includes('openai-compatible')) {
    openaiCompatibleDebugger.log('streaming_request_start', {
      modelId,
      hasMessages: !!requestData.messages,
      messageCount: requestData.messages?.length,
      tools: requestData.tools ? Object.keys(requestData.tools) : [],
      maxSteps: requestData.maxSteps
    })
  }
}

export function debugStreamingResponse(modelId: string, response: any) {
  if (modelId.includes('openai-compatible')) {
    openaiCompatibleDebugger.log('streaming_response_received', {
      modelId,
      hasStream: !!response,
      type: typeof response
    })
  }
}

export function debugStreamingError(modelId: string, error: any) {
  if (modelId.includes('openai-compatible')) {
    openaiCompatibleDebugger.log('streaming_error', {
      modelId
    }, error instanceof Error ? error.message : String(error))
  }
}

export function debugStreamingChunk(modelId: string, chunk: any) {
  if (modelId.includes('openai-compatible')) {
    openaiCompatibleDebugger.log('streaming_chunk', {
      modelId,
      chunkType: chunk?.type,
      hasContent: !!chunk?.content
    })
  }
}