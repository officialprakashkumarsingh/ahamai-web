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