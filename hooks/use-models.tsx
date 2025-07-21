'use client'

import { Model } from '@/lib/types/models'
import { getCustomModels } from '@/lib/utils/custom-models'
import { getOpenAICompatibleSettings } from '@/lib/utils/settings'
import { useEffect, useState } from 'react'

export function useModels(serverModels: Model[] = []) {
  const [models, setModels] = useState<Model[]>(serverModels)
  const [loading, setLoading] = useState(false)

  const loadModels = async () => {
    setLoading(true)
    try {
      console.log('Loading models - server models:', serverModels.length)
      
      // Get custom models from client-side settings
      const customModels = await getCustomModels()
      console.log('Custom models loaded:', customModels)
      
      // Combine server models with custom models
      // Remove any existing openai-compatible models from server models to avoid duplicates
      const filteredServerModels = serverModels.filter(
        model => model.providerId !== 'openai-compatible'
      )
      
      const combinedModels = [...filteredServerModels, ...customModels]
      setModels(combinedModels)
      
      console.log('Final models loaded:', {
        serverModels: filteredServerModels.length,
        customModels: customModels.length,
        total: combinedModels.length,
        customModelsList: customModels.map(m => ({ id: m.id, name: m.name, provider: m.provider }))
      })
    } catch (error) {
      console.error('Failed to load custom models:', error)
      setModels(serverModels)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModels()
  }, []) // Only run on mount

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      loadModels()
    }

    // Listen for storage changes (settings updates)
    window.addEventListener('storage', handleSettingsChange)
    window.addEventListener('settings-updated', handleSettingsChange)

    return () => {
      window.removeEventListener('storage', handleSettingsChange)
      window.removeEventListener('settings-updated', handleSettingsChange)
    }
  }, [serverModels])

  return { models, loading, refetch: loadModels }
}