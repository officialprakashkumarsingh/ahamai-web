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
      
      // Generate URLs for both models with unique seeds to ensure different results
      const timestamp = Date.now()
      const fluxSeed = Math.floor(Math.random() * 1000000)
      const turboSeed = Math.floor(Math.random() * 1000000)
      
      const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=${width}&height=${height}&nologo=true&enhance=${enhance}&seed=${fluxSeed}&_=${timestamp}`
      const turboUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=turbo&width=${width}&height=${height}&nologo=true&enhance=${enhance}&seed=${turboSeed}&_=${timestamp}`
      
      // Test if images are accessible (optional quick check)
      const images = [
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
      
      return {
        success: true,
        images: images,
        prompt: prompt,
        model: model,
        settings: {
          width,
          height,
          enhance
        }
      }
    } catch (error) {
      console.error('Image generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image'
      }
    }
  }
})