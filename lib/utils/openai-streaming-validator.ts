/**
 * Validates if a streaming response is OpenAI compatible
 */
export interface StreamingValidationResult {
  isValid: boolean
  issues: string[]
  recommendations: string[]
}

export function validateOpenAIStreamingResponse(
  contentType: string | null,
  firstChunk: string
): StreamingValidationResult {
  const issues: string[] = []
  const recommendations: string[] = []

  // Check Content-Type
  if (!contentType) {
    issues.push('Missing Content-Type header')
    recommendations.push('Add Content-Type: text/plain or text/event-stream header')
  } else if (!contentType.includes('text/plain') && !contentType.includes('text/event-stream')) {
    issues.push(`Invalid Content-Type: ${contentType}`)
    recommendations.push('Use Content-Type: text/plain or text/event-stream for streaming')
  }

  // Check SSE format
  if (!firstChunk.includes('data:')) {
    issues.push('Missing SSE format - chunks should start with "data:"')
    recommendations.push('Format chunks as "data: {json}\\n\\n" following SSE standard')
  }

  // Check for OpenAI format
  const hasOpenAIFormat = 
    firstChunk.includes('"id"') && 
    firstChunk.includes('"object"') && 
    firstChunk.includes('"choices"')

  if (!hasOpenAIFormat) {
    issues.push('Response does not follow OpenAI format')
    recommendations.push('Ensure response includes id, object, and choices fields like OpenAI API')
  }

  // Check for proper JSON structure in data
  const dataLines = firstChunk.split('\n').filter(line => line.startsWith('data:'))
  for (const line of dataLines) {
    const jsonPart = line.substring(5).trim() // Remove 'data:' prefix
    if (jsonPart && jsonPart !== '[DONE]') {
      try {
        JSON.parse(jsonPart)
      } catch {
        issues.push('Invalid JSON in data line')
        recommendations.push('Ensure all data lines contain valid JSON')
        break
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  }
}

/**
 * Example of proper OpenAI streaming format
 */
export const OPENAI_STREAMING_EXAMPLE = `data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"content":" World"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]`

/**
 * Check if streaming endpoint supports proper OpenAI format
 */
export async function validateStreamingEndpoint(settings: {
  apiKey: string
  baseURL: string
  model: string
}): Promise<StreamingValidationResult & { example?: string }> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`${settings.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: 'Say "test"' }],
        stream: true,
        max_tokens: 10
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        isValid: false,
        issues: [`HTTP ${response.status}: ${response.statusText}`],
        recommendations: ['Fix endpoint to return 200 OK for valid requests']
      }
    }

    const contentType = response.headers.get('content-type')
    const reader = response.body?.getReader()
    
    if (!reader) {
      return {
        isValid: false,
        issues: ['Response body is not readable'],
        recommendations: ['Ensure endpoint returns a readable stream']
      }
    }

    try {
      const { value, done } = await reader.read()
      if (done || !value) {
        return {
          isValid: false,
          issues: ['No data received from stream'],
          recommendations: ['Ensure endpoint actually streams data']
        }
      }

      const chunk = new TextDecoder().decode(value)
      const validation = validateOpenAIStreamingResponse(contentType, chunk)
      
      return {
        ...validation,
        example: chunk.substring(0, 500) // First 500 chars as example
      }
    } finally {
      reader.releaseLock()
    }

  } catch (error) {
    return {
      isValid: false,
      issues: [error instanceof Error ? error.message : 'Unknown error'],
      recommendations: ['Check network connectivity and endpoint availability']
    }
  }
}