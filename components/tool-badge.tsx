import { cn } from '@/lib/utils'
import {
  CircleHelp,
  FileDown,
  Image,
  Search,
  Video,
  BarChart3
} from 'lucide-react'
import React from 'react'
import { Badge } from './ui/badge'

type ToolBadgeProps = {
  type?: string
  tool?: string
  children?: React.ReactNode
  className?: string
}

export const ToolBadge: React.FC<ToolBadgeProps> = ({
  type,
  tool,
  children,
  className
}) => {
  const toolType = type || tool || ''
  
  const toolIcons: Record<string, React.ReactNode> = {
    search: <Search size={14} aria-label="Search" />,
    retrieve: <FileDown size={14} aria-label="Retrieve" />,
    videoSearch: <Video size={14} aria-label="Video search" />,
    ask_question: <CircleHelp size={14} aria-label="Ask question" />,
    generate_image: <Image size={14} aria-label="Image generation" />,
    generate_chart: <BarChart3 size={14} aria-label="Chart generation" />
  }

  const toolLabels: Record<string, string> = {
    search: 'Search',
    retrieve: 'Retrieve',
    videoSearch: 'Video Search',
    ask_question: 'Ask Question',
    generate_image: 'Image Generation',
    generate_chart: 'Chart Generation'
  }

  return (
    <Badge className={className} variant={'secondary'}>
      {toolIcons[toolType]}
      <span className="ml-1">{children || toolLabels[toolType]}</span>
    </Badge>
  )
}
