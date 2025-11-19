'use client'

import { ExternalLink, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ResourceType = 'EOR' | 'ZOOM' | 'CHAT' | 'MIRO' | 'GOOGLE_DOCS' | 'OTHER'

interface ResourceLinkProps {
  type: ResourceType
  title: string
  url: string
  description?: string | null
  className?: string
  variant?: 'button' | 'badge' | 'link'
}

const typeConfig = {
  EOR: {
    label: 'ЭОР',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  ZOOM: {
    label: 'Zoom',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  CHAT: {
    label: 'Чат',
    color: 'bg-green-500 hover:bg-green-600'
  },
  MIRO: {
    label: 'Miro',
    color: 'bg-yellow-500 hover:bg-yellow-600'
  },
  GOOGLE_DOCS: {
    label: 'Google Docs',
    color: 'bg-indigo-500 hover:bg-indigo-600'
  },
  OTHER: {
    label: 'Ссылка',
    color: 'bg-gray-500 hover:bg-gray-600'
  }
}

export function ResourceLink({
  type,
  title,
  url,
  className,
  variant = 'button'
}: ResourceLinkProps) {
  const config = typeConfig[type]

  if (variant === 'badge') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('inline-block', className)}
      >
        <Badge className={cn(config.color, 'text-white cursor-pointer')}>
          <LinkIcon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
      </a>
    )
  }

  if (variant === 'link') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center space-x-2 text-sm text-primary hover:underline',
          className
        )}
      >
        <ExternalLink className="h-4 w-4" />
        <span>{title}</span>
      </a>
    )
  }

  return (
    <Button
      asChild
      variant="outline"
      className={className}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        {title}
      </a>
    </Button>
  )
}

// Компонент для списка ресурсов
interface ResourceListProps {
  resources: Array<{
    id: string
    type: ResourceType
    title: string
    url: string
    description?: string | null
  }>
  variant?: 'button' | 'badge' | 'link'
  className?: string
}

export function ResourceList({
  resources,
  variant = 'button',
  className
}: ResourceListProps) {
  if (resources.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        Ресурсы не добавлены
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {resources.map((resource) => (
        <ResourceLink
          key={resource.id}
          type={resource.type}
          title={resource.title}
          url={resource.url}
          description={resource.description}
          variant={variant}
        />
      ))}
    </div>
  )
}


