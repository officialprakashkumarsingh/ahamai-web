'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  clearOpenAICompatibleSettings,
  getOpenAICompatibleSettings,
  OpenAICompatibleSettings,
  saveOpenAICompatibleSettings
} from '@/lib/utils/settings'
import { Settings, Eye, EyeOff, TestTube, CheckCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SettingsDialogProps {
  trigger?: React.ReactNode
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<OpenAICompatibleSettings>({
    apiKey: '',
    baseURL: '',
    model: '',
    enabled: false
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (open) {
      const storedSettings = getOpenAICompatibleSettings()
      setSettings(storedSettings)
    }
  }, [open])

  const handleSave = () => {
    if (settings.enabled && (!settings.apiKey || !settings.baseURL)) {
      toast.error('API Key and Base URL are required when enabled')
      return
    }

    saveOpenAICompatibleSettings(settings)
    toast.success('Settings saved successfully')
    setOpen(false)
    
    // Dispatch custom event to notify components of settings change
    window.dispatchEvent(new CustomEvent('settings-updated'))
    
    // Refresh the page to apply new settings
    window.location.reload()
  }

  const handleClear = () => {
    clearOpenAICompatibleSettings()
    setSettings({
      apiKey: '',
      baseURL: '',
      model: '',
      enabled: false
    })
    toast.success('Settings cleared')
  }

  const handleTest = async () => {
    if (!settings.apiKey || !settings.baseURL) {
      setTestResult({ success: false, message: 'API Key and Base URL are required' })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(`${settings.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const modelCount = data.data?.length || 0
        setTestResult({ 
          success: true, 
          message: `Connection successful! Found ${modelCount} models.` 
        })
      } else {
        setTestResult({ 
          success: false, 
          message: `Connection failed: ${response.status} ${response.statusText}` 
        })
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your OpenAI-compatible endpoint to use your own AI models.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable Custom OpenAI Endpoint</Label>
              <p className="text-sm text-muted-foreground">
                Use your own OpenAI-compatible API endpoint
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) =>
                setSettings(prev => ({ ...prev, enabled }))
              }
            />
          </div>

          {settings.enabled && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="baseURL">Base URL *</Label>
                <Input
                  id="baseURL"
                  placeholder="https://api.openai.com/v1"
                  value={settings.baseURL}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, baseURL: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  The base URL for your OpenAI-compatible API (without /chat/completions)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={settings.apiKey}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, apiKey: e.target.value }))
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Default Model (Optional)</Label>
                <Input
                  id="model"
                  placeholder="gpt-4o-mini"
                  value={settings.model}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, model: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the first available model from your endpoint
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing || !settings.apiKey || !settings.baseURL}
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              {testResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  testResult.success 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {testResult.message}
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Compatible Services</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• OpenAI API</p>
                  <p>• Ollama (with openai-compatible plugin)</p>
                  <p>• LocalAI</p>
                  <p>• FastChat</p>
                  <p>• vLLM</p>
                  <p>• Text Generation WebUI (with openai extension)</p>
                  <p>• Any service implementing OpenAI&apos;s API format</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}