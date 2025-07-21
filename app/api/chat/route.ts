import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { createManualToolStreamResponse } from '@/lib/streaming/create-manual-tool-stream'
import { createToolCallingStreamResponse } from '@/lib/streaming/create-tool-calling-stream'
import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'

import { cookies } from 'next/headers'

export const maxDuration = 30

const DEFAULT_MODEL: Model = {
  id: 'gpt-4o-mini',
  name: 'GPT-4o mini',
  provider: 'OpenAI',
  providerId: 'openai',
  enabled: true,
  toolCallType: 'native'
}

export async function POST(req: Request) {
  try {
    const { messages, id: chatId } = await req.json()
    const referer = req.headers.get('referer')
    const isSharePage = referer?.includes('/share/')
    const userId = await getCurrentUserId()

    if (isSharePage) {
      return new Response('Chat API is not available on share pages', {
        status: 403,
        statusText: 'Forbidden'
      })
    }

    const cookieStore = await cookies()
    const modelJson = cookieStore.get('selectedModel')?.value
    const searchMode = cookieStore.get('search-mode')?.value === 'true'

    let selectedModel = DEFAULT_MODEL

    if (modelJson) {
      try {
        selectedModel = JSON.parse(modelJson) as Model
        console.log('Chat API: Selected model from cookie:', {
          id: selectedModel.id,
          name: selectedModel.name,
          provider: selectedModel.provider,
          providerId: selectedModel.providerId
        })
      } catch (e) {
        console.error('Failed to parse selected model:', e)
      }
    } else {
      console.log('Chat API: No model cookie found, using default model')
    }

    // Additional validation for OpenAI-compatible models
    if (selectedModel.providerId === 'openai-compatible') {
      // Check if the model ID is a template placeholder
      if (selectedModel.id.startsWith('<') && selectedModel.id.endsWith('>')) {
        return new Response(
          JSON.stringify({
            error: 'Invalid model configuration',
            details: 'Template model placeholder detected. Please configure your OpenAI-compatible endpoint with a valid model name in Settings.',
            provider: selectedModel.provider,
            providerId: selectedModel.providerId
          }),
          {
            status: 400,
            statusText: 'Bad Request',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
      
      // Check if the model ID is empty
      if (!selectedModel.id || selectedModel.id.trim() === '') {
        return new Response(
          JSON.stringify({
            error: 'Invalid model configuration',
            details: 'Model name cannot be empty. Please configure your OpenAI-compatible endpoint with a valid model name in Settings.',
            provider: selectedModel.provider,
            providerId: selectedModel.providerId
          }),
          {
            status: 400,
            statusText: 'Bad Request',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
    }

    if (
      !isProviderEnabled(selectedModel.providerId, selectedModel) ||
      selectedModel.enabled === false
    ) {
      // Don't auto-switch models as per user request
      // Instead provide clear error message about the specific provider
      const errorMessage = selectedModel.providerId === 'openai-compatible' 
        ? 'OpenAI Compatible provider is not configured. Please check your API key and base URL in settings.'
        : `Provider "${selectedModel.provider}" (${selectedModel.providerId}) is not configured or enabled. Please configure the required API keys or select a different model.`
      
      return new Response(
        JSON.stringify({
          error: 'Selected provider not available',
          details: errorMessage,
          provider: selectedModel.provider,
          providerId: selectedModel.providerId
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const supportsToolCalling = selectedModel.toolCallType === 'native'

    return supportsToolCalling
      ? createToolCallingStreamResponse({
          messages,
          model: selectedModel,
          chatId,
          searchMode,
          userId
        })
      : createManualToolStreamResponse({
          messages,
          model: selectedModel,
          chatId,
          searchMode,
          userId
        })
  } catch (error) {
    console.error('API route error:', error)
    return new Response('Error processing your request', {
      status: 500,
      statusText: 'Internal Server Error'
    })
  }
}
