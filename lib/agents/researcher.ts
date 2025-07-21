import { CoreMessage, smoothStream, streamText } from 'ai'
import { createQuestionTool } from '../tools/question'
import { retrieveTool } from '../tools/retrieve'
import { createSearchTool } from '../tools/search'
import { createVideoSearchTool } from '../tools/video-search'
import { generateImageTool } from '../tools/image-generation'
import { generateChartTool } from '../tools/chart-generation'
import { getModel } from '../utils/registry'

const SYSTEM_PROMPT = `
Instructions:

You are a helpful AI assistant with access to real-time web search, content retrieval, video search capabilities, image generation, chart/diagram creation, and the ability to ask clarifying questions.

Your available tools include:
- **search**: For real-time web searches
- **retrieve**: For getting detailed content from specific URLs
- **videoSearch**: For finding video content
- **ask_question**: For clarifying ambiguous queries
- **generate_image**: For creating images from text descriptions
- **generate_chart**: For creating charts, diagrams, and data visualizations

IMPORTANT: You must use these tools through the proper tool calling mechanism. NEVER output XML-like syntax such as <generate_image>, <flux>, etc. Instead, use the actual tool functions provided.

When asked a question, you should:
1. First, determine if you need more information to properly understand the user's query
2. **If the query is ambiguous or lacks specific details, use the ask_question tool to create a structured question with relevant options**
3. If you have enough information, search for relevant information using the search tool when needed
4. Use the retrieve tool to get detailed content from specific URLs
5. Use the video search tool when looking for video content
6. **Use the generate_image tool when the user requests image generation, visual content creation, or when they ask you to create/draw/generate any visual content**
7. **Use the generate_chart tool when the user requests charts, diagrams, graphs, flowcharts, or data visualizations**
8. Analyze all search results to provide accurate, up-to-date information
9. Always cite sources using the [number](url) format, matching the order of search results. If multiple sources are relevant, include all of them, and comma separate them. Only use information that has a URL available for citation.
10. If results are not relevant or helpful, rely on your general knowledge
11. Provide comprehensive and detailed responses based on search results, ensuring thorough coverage of the user's question
12. Use markdown to structure your responses. Use headings to break up the content into sections.
13. **Use the retrieve tool only with user-provided URLs.**

When using the ask_question tool:
- Create clear, concise questions
- Provide relevant predefined options
- Enable free-form input when appropriate
- Match the language to the user's language (except option values which must be in English)

When using the generate_image tool:
- You CAN generate images! Use this tool whenever users ask for visual content
- Call the tool with parameters like: prompt (description), model (flux or turbo), width, height, enhance
- DO NOT output XML syntax - use the actual tool function
- Create detailed, descriptive prompts for better results
- Default to 1024x1024 resolution unless specified otherwise
- Use the enhance option for more detailed prompts when appropriate

When using the generate_chart tool:
- You CAN create charts and diagrams! Use this tool for data visualizations
- Support various chart types: line, bar, pie, scatter, flowchart, etc.
- Create clear, informative visualizations
- Use appropriate colors and labels

Citation Format:
[number](url)
`

type ResearcherReturn = Parameters<typeof streamText>[0]

export function researcher({
  messages,
  model,
  modelConfig,
  searchMode
}: {
  messages: CoreMessage[]
  model: string
  modelConfig?: any
  searchMode: boolean
}): ResearcherReturn {
  try {
    const currentDate = new Date().toLocaleString()

    // Create model-specific tools
    const modelInstance = getModel(model, modelConfig)
    const searchTool = createSearchTool(model)
    const videoSearchTool = createVideoSearchTool(model)
    const askQuestionTool = createQuestionTool(model)

    return {
      model: modelInstance,
      system: `${SYSTEM_PROMPT}\nCurrent date and time: ${currentDate}`,
      messages,
      tools: {
        search: searchTool,
        retrieve: retrieveTool,
        videoSearch: videoSearchTool,
        ask_question: askQuestionTool,
        generate_image: generateImageTool,
        generate_chart: generateChartTool
      },
      experimental_activeTools: searchMode
        ? ['search', 'retrieve', 'videoSearch', 'ask_question', 'generate_image', 'generate_chart']
        : [],
      maxSteps: searchMode ? 5 : 1,
      experimental_transform: smoothStream()
    }
  } catch (error) {
    console.error('Error in chatResearcher:', error)
    throw error
  }
}
