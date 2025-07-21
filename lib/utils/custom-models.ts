import { Model } from '@/lib/types/models'
import { getOpenAICompatibleSettings } from './settings'

export async function getCustomModels(): Promise<Model[]> {
  if (typeof window === 'undefined') return []
  
  const settings = getOpenAICompatibleSettings()
  if (!settings.enabled || !settings.apiKey || !settings.baseURL) {
    return []
  }

  try {
    const response = await fetch(`${settings.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Failed to fetch models from custom endpoint:', response.statusText)
      return []
    }

    const data = await response.json()
    const models = data.data || []

    return models.map((model: any) => ({
      id: model.id,
      name: model.id,
      provider: 'OpenAI Compatible',
      providerId: 'openai-compatible',
      enabled: true,
      toolCallType: 'native' as const,
      toolCallModel: undefined
    }))
  } catch (error) {
    console.error('Error fetching custom models:', error)
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