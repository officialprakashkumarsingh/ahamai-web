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

    const processedModels = models.map((model: any) => ({
      id: model.id,
      name: model.id,
      provider: 'OpenAI Compatible',
      providerId: 'openai-compatible',
      enabled: true,
      toolCallType: 'native' as const,
      toolCallModel: undefined
    }))
    
    console.log('getCustomModels: processed models:', processedModels)
    return processedModels
  } catch (error) {
    console.error('getCustomModels: Error fetching custom models:', error)
    return []
  }
}

export function getCustomDefaultModel(): string | null {
  if (typeof window === 'undefined') return null
  
  const settings = getOpenAICompatibleSettings()
  if (!settings.enabled || !settings.model) {
    return null
  }
  
  return `openai-compatible:${settings.model}`
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