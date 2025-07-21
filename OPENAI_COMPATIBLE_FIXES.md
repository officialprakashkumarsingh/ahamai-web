# OpenAI Compatible Model Streaming Fixes

This document outlines the fixes implemented to resolve OpenAI compatible model streaming issues and ensure robust operation.

## Issues Identified and Fixed

### 1. **Missing Streaming Configuration**
- **Problem**: OpenAI compatible provider in registry didn't have proper streaming configuration
- **Fix**: Added `compatibility: 'strict'` and explicit `fetch` configuration to ensure proper OpenAI compatibility
- **Files Modified**: `lib/utils/registry.ts`

### 2. **Inadequate Error Handling**
- **Problem**: Generic error messages didn't help identify OpenAI compatible endpoint issues
- **Fix**: Added specific error handling for OpenAI compatible models with detailed error messages for common issues (401, 404, fetch errors)
- **Files Modified**: `lib/streaming/create-tool-calling-stream.ts`, `lib/streaming/create-manual-tool-stream.ts`

### 3. **No Automatic Model Switching (As Requested)**
- **Problem**: System was automatically switching to fallback models when OpenAI compatible failed
- **Fix**: Removed automatic model switching and now provides clear error messages about the specific provider issue
- **Files Modified**: `app/api/chat/route.ts`

### 4. **Insufficient Connection Testing**
- **Problem**: Basic connection test didn't verify streaming functionality
- **Fix**: Added comprehensive health check that tests models endpoint, chat completions, and streaming specifically
- **Files Added**: `lib/utils/openai-compatible-health.ts`, `lib/utils/streaming-test.ts`

### 5. **Lack of Debugging Information**
- **Problem**: No visibility into what was happening during streaming failures
- **Fix**: Added comprehensive debugging system for OpenAI compatible models
- **Files Added**: `lib/utils/openai-compatible-debug.ts`

## New Features Added

### 1. **Enhanced Model Provider Configuration**
```typescript
// Better OpenAI compatibility settings
'openai-compatible': createOpenAI({
  apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
  baseURL: process.env.OPENAI_COMPATIBLE_API_BASE_URL,
  compatibility: 'strict', // Ensure OpenAI compatibility
  fetch: fetch, // Explicitly set fetch for better compatibility
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### 2. **Comprehensive Health Checks**
- Tests `/models` endpoint connectivity
- Tests `/chat/completions` endpoint (non-streaming)
- Tests `/chat/completions` endpoint (streaming)
- Provides detailed error messages and recommendations

### 3. **Streaming-Specific Error Messages**
- "Failed to connect to OpenAI compatible endpoint. Please check your API URL and network connection."
- "Invalid API key for OpenAI compatible endpoint. Please check your credentials."
- "OpenAI compatible endpoint not found. Please verify your base URL."

### 4. **Debug Logging System**
- Logs streaming requests, responses, and errors
- Tracks OpenAI compatible model usage
- Helps identify where streaming fails

### 5. **Improved Settings Dialog**
- Enhanced connection testing with better feedback
- Shows model count when connection is successful
- Uses improved test functions for more accurate results

## How to Use

### 1. **Configure OpenAI Compatible Endpoint**
1. Open Settings dialog
2. Enable "Custom OpenAI Endpoint"
3. Enter your API key and base URL (without `/chat/completions`)
4. Enter a model name (optional - will auto-detect)
5. Click "Test Connection" to verify setup

### 2. **Test Streaming Functionality**
The system now automatically tests:
- Basic connectivity to your endpoint
- Model listing functionality
- Chat completions (both streaming and non-streaming)

### 3. **Debug Issues**
If streaming fails, check:
1. Browser console for detailed error messages
2. Network tab to see actual API requests
3. Ensure your endpoint supports:
   - `/models` endpoint returning `{ data: [...] }`
   - `/chat/completions` endpoint with `stream: true` parameter
   - Proper SSE format for streaming responses

## Common Issues and Solutions

### Issue: "Connection failed: 404"
**Solution**: Verify your base URL is correct and doesn't include `/chat/completions` at the end.

### Issue: "Invalid streaming format"
**Solution**: Ensure your endpoint returns streaming data in OpenAI-compatible SSE format with `data:` prefixes.

### Issue: "No streaming data received"
**Solution**: Check that your endpoint actually supports the `stream: true` parameter and returns streaming responses.

### Issue: "Provider not configured"
**Solution**: Ensure you've enabled the custom endpoint and provided both API key and base URL.

## Files Modified

1. `lib/utils/registry.ts` - Enhanced OpenAI compatible provider configuration
2. `lib/streaming/create-tool-calling-stream.ts` - Added debugging and better error handling
3. `lib/streaming/create-manual-tool-stream.ts` - Added debugging and better error handling
4. `app/api/chat/route.ts` - Removed automatic model switching, improved error messages
5. `lib/utils/custom-models.ts` - Enhanced error handling and connection testing
6. `components/settings-dialog.tsx` - Improved test connection functionality

## Files Added

1. `lib/utils/openai-compatible-debug.ts` - Debugging system for streaming
2. `lib/utils/openai-compatible-health.ts` - Comprehensive health checks
3. `lib/utils/streaming-test.ts` - Streaming-specific test functionality

## Testing

To test the fixes:

1. Configure an OpenAI compatible endpoint (e.g., Ollama with OpenAI plugin, LocalAI, etc.)
2. Use the "Test Connection" button in settings
3. Try chatting with the model
4. Check browser console for any debug messages
5. Verify streaming works by seeing incremental responses

The system now provides much better visibility into what's happening during streaming and gives specific guidance on how to fix issues.