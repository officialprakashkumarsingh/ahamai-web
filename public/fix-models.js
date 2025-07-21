// AhamAI Model Fix Script
// Run this in your browser console if you're having issues with OpenAI-compatible models

console.log('🔧 AhamAI Model Fix Script Starting...')

function fixAhamAIModels() {
  // Clear invalid model cookies
  const cookies = document.cookie.split(';')
  const selectedModelCookie = cookies.find(cookie => cookie.trim().startsWith('selectedModel='))
  
  if (selectedModelCookie) {
    try {
      const modelJson = selectedModelCookie.split('=')[1]
      const model = JSON.parse(decodeURIComponent(modelJson))
      
      console.log('Current selected model:', model)
      
      // Check for template models
      if (model.id?.startsWith('<') && model.id?.endsWith('>')) {
        console.log('❌ Found template model, clearing...')
        document.cookie = 'selectedModel=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        console.log('✅ Template model cleared')
        return true
      }
      
      // Check for empty model IDs
      if (!model.id || model.id.trim() === '') {
        console.log('❌ Found empty model ID, clearing...')
        document.cookie = 'selectedModel=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        console.log('✅ Empty model cleared')
        return true
      }
      
      console.log('✅ Selected model looks good')
      return false
      
    } catch (e) {
      console.log('❌ Invalid model cookie, clearing...')
      document.cookie = 'selectedModel=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      console.log('✅ Invalid cookie cleared')
      return true
    }
  }
  
  console.log('ℹ️ No selected model found')
  return false
}

// Run the fix
const fixed = fixAhamAIModels()

if (fixed) {
  console.log('🎉 Issues found and fixed! Please refresh the page.')
  console.log('To refresh automatically, run: location.reload()')
} else {
  console.log('✅ No issues found. If you\'re still having problems:')
  console.log('1. Go to Settings (⚙️ icon)')
  console.log('2. Configure your OpenAI-compatible endpoint')
  console.log('3. Test the connection')
  console.log('4. Make sure you have a valid model name')
}

console.log('🔧 Script completed.')