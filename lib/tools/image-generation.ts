import { tool } from 'ai'
import { z } from 'zod'

const imageGenerationSchema = z.object({
  prompt: z.string().describe('The text description of the image to generate'),
  model: z.enum(['flux', 'turbo']).default('flux').describe('The model to use for generation'),
  width: z.number().optional().default(1024).describe('Width of the image in pixels'),
  height: z.number().optional().default(1024).describe('Height of the image in pixels'),
  enhance: z.boolean().optional().default(false).describe('Whether to enhance the prompt using LLM')
})

export const generateImageTool = tool({
  description: 'Generate an image based on a text description using Pollinations AI',
  parameters: imageGenerationSchema,
  execute: async ({ prompt, model, width, height, enhance }) => {
    try {
      // Encode the prompt for URL
      const encodedPrompt = encodeURIComponent(prompt)
      
      // Build the URL with parameters
      const params = new URLSearchParams({
        model,
        width: width.toString(),
        height: height.toString(),
        nologo: 'true',
        enhance: enhance.toString()
      })
      
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`
      
      // Return both models (flux and turbo) for variety
      const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=${width}&height=${height}&nologo=true&enhance=${enhance}`
      const turboUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=turbo&width=${width}&height=${height}&nologo=true&enhance=${enhance}`
      
      return {
        success: true,
        images: [
          {
            model: 'flux',
            url: fluxUrl,
            prompt: prompt,
            width: width,
            height: height
          },
          {
            model: 'turbo',
            url: turboUrl,
            prompt: prompt,
            width: width,
            height: height
          }
        ]
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image'
      }
    }
  }
})