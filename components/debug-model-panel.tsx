'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { getCookie } from '@/lib/utils/cookies'
import { getOpenAICompatibleSettings } from '@/lib/utils/settings'

export function DebugModelPanel() {
  const [modelInfo, setModelInfo] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  const refreshModelInfo = () => {
    try {
      const savedModel = getCookie('selectedModel')
      const settings = getOpenAICompatibleSettings()
      
      let parsedModel = null
      if (savedModel) {
        try {
          parsedModel = JSON.parse(savedModel)
        } catch (e) {
          parsedModel = { error: 'Failed to parse model cookie', raw: savedModel }
        }
      }

      setModelInfo({
        selectedModel: parsedModel,
        openaiSettings: settings,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setModelInfo({ error: String(error) })
    }
  }

  useEffect(() => {
    if (isVisible) {
      refreshModelInfo()
    }
  }, [isVisible])

  // Only show in development or when manually enabled
  const shouldShowDebug = process.env.NODE_ENV === 'development' || 
                          (typeof window !== 'undefined' && window.location.search.includes('debug=true'))

  if (!shouldShowDebug) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
        >
          🐛 Debug Models
        </Button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md max-h-96 overflow-auto shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-sm">Model Debug Info</h3>
            <div className="flex gap-1">
              <Button onClick={refreshModelInfo} size="sm" variant="outline">
                🔄
              </Button>
              <Button onClick={() => setIsVisible(false)} size="sm" variant="outline">
                ✕
              </Button>
            </div>
          </div>
          
          <div className="text-xs space-y-2">
            <div>
              <strong>Selected Model:</strong>
              <pre className="bg-gray-50 p-2 rounded mt-1 text-[10px] overflow-auto">
                {JSON.stringify(modelInfo?.selectedModel, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>OpenAI Settings:</strong>
              <pre className="bg-gray-50 p-2 rounded mt-1 text-[10px] overflow-auto">
                {JSON.stringify(modelInfo?.openaiSettings, null, 2)}
              </pre>
            </div>
            
            {modelInfo?.timestamp && (
              <div className="text-gray-500 text-[10px]">
                Last updated: {new Date(modelInfo.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}