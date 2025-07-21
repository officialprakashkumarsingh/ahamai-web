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
    const response = await fetch(`${settings.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('getCustomModels: Failed to fetch models from custom endpoint:', response.statusText)
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