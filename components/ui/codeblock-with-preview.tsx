'use client'

import { FC, memo, useState, useEffect } from 'react'
import { CodeBlock } from './codeblock'
import { Button } from './button'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  language: string
  value: string
}

const isPreviewableLanguage = (language: string): boolean => {
  return ['html', 'css', 'javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx'].includes(language.toLowerCase())
}

const generatePreviewHTML = (code: string, language: string): string => {
  const lowerLang = language.toLowerCase()
  
  if (lowerLang === 'html') {
    return code
  }
  
  if (lowerLang === 'css') {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${code}</style>
        </head>
        <body>
          <div class="preview-container">
            <h1>CSS Preview</h1>
            <p>This is a paragraph</p>
            <button>Button</button>
            <div class="box">Box</div>
          </div>
        </body>
      </html>
    `
  }
  
  if (['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx'].includes(lowerLang)) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script>
            try {
              ${code}
            } catch (error) {
              document.body.innerHTML = '<div style="color: red; font-family: monospace;">Error: ' + error.message + '</div>';
            }
          </script>
        </body>
      </html>
    `
  }
  
  return ''
}

export const CodeBlockWithPreview: FC<Props> = memo(({ language, value }) => {
  const [showPreview, setShowPreview] = useState(false)
  const [previewHTML, setPreviewHTML] = useState('')
  const canPreview = isPreviewableLanguage(language)
  
  useEffect(() => {
    if (canPreview && showPreview) {
      setPreviewHTML(generatePreviewHTML(value, language))
    }
  }, [value, language, showPreview, canPreview])
  
  return (
    <div className="relative w-full">
      <div className="relative">
        <CodeBlock language={language} value={value} />
        {canPreview && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1 right-16 text-xs"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </>
            )}
          </Button>
        )}
      </div>
      
      {showPreview && canPreview && (
        <div className="mt-4 border border-border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-2 text-sm font-medium">
            Preview
          </div>
          <div className="bg-background p-4">
            <iframe
              srcDoc={previewHTML}
              className="w-full h-64 sm:h-96 border-0 rounded bg-white"
              sandbox="allow-scripts"
              title="Code Preview"
            />
          </div>
        </div>
      )}
    </div>
  )
})

CodeBlockWithPreview.displayName = 'CodeBlockWithPreview'