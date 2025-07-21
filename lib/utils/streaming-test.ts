export async function testOpenAICompatibleStreaming(settings: { 
  apiKey: string; 
  baseURL: string; 
  model?: string 
}): Promise<{ success: boolean; error?: string; details?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Can only test from browser' }
  }

  try {
    // First get available models
    const modelsResponse = await fetch(`${settings.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!modelsResponse.ok) {
      return { 
        success: false, 
        error: `Failed to fetch models: ${modelsResponse.status} ${modelsResponse.statusText}` 
      }
    }

    const modelsData = await modelsResponse.json()
    const models = modelsData.data || []
    
    if (models.length === 0) {
      return { 
        success: false, 
        error: 'No models available from endpoint' 
      }
    }

    // Use provided model or first available model
    const testModel = settings.model || models[0].id

    // Test a simple streaming chat completion
    const response = await fetch(`${settings.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: 'user', content: 'Say "streaming test successful" if you can see this.' }],
        stream: true,
        max_tokens: 50
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { 
        success: false, 
        error: `Streaming request failed: ${response.status} ${response.statusText}`,
        details: errorText
      }
    }

    // Check if response is actually streaming
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('text/plain') && !contentType?.includes('text/event-stream')) {
      return { 
        success: false, 
        error: 'Response is not streaming format',
        details: `Content-Type: ${contentType}`
      }
    }

    // Try to read first few chunks
    const reader = response.body?.getReader()
    if (!reader) {
      return { 
        success: false, 
        error: 'Response body is not readable stream' 
      }
    }

    try {
      const { value, done } = await reader.read()
      if (done || !value) {
        return { 
          success: false, 
          error: 'No streaming data received' 
        }
      }

      const chunk = new TextDecoder().decode(value)
      
      // Check if it looks like SSE format
      if (chunk.includes('data:') || chunk.includes('{"id"')) {
        return { 
          success: true, 
          details: `Streaming working with model: ${testModel}` 
        }
      } else {
        return { 
          success: false, 
          error: 'Response format is not OpenAI compatible',
          details: `Received: ${chunk.substring(0, 100)}...`
        }
      }
    } finally {
      reader.releaseLock()
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}