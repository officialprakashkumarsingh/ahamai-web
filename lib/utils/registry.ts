import { anthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { deepseek } from '@ai-sdk/deepseek'
import { createFireworks, fireworks } from '@ai-sdk/fireworks'
import { google } from '@ai-sdk/google'
import { groq } from '@ai-sdk/groq'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import {
  createProviderRegistry,
  extractReasoningMiddleware,
  wrapLanguageModel
} from 'ai'
import { createOllama } from 'ollama-ai-provider'
import { getOpenAICompatibleSettings } from './settings'

export const registry = createProviderRegistry({
  openai,
  anthropic,
  google,
  groq,
  ollama: createOllama({
    baseURL: `${process.env.OLLAMA_BASE_URL}/api`
  }),
  azure: createAzure({
    apiKey: process.env.AZURE_API_KEY,
    resourceName: process.env.AZURE_RESOURCE_NAME,
    apiVersion: '2025-03-01-preview'
  }),
  deepseek,
  fireworks: {
    ...createFireworks({
      apiKey: process.env.FIREWORKS_API_KEY
    }),
    languageModel: fireworks
  },
  'openai-compatible': createOpenAI({
    apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
    baseURL: process.env.OPENAI_COMPATIBLE_API_BASE_URL,
    compatibility: 'strict', // Ensure OpenAI compatibility
    fetch: fetch // Explicitly set fetch for better compatibility
  }),
  xai
})

function getCustomOpenAIProvider() {
  if (typeof window !== 'undefined') {
    const settings = getOpenAICompatibleSettings()
    if (settings.enabled && settings.apiKey && settings.baseURL) {
      return createOpenAI({
        apiKey: settings.apiKey,
        baseURL: settings.baseURL,
        compatibility: 'strict', // Ensure OpenAI compatibility
        fetch: fetch, // Explicitly set fetch for better compatibility
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
  }
  return null
}

export function getModel(model: string) {
  const [provider, ...modelNameParts] = model.split(':') ?? []
  const modelName = modelNameParts.join(':')
  
  // Handle custom OpenAI-compatible provider
  if (provider === 'openai-compatible') {
    const customProvider = getCustomOpenAIProvider()
    if (customProvider) {
      try {
        return customProvider(modelName)
      } catch (error) {
        console.error('Error creating custom OpenAI provider model:', error)
        // Fallback to environment-configured provider
      }
    }
    // Fallback to environment-configured provider
    try {
      return registry.languageModel(model as Parameters<typeof registry.languageModel>[0])
    } catch (error) {
      console.error('Error with registry OpenAI compatible model:', error)
      throw error
    }
  }
  
  if (model.includes('ollama')) {
    const ollama = createOllama({
      baseURL: `${process.env.OLLAMA_BASE_URL}/api`
    })

    // if model is deepseek-r1, add reasoning middleware
    if (model.includes('deepseek-r1')) {
      return wrapLanguageModel({
        model: ollama(modelName),
        middleware: extractReasoningMiddleware({
          tagName: 'think'
        })
      })
    }

    // if ollama provider, set simulateStreaming to true
    return ollama(modelName, {
      simulateStreaming: true
    })
  }

  // if model is groq and includes deepseek-r1, add reasoning middleware
  if (model.includes('groq') && model.includes('deepseek-r1')) {
    return wrapLanguageModel({
      model: groq(modelName),
      middleware: extractReasoningMiddleware({
        tagName: 'think'
      })
    })
  }

  // if model is fireworks and includes deepseek-r1, add reasoning middleware
  if (model.includes('fireworks') && model.includes('deepseek-r1')) {
    return wrapLanguageModel({
      model: fireworks(modelName),
      middleware: extractReasoningMiddleware({
        tagName: 'think'
      })
    })
  }

  return registry.languageModel(
    model as Parameters<typeof registry.languageModel>[0]
  )
}

export function isProviderEnabled(providerId: string, modelConfig?: any): boolean {
  switch (providerId) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    case 'groq':
      return !!process.env.GROQ_API_KEY
    case 'ollama':
      return !!process.env.OLLAMA_BASE_URL
    case 'azure':
      return !!process.env.AZURE_API_KEY && !!process.env.AZURE_RESOURCE_NAME
    case 'deepseek':
      return !!process.env.DEEPSEEK_API_KEY
    case 'fireworks':
      return !!process.env.FIREWORKS_API_KEY
    case 'xai':
      return !!process.env.XAI_API_KEY
    case 'openai-compatible':
      // If model config is passed (from server), check it first
      if (modelConfig?.openaiCompatibleConfig) {
        const config = modelConfig.openaiCompatibleConfig
        return !!(config.enabled && config.apiKey && config.baseURL)
      }
      
      // Check user settings in browser
      if (typeof window !== 'undefined') {
        const settings = getOpenAICompatibleSettings()
        if (settings.enabled && settings.apiKey && settings.baseURL) {
          return true
        }
      }
      
      // Fallback to environment variables
      return (
        !!process.env.OPENAI_COMPATIBLE_API_KEY &&
        !!process.env.OPENAI_COMPATIBLE_API_BASE_URL
      )
    default:
      return false
  }
}

export function getToolCallModel(model?: string) {
  const [provider, ...modelNameParts] = model?.split(':') ?? []
  const modelName = modelNameParts.join(':')
  switch (provider) {
    case 'deepseek':
      return getModel('deepseek:deepseek-chat')
    case 'fireworks':
      return getModel(
        'fireworks:accounts/fireworks/models/llama-v3p1-8b-instruct'
      )
    case 'groq':
      return getModel('groq:llama-3.1-8b-instant')
    case 'ollama':
      const ollamaModel =
        process.env.NEXT_PUBLIC_OLLAMA_TOOL_CALL_MODEL || modelName
      return getModel(`ollama:${ollamaModel}`)
    case 'google':
      return getModel('google:gemini-2.0-flash')
    default:
      return getModel('openai:gpt-4o-mini')
  }
}

export function isToolCallSupported(model?: string) {
  const [provider, ...modelNameParts] = model?.split(':') ?? []
  const modelName = modelNameParts.join(':')

  if (provider === 'ollama') {
    return false
  }

  if (provider === 'google') {
    return false
  }

  // Deepseek R1 is not supported
  // Deepseek v3's tool call is unstable, so we include it in the list
  return !modelName?.includes('deepseek')
}

export function isReasoningModel(model: string): boolean {
  if (typeof model !== 'string') {
    return false
  }
  return (
    model.includes('deepseek-r1') ||
    model.includes('deepseek-reasoner') ||
    model.includes('o3-mini')
  )
}
