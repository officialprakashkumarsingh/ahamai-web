import { tool } from 'ai'
import { z } from 'zod'

const chartGenerationSchema = z.object({
  type: z.enum(['line', 'bar', 'pie', 'doughnut', 'radar', 'scatter', 'bubble', 'polarArea']).describe('The type of chart to generate'),
  title: z.string().describe('The title of the chart'),
  data: z.object({
    labels: z.array(z.string()).describe('Labels for the data points'),
    datasets: z.array(z.object({
      label: z.string().describe('Label for this dataset'),
      data: z.array(z.number()).describe('The data values'),
      backgroundColor: z.array(z.string()).optional().describe('Background colors for each data point'),
      borderColor: z.string().optional().describe('Border color for the dataset'),
      fill: z.boolean().optional().describe('Whether to fill the area under the line')
    })).describe('The datasets to display')
  }).describe('The chart data'),
  options: z.object({
    responsive: z.boolean().optional().default(true),
    plugins: z.object({
      legend: z.object({
        display: z.boolean().optional().default(true),
        position: z.enum(['top', 'bottom', 'left', 'right']).optional().default('top')
      }).optional(),
      title: z.object({
        display: z.boolean().optional().default(true),
        text: z.string().optional()
      }).optional()
    }).optional()
  }).optional().describe('Chart configuration options'),
  width: z.number().optional().default(800).describe('Width of the chart in pixels'),
  height: z.number().optional().default(600).describe('Height of the chart in pixels')
})

export const generateChartTool = tool({
  description: 'Generate charts and data visualizations using Chart.js',
  parameters: chartGenerationSchema,
  execute: async ({ type, title, data, options = {}, width, height }) => {
    try {
      // Create the Chart.js configuration
      const chartConfig = {
        type,
        data,
        options: {
          ...options,
          plugins: {
            ...options.plugins,
            title: {
              display: true,
              text: title,
              ...options.plugins?.title
            }
          }
        }
      }
      
      // Encode the configuration for the QuickChart API
      const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig))
      
      // Generate the chart URL using QuickChart
      const chartUrl = `https://quickchart.io/chart?c=${encodedConfig}&width=${width}&height=${height}&backgroundColor=white`
      
      // Also create a Chart.js sandbox URL for interactive viewing
      const sandboxUrl = `https://quickchart.io/sandbox/#${encodedConfig}`
      
      return {
        success: true,
        charts: [{
          type,
          url: chartUrl,
          sandboxUrl,
          title,
          width,
          height,
          config: chartConfig
        }]
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate chart'
      }
    }
  }
})