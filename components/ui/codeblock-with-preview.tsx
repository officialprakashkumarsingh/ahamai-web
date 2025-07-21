'use client'

import { FC, memo, useState, useEffect } from 'react'
import { CodeBlock } from './codeblock'
import { Button } from './button'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  language: string
  value: string
}

const isPreviewableLanguage = (language: string): boolean => {
  return ['html', 'css', 'javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx', 'mermaid'].includes(language.toLowerCase())
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
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              padding: 20px; 
              margin: 0;
              background: white;
            }
            ${code}
          </style>
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
  
  if (lowerLang === 'mermaid') {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              padding: 20px; 
              margin: 0;
              background: white;
            }
            .mermaid {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 200px;
            }
          </style>
        </head>
        <body>
          <div class="mermaid">
            ${code}
          </div>
          <script>
            mermaid.initialize({ 
              startOnLoad: true, 
              theme: 'default',
              securityLevel: 'loose'
            });
          </script>
        </body>
      </html>
    `
  }
  
  if (['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx'].includes(lowerLang)) {
    // Check if this looks like a chart/visualization code
    const isChartCode = code.includes('Chart') || 
                       code.includes('canvas') || 
                       code.includes('d3') || 
                       code.includes('svg') ||
                       code.includes('chart') ||
                       code.includes('graph')
    
    let additionalLibraries = ''
    
    if (isChartCode) {
      additionalLibraries = `
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://d3js.org/d3.v7.min.js"></script>
      `
    }
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              padding: 20px; 
              margin: 0;
              background: white;
            }
            canvas { 
              max-width: 100%; 
              height: auto; 
            }
            svg { 
              max-width: 100%; 
              height: auto; 
            }
          </style>
          ${additionalLibraries}
        </head>
        <body>
          <div id="root"></div>
          <script>
            try {
              // Create a canvas if needed for charts
              if (${isChartCode} && !document.querySelector('canvas')) {
                const canvas = document.createElement('canvas');
                canvas.id = 'chart';
                canvas.width = 400;
                canvas.height = 300;
                document.getElementById('root').appendChild(canvas);
              }
              
              ${code}
            } catch (error) {
              document.body.innerHTML = '<div style="color: red; font-family: monospace; padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">Error: ' + error.message + '</div>';
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
  const [previewError, setPreviewError] = useState(false)
  const canPreview = isPreviewableLanguage(language)
  
  useEffect(() => {
    if (canPreview && showPreview) {
      try {
        setPreviewHTML(generatePreviewHTML(value, language))
        setPreviewError(false)
      } catch (error) {
        setPreviewError(true)
        console.error('Preview generation error:', error)
      }
    }
  }, [value, language, showPreview, canPreview])
  
  return (
    <div className="relative w-full max-w-full">
      <div className="relative">
        <CodeBlock language={language} value={value} />
        {canPreview && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-12 sm:right-16 z-10 h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span className="sr-only">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </Button>
        )}
      </div>
      
      {showPreview && canPreview && (
        <div className="mt-3 sm:mt-4 border border-border rounded-lg overflow-hidden">
          <div className="bg-muted px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between">
            <span>Preview</span>
            {language.toLowerCase() === 'mermaid' && (
              <span className="text-xs text-muted-foreground">Diagram</span>
            )}
          </div>
          <div className="bg-background p-3 sm:p-4">
            {previewError ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="text-sm">Failed to generate preview</span>
              </div>
            ) : (
              <iframe
                srcDoc={previewHTML}
                className={cn(
                  "w-full border-0 rounded bg-white",
                  language.toLowerCase() === 'mermaid' ? "h-64 sm:h-80" : "h-48 sm:h-64 lg:h-96"
                )}
                sandbox="allow-scripts allow-same-origin"
                title={`${language} Code Preview`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
})

CodeBlockWithPreview.displayName = 'CodeBlockWithPreview'