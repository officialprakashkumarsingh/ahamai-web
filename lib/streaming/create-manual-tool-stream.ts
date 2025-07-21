import {
  convertToCoreMessages,
  createDataStreamResponse,
  DataStreamWriter,
  JSONValue,
  streamText
} from 'ai'
import { manualResearcher } from '../agents/manual-researcher'
import { ExtendedCoreMessage } from '../types'
import { getMaxAllowedTokens, truncateMessages } from '../utils/context-window'
import { debugStreamingRequest, debugStreamingResponse, debugStreamingError } from '../utils/openai-compatible-debug'
import { handleStreamFinish } from './handle-stream-finish'
import { executeToolCall } from './tool-execution'
import { BaseStreamConfig } from './types'

export function createManualToolStreamResponse(config: BaseStreamConfig) {
  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      const { messages, model, chatId, searchMode, userId } = config
      
      // Debug logging for model structure
      console.log('Manual Stream: Received model object:', {
        id: model.id,
        name: model.name,
        provider: model.provider,
        providerId: model.providerId,
        fullModel: model
      })
      
      const modelId = `${model.providerId}:${model.id}`
      console.log('Manual Stream: Constructed modelId:', modelId)
      
      let toolCallModelId = model.toolCallModel
        ? `${model.providerId}:${model.toolCallModel}`
        : modelId

      try {
        const coreMessages = convertToCoreMessages(messages)
        const truncatedMessages = truncateMessages(
          coreMessages,
          getMaxAllowedTokens(model)
        )

        const { toolCallDataAnnotation, toolCallMessages } =
          await executeToolCall(
            truncatedMessages,
            dataStream,
            toolCallModelId,
            searchMode
          )

        const researcherConfig = manualResearcher({
          messages: [...truncatedMessages, ...toolCallMessages],
          model: modelId,
          isSearchEnabled: searchMode
        })

        // Debug the streaming request
        debugStreamingRequest(modelId, researcherConfig)

        // Variables to track the reasoning timing.
        let reasoningStartTime: number | null = null
        let reasoningDuration: number | null = null

        const result = streamText({
          ...researcherConfig,
          onFinish: async result => {
            const annotations: ExtendedCoreMessage[] = [
              ...(toolCallDataAnnotation ? [toolCallDataAnnotation] : []),
              {
                role: 'data',
                content: {
                  type: 'reasoning',
                  data: {
                    time: reasoningDuration ?? 0,
                    reasoning: result.reasoning
                  }
                } as JSONValue
              }
            ]

            await handleStreamFinish({
              responseMessages: result.response.messages,
              originalMessages: messages,
              model: modelId,
              chatId,
              dataStream,
              userId,
              skipRelatedQuestions: true,
              annotations
            })
          },
          onChunk(event) {
            const chunkType = event.chunk?.type

            if (chunkType === 'reasoning') {
              if (reasoningStartTime === null) {
                reasoningStartTime = Date.now()
              }
            } else {
              if (reasoningStartTime !== null) {
                const elapsedTime = Date.now() - reasoningStartTime
                reasoningDuration = elapsedTime
                dataStream.writeMessageAnnotation({
                  type: 'reasoning',
                  data: { time: elapsedTime }
                } as JSONValue)
                reasoningStartTime = null
              }
            }
          }
        })

        // Debug the streaming response
        debugStreamingResponse(modelId, result)

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true
        })
      } catch (error) {
        console.error('Stream execution error:', error)
        
        // Debug the streaming error
        debugStreamingError(modelId, error)
        
        // If it's an OpenAI compatible model error, provide more context
        if (modelId.includes('openai-compatible')) {
          console.error('OpenAI Compatible streaming error:', error)
          let errorMessage = 'OpenAI Compatible model streaming failed. Check your API endpoint configuration.'
          
          // Provide specific error messages for common issues
          if (error instanceof Error) {
            if (error.message.includes('does not exist or you do not have access')) {
              errorMessage = 'The selected OpenAI-compatible model does not exist or you do not have access to it. Please check that the model name is correct and available on your endpoint.'
            } else if (error.message.includes('Invalid model name') || error.message.includes('template placeholder')) {
              errorMessage = 'Invalid model configuration detected. Please go to Settings and configure your OpenAI-compatible endpoint with a valid model name.'
            } else if (error.message.includes('cannot be empty')) {
              errorMessage = 'Model name cannot be empty. Please configure your OpenAI-compatible endpoint with a valid model name in Settings.'
            }
          }
          
          dataStream.writeMessageAnnotation({
            type: 'error',
            data: {
              message: errorMessage,
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
