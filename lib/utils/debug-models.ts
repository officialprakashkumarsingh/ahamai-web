export function debugModelIssues() {
  if (typeof window === 'undefined') return

  console.log('🔍 Debug: Checking for model issues...')
  
  // Check cookies
  const cookies = document.cookie.split(';')
  const selectedModelCookie = cookies.find(cookie => cookie.trim().startsWith('selectedModel='))
  
  if (selectedModelCookie) {
    try {
      const modelJson = selectedModelCookie.split('=')[1]
      const model = JSON.parse(decodeURIComponent(modelJson))
      
      console.log('🍪 Selected model from cookie:', {
        id: model.id,
        name: model.name,
        provider: model.provider,
        providerId: model.providerId
      })
      
      // Check for issues
      if (model.id?.startsWith('<') && model.id?.endsWith('>')) {
        console.error('❌ Template model detected in cookie:', model.id)
        return { issue: 'template_model', model }
      }
      
      if (!model.id || model.id.trim() === '') {
        console.error('❌ Empty model ID in cookie')
        return { issue: 'empty_model_id', model }
      }
      
      if (model.providerId === 'openai-compatible') {
        console.log('🔧 OpenAI-compatible model detected, checking configuration...')
        
        // Check settings
        const settings = localStorage.getItem('aham-ai-settings')
        if (settings) {
          try {
            const parsedSettings = JSON.parse(settings)
            const openaiSettings = parsedSettings.openaiCompatible
            
            if (!openaiSettings?.enabled) {
              console.error('❌ OpenAI-compatible model selected but not enabled in settings')
              return { issue: 'not_enabled', model, settings: openaiSettings }
            }
            
            if (!openaiSettings?.apiKey || !openaiSettings?.baseURL) {
              console.error('❌ OpenAI-compatible model selected but missing credentials')
              return { issue: 'missing_credentials', model, settings: openaiSettings }
            }
            
            console.log('✅ OpenAI-compatible configuration looks good:', {
              enabled: openaiSettings.enabled,
              hasApiKey: !!openaiSettings.apiKey,
              hasBaseURL: !!openaiSettings.baseURL,
              baseURL: openaiSettings.baseURL,
              defaultModel: openaiSettings.model
            })
            
          } catch (e) {
            console.error('❌ Failed to parse settings:', e)
            return { issue: 'invalid_settings', model }
          }
        } else {
          console.error('❌ No settings found for OpenAI-compatible model')
          return { issue: 'no_settings', model }
        }
      }
      
    } catch (e) {
      console.error('❌ Failed to parse selected model cookie:', e)
      return { issue: 'invalid_cookie' }
    }
  } else {
    console.log('ℹ️ No selected model cookie found')
    return { issue: 'no_cookie' }
  }
  
  console.log('✅ No obvious model issues detected')
  return { issue: 'none' }
}

export function clearAllModelData() {
  if (typeof window === 'undefined') return
  
  console.log('🧹 Clearing all model data...')
  
  // Clear selected model cookie
  document.cookie = 'selectedModel=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  
  // Clear OpenAI-compatible settings
  try {
    const settings = localStorage.getItem('aham-ai-settings')
    if (settings) {
      const parsedSettings = JSON.parse(settings)
      delete parsedSettings.openaiCompatible
      localStorage.setItem('aham-ai-settings', JSON.stringify(parsedSettings))
    }
  } catch (e) {
    console.error('Failed to clear settings:', e)
  }
  
  console.log('✅ All model data cleared. Please refresh the page.')
}

// Auto-run debug on import in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Add a small delay to let the page load
  setTimeout(() => {
    debugModelIssues()
  }, 1000)
}