# OpenAI-Compatible Endpoint Troubleshooting Guide

## Issue: "Invalid model ID" Error

If you're getting an "invalid model ID" error when sending messages with OpenAI-compatible endpoints, follow these steps:

### 1. Check Browser Console
Open your browser's Developer Tools (F12) and check the Console tab for detailed logs:
- Look for "Stream: Received model object:" logs
- Look for "getModel: Processing model string:" logs
- Check if the model structure looks correct

### 2. Verify Model Selection
1. Go to Settings (⚙️ icon)
2. Enable "Custom OpenAI Endpoint"
3. Enter your API key and base URL
4. Click "Test Connection" to verify it works
5. Check that models appear in the model selector dropdown

### 3. Debug Tools
In Settings dialog:
- Click 🔍 (Debug) button to run diagnostics
- Click 🧹 (Clear) button to reset all model data if needed

### 4. Manual Browser Console Fix
If issues persist, run this in your browser console:
```javascript
// Check current model
const cookies = document.cookie.split(';')
const selectedModelCookie = cookies.find(cookie => cookie.trim().startsWith('selectedModel='))
if (selectedModelCookie) {
  const modelJson = selectedModelCookie.split('=')[1]
  const model = JSON.parse(decodeURIComponent(modelJson))
  console.log('Current model:', model)
}

// Clear invalid model
document.cookie = 'selectedModel=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
location.reload()
```

### 5. Common Issues & Solutions

**Issue**: Model appears in selector but fails when sending messages
**Solution**: The model object structure might be corrupted. Use the 🧹 Clear button in Settings.

**Issue**: Empty model ID
**Solution**: Ensure your OpenAI-compatible endpoint returns valid model IDs in the `/models` response.

**Issue**: Model name contains special characters
**Solution**: Model names should not contain colons (:) or angle brackets (< >).

### 6. Supported Endpoints
- OpenAI API
- Ollama (with openai-compatible plugin)  
- LM Studio
- Text Generation WebUI
- vLLM
- Any service that implements OpenAI's API format

### 7. Expected Model Response Format
Your `/models` endpoint should return:
```json
{
  "data": [
    {
      "id": "model-name",
      "object": "model",
      "created": 1234567890,
      "owned_by": "organization"
    }
  ]
}
```

### 8. Still Having Issues?
1. Enable debug logging in the browser console
2. Try the fix script at `/fix-models.js`
3. Check network tab for API request/response details
4. Verify your endpoint is truly OpenAI-compatible