import { Film, Link, Search, Image } from 'lucide-react'
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
  
  const icon: Record<string, React.ReactNode> = {
    search: <Search size={14} />,
    retrieve: <Link size={14} />,
    videoSearch: <Film size={14} />,
    generate_image: <Image size={14} />
  }

  const labels: Record<string, string> = {
    search: 'Search',
    retrieve: 'Retrieve',
    videoSearch: 'Video Search',
    generate_image: 'Image Generation'
  }

  return (
    <Badge className={className} variant={'secondary'}>
      {icon[toolType]}
      <span className="ml-1">{children || labels[toolType]}</span>
    </Badge>
  )
}
