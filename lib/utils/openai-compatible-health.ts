interface HealthCheckResult {
  endpoint: 'models' | 'chat_completions' | 'streaming'
  success: boolean
  error?: string
  details?: any
  responseTime?: number
}

interface OverallHealthCheck {
  overall: boolean
  results: HealthCheckResult[]
  summary: string
  recommendations?: string[]
}

export async function performOpenAICompatibleHealthCheck(settings: {
  apiKey: string
  baseURL: string
  model?: string
}): Promise<OverallHealthCheck> {
  const results: HealthCheckResult[] = []
  let overallSuccess = true

  // 1. Test /models endpoint
  const modelsResult = await testModelsEndpoint(settings)
  results.push(modelsResult)
  if (!modelsResult.success) overallSuccess = false

  // 2. Test /chat/completions endpoint (non-streaming)
  const chatResult = await testChatCompletions(settings, false)
  results.push(chatResult)
  if (!chatResult.success) overallSuccess = false

  // 3. Test /chat/completions endpoint (streaming)
  const streamingResult = await testChatCompletions(settings, true)
  results.push(streamingResult)
  if (!streamingResult.success) overallSuccess = false

  // Generate summary and recommendations
  const summary = generateSummary(results)
  const recommendations = generateRecommendations(results)

  return {
    overall: overallSuccess,
    results,
    summary,
    recommendations: recommendations.length > 0 ? recommendations : undefined
  }
}

async function testModelsEndpoint(settings: { apiKey: string; baseURL: string }): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${settings.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return {
        endpoint: 'models',
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: errorText,
        responseTime
      }
    }

    const data = await response.json()
    
    if (!data.data || !Array.isArray(data.data)) {
      return {
        endpoint: 'models',
        success: false,
        error: 'Invalid response format',
        details: 'Expected { data: [...] } format',
        responseTime
      }
    }

    return {
      endpoint: 'models',
      success: true,
      details: {
        modelCount: data.data.length,
        models: data.data.slice(0, 5).map((m: any) => m.id) // First 5 models
      },
      responseTime
    }
  } catch (error) {
    return {
      endpoint: 'models',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    }
  }
}

async function testChatCompletions(
  settings: { apiKey: string; baseURL: string; model?: string }, 
  streaming: boolean
): Promise<HealthCheckResult> {
  const startTime = Date.now()
  const endpoint = streaming ? 'streaming' : 'chat_completions'
  
  try {
    // First get a model to test with
    let testModel = settings.model
    
    if (!testModel) {
      const modelsResponse = await fetch(`${settings.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json()
        testModel = modelsData.data?.[0]?.id
      }
    }

    if (!testModel) {
      return {
        endpoint,
        success: false,
        error: 'No model available for testing',
        responseTime: Date.now() - startTime
      }
    }

    const response = await fetch(`${settings.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: 'user', content: 'Respond with "Health check successful"' }],
        stream: streaming,
        max_tokens: 20
      }),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return {
        endpoint,
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: errorText,
        responseTime
      }
    }

    if (streaming) {
      // For streaming, check if we get the right content type and can read data
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('text/') && !contentType?.includes('application/octet-stream')) {
        return {
          endpoint,
          success: false,
          error: 'Invalid streaming content type',
          details: `Got: ${contentType}`,
          responseTime
        }
      }

      const reader = response.body?.getReader()
      if (!reader) {
        return {
          endpoint,
          success: false,
          error: 'Cannot read streaming response',
          responseTime
        }
      }

      try {
        const { value, done } = await reader.read()
        if (done || !value) {
          return {
            endpoint,
            success: false,
            error: 'No streaming data received',
            responseTime
          }
        }

        const chunk = new TextDecoder().decode(value)
        const hasValidFormat = chunk.includes('data:') || chunk.includes('"id"') || chunk.includes('"choices"')
        
        return {
          endpoint,
          success: hasValidFormat,
          error: hasValidFormat ? undefined : 'Invalid streaming format',
          details: {
            firstChunk: chunk.substring(0, 100),
            contentType
          },
          responseTime
        }
      } finally {
        reader.releaseLock()
      }
    } else {
      // For non-streaming, parse the JSON response
      const data = await response.json()
      
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        return {
          endpoint,
          success: false,
          error: 'Invalid response format',
          details: 'Missing or empty choices array',
          responseTime
        }
      }

      return {
        endpoint,
        success: true,
        details: {
          model: data.model,
          usage: data.usage,
          responseContent: data.choices[0].message?.content?.substring(0, 50)
        },
        responseTime
      }
    }
  } catch (error) {
    return {
      endpoint,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    }
  }
}

function generateSummary(results: HealthCheckResult[]): string {
  const successful = results.filter(r => r.success).length
  const total = results.length
  
  if (successful === total) {
    return `✅ All checks passed (${successful}/${total}). OpenAI compatible endpoint is working correctly.`
  } else if (successful === 0) {
    return `❌ All checks failed (0/${total}). OpenAI compatible endpoint is not working.`
  } else {
    return `⚠️ Partial success (${successful}/${total}). Some functionality may not work properly.`
  }
}

function generateRecommendations(results: HealthCheckResult[]): string[] {
  const recommendations: string[] = []
  
  const modelsResult = results.find(r => r.endpoint === 'models')
  const chatResult = results.find(r => r.endpoint === 'chat_completions')
  const streamingResult = results.find(r => r.endpoint === 'streaming')

  if (!modelsResult?.success) {
    recommendations.push('Fix the /models endpoint - this is required to list available models')
    if (modelsResult?.error?.includes('401') || modelsResult?.error?.includes('unauthorized')) {
      recommendations.push('Check your API key - it appears to be invalid')
    }
    if (modelsResult?.error?.includes('404')) {
      recommendations.push('Verify your base URL - the /models endpoint was not found')
    }
  }

  if (!chatResult?.success) {
    recommendations.push('Fix the /chat/completions endpoint for basic chat functionality')
  }

  if (!streamingResult?.success) {
    recommendations.push('Fix streaming support in /chat/completions endpoint')
    if (streamingResult?.error?.includes('content type')) {
      recommendations.push('Ensure streaming responses use correct Content-Type (text/plain or text/event-stream)')
    }
    if (streamingResult?.error?.includes('format')) {
      recommendations.push('Ensure streaming responses use OpenAI-compatible SSE format with "data:" prefixes')
    }
  }

  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length

  if (avgResponseTime > 5000) {
    recommendations.push('Consider optimizing response times - current average is quite slow')
  }

  return recommendations
}