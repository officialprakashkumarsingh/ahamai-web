export interface OpenAICompatibleSettings {
  apiKey: string
  baseURL: string
  model: string
  enabled: boolean
}

const SETTINGS_KEY = 'aham-ai-settings'

export function getOpenAICompatibleSettings(): OpenAICompatibleSettings {
  if (typeof window === 'undefined') {
    return {
      apiKey: '',
      baseURL: '',
      model: '',
      enabled: false
    }
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const settings = JSON.parse(stored)
      return {
        apiKey: settings.openaiCompatible?.apiKey || '',
        baseURL: settings.openaiCompatible?.baseURL || '',
        model: settings.openaiCompatible?.model || '',
        enabled: settings.openaiCompatible?.enabled || false
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }

  return {
    apiKey: '',
    baseURL: '',
    model: '',
    enabled: false
  }
}

export function saveOpenAICompatibleSettings(settings: OpenAICompatibleSettings): void {
  if (typeof window === 'undefined') return

  try {
    const existingSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    const updatedSettings = {
      ...existingSettings,
      openaiCompatible: settings
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

export function clearOpenAICompatibleSettings(): void {
  if (typeof window === 'undefined') return

  try {
    const existingSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    delete existingSettings.openaiCompatible
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(existingSettings))
  } catch (error) {
    console.error('Failed to clear settings:', error)
  }
}

export function clearInvalidSelectedModel(): void {
  if (typeof window === 'undefined') return

  try {
    // Check if there's a selectedModel cookie
    const cookies = document.cookie.split(';')
    const selectedModelCookie = cookies.find(cookie => cookie.trim().startsWith('selectedModel='))
    
    if (selectedModelCookie) {
      const modelJson = selectedModelCookie.split('=')[1]
      if (modelJson) {
        try {
          const model = JSON.parse(decodeURIComponent(modelJson))
          // Check if it's a template model or invalid
          if (model.id && (model.id.startsWith('<') && model.id.endsWith('>'))) {
            console.log('Clearing invalid template model from cookie:', model.id)
            document.cookie = 'selectedModel=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          } else if (!model.id || model.id.trim() === '') {
            console.log('Clearing model with empty ID from cookie')
            document.cookie = 'selectedModel=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }
        } catch (e) {
          console.log('Clearing malformed selectedModel cookie')
          document.cookie = 'selectedModel=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      }
    }
  } catch (error) {
    console.error('Failed to clear invalid selected model:', error)
  }
}