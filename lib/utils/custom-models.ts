import { Model } from '@/lib/types/models'
import { getOpenAICompatibleSettings } from './settings'

export async function getCustomModels(): Promise<Model[]> {
  if (typeof window === 'undefined') {
    console.log('getCustomModels: window is undefined (server-side)')
    return []
  }
  
  const settings = getOpenAICompatibleSettings()
  console.log('getCustomModels: settings loaded:', {
    enabled: settings.enabled,
    hasApiKey: !!settings.apiKey,
    hasBaseURL: !!settings.baseURL,
    baseURL: settings.baseURL
  })
  
  if (!settings.enabled || !settings.apiKey || !settings.baseURL) {
    console.log('getCustomModels: custom endpoint not enabled or missing credentials')
    return []
  }

  try {
    console.log('getCustomModels: fetching models from:', `${settings.baseURL}/models`)
    
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(`${settings.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('getCustomModels: Failed to fetch models from custom endpoint:', response.status, response.statusText)
      // Try to get more details about the error
      try {
        const errorText = await response.text()
        console.error('getCustomModels: Error response body:', errorText)
      } catch (e) {
        console.error('getCustomModels: Could not read error response')
      }
      return []
    }

    const data = await response.json()
    const models = data.data || []
    console.log('getCustomModels: raw models from API:', models)

    const processedModels = models
      .filter((model: any) => {
        // Validate that model has a valid ID
        if (!model.id || typeof model.id !== 'string') {
          console.warn('getCustomModels: Skipping model with invalid ID:', model)
          return false
        }
        // Skip template models or invalid model names
        if (model.id.startsWith('<') && model.id.endsWith('>')) {
          console.warn('getCustomModels: Skipping template model:', model.id)
          return false
        }
        // Additional validation: ensure ID doesn't contain problematic characters
        if (model.id.includes(':') && !model.id.startsWith('openai-compatible:')) {
          console.warn('getCustomModels: Skipping model with problematic ID (contains colon):', model.id)
          return false
        }
        return true
      })
      .map((model: any) => {
        console.log('getCustomModels: Processing model:', model.id)
        return {
          id: model.id.trim(), // Ensure no leading/trailing whitespace
          name: model.id.trim(),
          provider: 'OpenAI Compatible',
          providerId: 'openai-compatible',
          enabled: true,
          toolCallType: 'native' as const,
          toolCallModel: undefined,
          // Include the OpenAI compatible configuration for server-side validation
          openaiCompatibleConfig: {
            enabled: settings.enabled,
            apiKey: settings.apiKey,
            baseURL: settings.baseURL
          }
        }
      })
    
    console.log('getCustomModels: processed models:', processedModels)
    return processedModels
  } catch (error) {
    console.error('getCustomModels: Error fetching custom models:', error)
    return []
  }
}

export async function getCustomDefaultModel(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  
  const settings = getOpenAICompatibleSettings()
  if (!settings.enabled) {
    return null
  }
  
  // If user specified a specific model, use it
  if (settings.model && settings.model.trim()) {
    return `openai-compatible:${settings.model}`
  }
  
  // Otherwise, try to get the first available model from the endpoint
  try {
    const customModels = await getCustomModels()
    if (customModels.length > 0) {
      return `openai-compatible:${customModels[0].id}`
    }
  } catch (error) {
    console.error('getCustomDefaultModel: Failed to get models from endpoint:', error)
  }
  
  return null
}

export async function testOpenAICompatibleEndpoint(settings: { apiKey: string; baseURL: string }): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Can only test from browser' }
  }

  try {
    // Test the /models endpoint first
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(`${settings.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}` 
      }
    }

    const data = await response.json()
    if (!data.data || !Array.isArray(data.data)) {
      return { 
        success: false, 
        error: 'Invalid response format: expected { data: [...] }' 
      }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}