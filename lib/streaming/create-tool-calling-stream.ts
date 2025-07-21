import { researcher } from '@/lib/agents/researcher'
import {
  convertToCoreMessages,
  CoreMessage,
  createDataStreamResponse,
  DataStreamWriter,
  streamText
} from 'ai'
import { getMaxAllowedTokens, truncateMessages } from '../utils/context-window'
import { isReasoningModel } from '../utils/registry'
import { debugStreamingRequest, debugStreamingResponse, debugStreamingError } from '../utils/openai-compatible-debug'
import { handleStreamFinish } from './handle-stream-finish'
import { BaseStreamConfig } from './types'

// Function to check if a message contains ask_question tool invocation
function containsAskQuestionTool(message: CoreMessage) {
  // For CoreMessage format, we check the content array
  if (message.role !== 'assistant' || !Array.isArray(message.content)) {
    return false
  }

  // Check if any content item is a tool-call with ask_question tool
  return message.content.some(
    item => item.type === 'tool-call' && item.toolName === 'ask_question'
  )
}

export function createToolCallingStreamResponse(config: BaseStreamConfig) {
  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      const { messages, model, chatId, searchMode, userId } = config
      const modelId = `${model.providerId}:${model.id}`

      try {
        const coreMessages = convertToCoreMessages(messages)
        const truncatedMessages = truncateMessages(
          coreMessages,
          getMaxAllowedTokens(model)
        )

        let researcherConfig = await researcher({
          messages: truncatedMessages,
          model: modelId,
          searchMode
        })

        // Debug the streaming request
        debugStreamingRequest(modelId, researcherConfig)

        const result = streamText({
          ...researcherConfig,
          onFinish: async result => {
            // Check if the last message contains an ask_question tool invocation
            const shouldSkipRelatedQuestions =
              isReasoningModel(modelId) ||
              (result.response.messages.length > 0 &&
                containsAskQuestionTool(
                  result.response.messages[
                    result.response.messages.length - 1
                  ] as CoreMessage
                ))

            await handleStreamFinish({
              responseMessages: result.response.messages,
              originalMessages: messages,
              model: modelId,
              chatId,
              dataStream,
              userId,
              skipRelatedQuestions: shouldSkipRelatedQuestions
            })
          }
        })

        // Debug the streaming response
        debugStreamingResponse(modelId, result)

        result.mergeIntoDataStream(dataStream)
      } catch (error) {
        console.error('Stream execution error:', error)
        
        // Debug the streaming error
        debugStreamingError(modelId, error)
        
        // If it's an OpenAI compatible model error, provide more context
        if (modelId.includes('openai-compatible')) {
          console.error('OpenAI Compatible streaming error:', error)
          dataStream.writeMessageAnnotation({
            type: 'error',
            data: {
              message: 'OpenAI Compatible model streaming failed. Check your API endpoint configuration.',
              originalError: error instanceof Error ? error.message : String(error)
            }
          })
        }
        throw error
      }
    },
    onError: error => {
      console.error('Stream error:', error)
      
      // Provide more descriptive error messages for OpenAI compatible models
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          return 'Failed to connect to OpenAI compatible endpoint. Please check your API URL and network connection.'
        }
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          return 'Invalid API key for OpenAI compatible endpoint. Please check your credentials.'
        }
        if (error.message.includes('404')) {
          return 'OpenAI compatible endpoint not found. Please verify your base URL.'
        }
        return error.message
      }
      return String(error)
    }
  })
}
