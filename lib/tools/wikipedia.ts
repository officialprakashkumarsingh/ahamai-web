import { tool } from 'ai'
import { z } from 'zod'

const wikipediaSearchSchema = z.object({
  query: z.string().describe('The search query for Wikipedia articles'),
  limit: z.number().optional().default(5).describe('Number of articles to return (max 10)'),
  language: z.string().optional().default('en').describe('Language code for Wikipedia (e.g., en, es, fr)')
})

export const wikipediaSearchTool = tool({
  description: 'Search Wikipedia articles and get comprehensive information on topics for broad research',
  parameters: wikipediaSearchSchema,
  execute: async ({ query, limit = 5, language = 'en' }) => {
    try {
      const searchLimit = Math.min(limit, 10) // Cap at 10 results
      
      // Use the correct Wikimedia Core REST API
      const searchUrl = `https://api.wikimedia.org/core/v1/wikipedia/${language}/search/page?q=${encodeURIComponent(query)}&limit=${searchLimit}`
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Research-Assistant/1.0 (educational-use)'
        }
      })
      
      if (!searchResponse.ok) {
        throw new Error(`Wikipedia search failed: ${searchResponse.status}`)
      }
      
      const searchData = await searchResponse.json()
      
      if (!searchData.pages || searchData.pages.length === 0) {
        return {
          success: false,
          error: `No Wikipedia articles found for "${query}"`
        }
      }
      
      // Process search results directly from the API response
      const articles = []
      
      for (const page of searchData.pages.slice(0, searchLimit)) {
        try {
          // The search API already provides most needed information
          articles.push({
            title: page.title,
            description: page.description || '',
            extract: page.excerpt || '',
            url: `https://${language}.wikipedia.org/wiki/${encodeURIComponent(page.key)}`,
            thumbnail: page.thumbnail?.url || null,
            coordinates: null, // Not provided in search API
            pageid: page.id
          })
        } catch (error) {
          console.log(`Failed to process page ${page.title}:`, error)
        }
      }
      
      return {
        success: true,
        query: query,
        language: language,
        total_results: searchData.pages.length,
        articles: articles
      }
      
    } catch (error) {
      console.error('Wikipedia search error:', error)
      return {
        success: false,
        error: `Failed to search Wikipedia: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
})