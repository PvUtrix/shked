'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface MarkdownViewerProps {
  content: string
  className?: string
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  const { theme } = useTheme()

  return (
    <div className={cn("markdown-viewer", className)}>
      <style jsx global>{`
        .markdown-viewer {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: ${theme === 'dark' ? '#f9fafb' : '#111827'};
        }
        
        .markdown-viewer h1,
        .markdown-viewer h2,
        .markdown-viewer h3,
        .markdown-viewer h4,
        .markdown-viewer h5,
        .markdown-viewer h6 {
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: ${theme === 'dark' ? '#f9fafb' : '#111827'};
        }
        
        .markdown-viewer h1 { font-size: 1.875rem; }
        .markdown-viewer h2 { font-size: 1.5rem; }
        .markdown-viewer h3 { font-size: 1.25rem; }
        .markdown-viewer h4 { font-size: 1.125rem; }
        .markdown-viewer h5 { font-size: 1rem; }
        .markdown-viewer h6 { font-size: 0.875rem; }
        
        .markdown-viewer p {
          margin-bottom: 1em;
        }
        
        .markdown-viewer ul,
        .markdown-viewer ol {
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        
        .markdown-viewer li {
          margin-bottom: 0.25em;
        }
        
        .markdown-viewer blockquote {
          border-left: 4px solid ${theme === 'dark' ? '#6b7280' : '#d1d5db'};
          padding-left: 1em;
          margin: 1em 0;
          color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};
          font-style: italic;
        }
        
        .markdown-viewer code {
          background: ${theme === 'dark' ? '#374151' : '#f3f4f6'};
          padding: 0.125em 0.25em;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875em;
        }
        
        .markdown-viewer pre {
          background: ${theme === 'dark' ? '#1f2937' : '#f9fafb'};
          border: 1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'};
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1em 0;
          overflow-x: auto;
        }
        
        .markdown-viewer pre code {
          background: transparent;
          padding: 0;
          border-radius: 0;
        }
        
        .markdown-viewer table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        
        .markdown-viewer th,
        .markdown-viewer td {
          border: 1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'};
          padding: 0.5em;
          text-align: left;
        }
        
        .markdown-viewer th {
          background: ${theme === 'dark' ? '#374151' : '#f9fafb'};
          font-weight: 600;
        }
        
        .markdown-viewer a {
          color: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
          text-decoration: underline;
        }
        
        .markdown-viewer a:hover {
          color: ${theme === 'dark' ? '#93c5fd' : '#1d4ed8'};
        }
        
        .markdown-viewer img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1em 0;
        }
        
        .markdown-viewer hr {
          border: none;
          border-top: 1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'};
          margin: 2em 0;
        }
        
        .markdown-viewer .task-list-item {
          list-style: none;
          margin-left: -1.5em;
        }
        
        .markdown-viewer .task-list-item input[type="checkbox"] {
          margin-right: 0.5em;
        }
        
        .markdown-viewer .footnote-ref {
          color: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
          text-decoration: none;
          font-weight: 600;
        }
        
        .markdown-viewer .footnote-ref:hover {
          text-decoration: underline;
        }
        
        .markdown-viewer .footnotes {
          border-top: 1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'};
          margin-top: 2em;
          padding-top: 1em;
          font-size: 0.875em;
          color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};
        }
      `}</style>
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Кастомные компоненты для лучшего отображения
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold mb-3 mt-5">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold mb-2 mt-4">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium mb-2 mt-3">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-base font-medium mb-1 mt-2">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium mb-1 mt-2">{children}</h6>
          ),
          p: ({ children }) => (
            <p className="mb-4">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="mb-1">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              )
            }
            return (
              <code className={className}>{children}</code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img 
              src={src} 
              alt={alt}
              className="max-w-full h-auto rounded-lg my-4"
            />
          ),
          hr: () => (
            <hr className="border-gray-300 dark:border-gray-600 my-6" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
