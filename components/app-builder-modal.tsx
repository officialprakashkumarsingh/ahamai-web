'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Download, Play, Wand2, Code2, Smartphone, Layout, Type, Square, Circle, Image, RectangleHorizontal, Hammer } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AppBuilderModalProps {
  isOpen: boolean
  onClose: () => void
}

interface DragItem {
  id: string
  type: 'text' | 'button' | 'image' | 'container' | 'input'
  content: string
  style: Record<string, any>
  children?: DragItem[]
}

const componentTypes = [
  { type: 'text', icon: Type, label: 'Text' },
  { type: 'button', icon: RectangleHorizontal, label: 'Button' },
  { type: 'image', icon: Image, label: 'Image' },
  { type: 'container', icon: Square, label: 'Container' },
  { type: 'input', icon: Layout, label: 'Input' }
]

export function AppBuilderModal({ isOpen, onClose }: AppBuilderModalProps) {
  const [components, setComponents] = useState<DragItem[]>([])
  const [selectedComponent, setSelectedComponent] = useState<DragItem | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewMode, setPreviewMode] = useState<'design' | 'preview'>('design')
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('componentType', type)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('componentType')
    
    const newComponent: DragItem = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      content: type === 'text' ? 'New Text' : type === 'button' ? 'Click Me' : '',
      style: {
        padding: '10px',
        margin: '5px',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }
    }
    
    setComponents([...components, newComponent])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return
    
    setIsGenerating(true)
    try {
      // Here we would call an AI endpoint to generate the app structure
      // For now, we'll create a simple example
      const mockComponents: DragItem[] = [
        {
          id: 'container-1',
          type: 'container',
          content: '',
          style: { padding: '20px', backgroundColor: '#f5f5f5' },
          children: [
            {
              id: 'text-1',
              type: 'text',
              content: 'Welcome to Your App',
              style: { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }
            },
            {
              id: 'button-1',
              type: 'button',
              content: 'Get Started',
              style: { backgroundColor: '#007bff', color: 'white', padding: '10px 20px' }
            }
          ]
        }
      ]
      
      setComponents(mockComponents)
      toast.success('App generated successfully!')
    } catch (error) {
      toast.error('Failed to generate app')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportToReactNative = () => {
    const code = generateReactNativeCode(components)
    const blob = new Blob([code], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'App.js'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('React Native code exported!')
  }

  const generateReactNativeCode = (items: DragItem[]): string => {
    let imports = `import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, StyleSheet } from 'react-native';

`
    
    let componentCode = `const App = () => {
  return (
    <View style={styles.container}>
`
    
    const generateComponentCode = (item: DragItem, indent: string = '      '): string => {
      switch (item.type) {
        case 'text':
          return `${indent}<Text style={styles.${item.id.replace('-', '_')}}>${item.content}</Text>\n`
        case 'button':
          return `${indent}<TouchableOpacity style={styles.${item.id.replace('-', '_')}} onPress={() => console.log('Button pressed')}>
${indent}  <Text style={styles.${item.id.replace('-', '_')}_text}>${item.content}</Text>
${indent}</TouchableOpacity>\n`
        case 'container':
          let containerCode = `${indent}<View style={styles.${item.id.replace('-', '_')}}>\n`
          if (item.children) {
            item.children.forEach(child => {
              containerCode += generateComponentCode(child, indent + '  ')
            })
          }
          containerCode += `${indent}</View>\n`
          return containerCode
        case 'input':
          return `${indent}<TextInput style={styles.${item.id.replace('-', '_')}} placeholder="Enter text" />\n`
        case 'image':
          return `${indent}<Image source={{uri: 'https://via.placeholder.com/150'}} style={styles.${item.id.replace('-', '_')}} />\n`
        default:
          return ''
      }
    }
    
    components.forEach(component => {
      componentCode += generateComponentCode(component)
    })
    
    componentCode += `    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
`
    
    // Generate styles
    const generateStyles = (item: DragItem): string => {
      let styleString = `  ${item.id.replace('-', '_')}: ${JSON.stringify(item.style)},\n`
      if (item.type === 'button') {
        styleString += `  ${item.id.replace('-', '_')}_text: { color: 'white' },\n`
      }
      if (item.children) {
        item.children.forEach(child => {
          styleString += generateStyles(child)
        })
      }
      return styleString
    }
    
    components.forEach(component => {
      componentCode += generateStyles(component)
    })
    
    componentCode += `});

export default App;`
    
    return imports + componentCode
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Hammer className="h-5 w-5" />
              App Builder
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(previewMode === 'design' ? 'preview' : 'design')}
              >
                {previewMode === 'design' ? <Play className="h-4 w-4 mr-1" /> : <Code2 className="h-4 w-4 mr-1" />}
                {previewMode === 'design' ? 'Preview' : 'Design'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToReactNative}
                disabled={components.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4">Components</h3>
            <div className="space-y-2 mb-6">
              {componentTypes.map(({ type, icon: Icon, label }) => (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, type)}
                  className="flex items-center gap-2 p-3 border rounded-lg cursor-move hover:bg-muted"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            
            <h3 className="font-semibold mb-4">AI Assistant</h3>
            <div className="space-y-2">
              <Textarea
                placeholder="Describe your app..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <Button
                onClick={generateWithAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>
          </div>
          
          {/* Canvas */}
          <div className="flex-1 p-4 overflow-auto bg-gray-50">
            <div
              ref={canvasRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={cn(
                "min-h-[600px] bg-white rounded-lg shadow-sm border-2 border-dashed",
                components.length === 0 ? "border-gray-300" : "border-transparent",
                "relative"
              )}
            >
              {components.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Smartphone className="h-12 w-12 mx-auto mb-2" />
                    <p>Drag components here or use AI to generate</p>
                  </div>
                </div>
              )}
              
              {previewMode === 'design' ? (
                <div className="p-4">
                  {components.map(component => (
                    <RenderComponent
                      key={component.id}
                      component={component}
                      onSelect={setSelectedComponent}
                      selected={selectedComponent?.id === component.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4">
                  <PreviewComponent components={components} />
                </div>
              )}
            </div>
          </div>
          
          {/* Properties Panel */}
          {selectedComponent && (
            <div className="w-64 border-l p-4">
              <h3 className="font-semibold mb-4">Properties</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={selectedComponent.content}
                    onChange={(e) => {
                      const updated = { ...selectedComponent, content: e.target.value }
                      setComponents(components.map(c => c.id === updated.id ? updated : c))
                      setSelectedComponent(updated)
                    }}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RenderComponent({ component, onSelect, selected }: any) {
  const componentStyle = {
    ...component.style,
    cursor: 'pointer',
    outline: selected ? '2px solid #007bff' : 'none'
  }
  
  switch (component.type) {
    case 'text':
      return <div style={componentStyle} onClick={() => onSelect(component)}>{component.content}</div>
    case 'button':
      return <button style={componentStyle} onClick={() => onSelect(component)}>{component.content}</button>
    case 'container':
      return (
        <div style={componentStyle} onClick={() => onSelect(component)}>
          {component.children?.map((child: any) => (
            <RenderComponent key={child.id} component={child} onSelect={onSelect} selected={selected} />
          ))}
        </div>
      )
    case 'input':
      return <input style={componentStyle} placeholder="Input field" onClick={() => onSelect(component)} />
    case 'image':
      return <div style={componentStyle} onClick={() => onSelect(component)}>📷 Image Placeholder</div>
    default:
      return null
  }
}

function PreviewComponent({ components }: { components: DragItem[] }) {
  return (
    <div className="space-y-2">
      {components.map(component => {
        switch (component.type) {
          case 'text':
            return <div key={component.id} style={component.style}>{component.content}</div>
          case 'button':
            return <button key={component.id} style={component.style}>{component.content}</button>
          case 'container':
            return (
              <div key={component.id} style={component.style}>
                {component.children && <PreviewComponent components={component.children} />}
              </div>
            )
          case 'input':
            return <input key={component.id} style={component.style} placeholder="Input field" />
          case 'image':
            return <div key={component.id} style={component.style}>📷 Image</div>
          default:
            return null
        }
      })}
    </div>
  )
}