'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MDXEditor, type MDXEditorMethods, type MDXEditorProps } from '@mdxeditor/editor'
import { 
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  CodeToggle,
  Separator,
  KitchenSinkToolbar
} from '@mdxeditor/editor'
import { CodeMirrorEditor } from '@mdxeditor/editor'
import { useTheme } from 'next-themes'

// Динамический импорт для избежания SSR проблем
const MDXEditorDynamic = dynamic(() => import('@mdxeditor/editor').then(mod => ({ default: mod.MDXEditor })), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">Загрузка редактора...</div>
})

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
  height?: string
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "Начните писать...",
  readOnly = false,
  className = "",
  height = "400px"
}: MarkdownEditorProps) {
  const [editorRef, setEditorRef] = useState<MDXEditorMethods | null>(null)
  const { theme } = useTheme()

  const handleChange = (newValue: string) => {
    onChange(newValue)
  }

  const plugins: MDXEditorProps['plugins'] = [
    // Основные плагины для работы с Markdown
    headingsPlugin(),
    listsPlugin(),
    quotePlugin(),
    thematicBreakPlugin(),
    markdownShortcutPlugin(),
    
    // Плагины для ссылок и изображений
    linkPlugin(),
    linkDialogPlugin(),
    imagePlugin(),
    
    // Плагины для таблиц и кода
    tablePlugin(),
    codeBlockPlugin({ defaultCodeBlockLanguage: 'javascript' }),
    codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', ts: 'TypeScript', css: 'CSS', html: 'HTML', json: 'JSON', md: 'Markdown' } }),
    
    // Плагины для frontmatter
    frontmatterPlugin(),
    
    // Плагин для сравнения с исходным Markdown
    diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: value }),
    
    // Панель инструментов
    toolbarPlugin({
      toolbarContents: () => (
        <KitchenSinkToolbar />
      )
    })
  ]

  // Автосохранение каждые 30 секунд
  useEffect(() => {
    if (!readOnly && value) {
      const interval = setInterval(() => {
        // Автосохранение можно реализовать здесь
        console.log('Автосохранение черновика...')
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [value, readOnly])

  return (
    <div className={`markdown-editor ${className}`} style={{ height }}>
      <style jsx global>{`
        .mdxeditor {
          --mdxeditor-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --mdxeditor-font-size: 14px;
          --mdxeditor-line-height: 1.6;
          --mdxeditor-border-radius: 8px;
          --mdxeditor-border: 1px solid #e5e7eb;
          --mdxeditor-background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
          --mdxeditor-color: ${theme === 'dark' ? '#f9fafb' : '#111827'};
          --mdxeditor-selection-background: ${theme === 'dark' ? '#3b82f6' : '#3b82f6'};
          --mdxeditor-selection-color: white;
          --mdxeditor-toolbar-background: ${theme === 'dark' ? '#374151' : '#f9fafb'};
          --mdxeditor-toolbar-border: 1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'};
          --mdxeditor-toolbar-button-background: transparent;
          --mdxeditor-toolbar-button-background-hover: ${theme === 'dark' ? '#4b5563' : '#f3f4f6'};
          --mdxeditor-toolbar-button-color: ${theme === 'dark' ? '#d1d5db' : '#6b7280'};
          --mdxeditor-toolbar-button-color-hover: ${theme === 'dark' ? '#f9fafb' : '#374151'};
          --mdxeditor-toolbar-button-border-radius: 4px;
          --mdxeditor-toolbar-button-padding: 6px 8px;
          --mdxeditor-toolbar-button-margin: 2px;
          --mdxeditor-toolbar-button-font-size: 12px;
          --mdxeditor-toolbar-button-font-weight: 500;
          --mdxeditor-toolbar-button-text-transform: none;
          --mdxeditor-toolbar-button-letter-spacing: 0;
          --mdxeditor-toolbar-button-line-height: 1;
          --mdxeditor-toolbar-button-min-width: 32px;
          --mdxeditor-toolbar-button-min-height: 32px;
          --mdxeditor-toolbar-button-display: inline-flex;
          --mdxeditor-toolbar-button-align-items: center;
          --mdxeditor-toolbar-button-justify-content: center;
          --mdxeditor-toolbar-button-cursor: pointer;
          --mdxeditor-toolbar-button-transition: all 0.15s ease;
          --mdxeditor-toolbar-button-user-select: none;
          --mdxeditor-toolbar-button-outline: none;
          --mdxeditor-toolbar-button-border: none;
          --mdxeditor-toolbar-button-box-shadow: none;
          --mdxeditor-toolbar-button-text-decoration: none;
          --mdxeditor-toolbar-button-text-align: center;
          --mdxeditor-toolbar-button-vertical-align: middle;
          --mdxeditor-toolbar-button-white-space: nowrap;
          --mdxeditor-toolbar-button-overflow: hidden;
          --mdxeditor-toolbar-button-text-overflow: ellipsis;
          --mdxeditor-toolbar-button-word-wrap: break-word;
          --mdxeditor-toolbar-button-word-break: break-word;
          --mdxeditor-toolbar-button-hyphens: auto;
          --mdxeditor-toolbar-button-tab-size: 4;
          --mdxeditor-toolbar-button-webkit-font-smoothing: antialiased;
          --mdxeditor-toolbar-button-moz-osx-font-smoothing: grayscale;
          --mdxeditor-toolbar-button-font-feature-settings: 'kern' 1;
          --mdxeditor-toolbar-button-font-variant-ligatures: common-ligatures;
          --mdxeditor-toolbar-button-font-kerning: normal;
          --mdxeditor-toolbar-button-font-stretch: normal;
          --mdxeditor-toolbar-button-font-style: normal;
          --mdxeditor-toolbar-button-font-variant: normal;
          --mdxeditor-toolbar-button-font-weight: 500;
          --mdxeditor-toolbar-button-font-size: 12px;
          --mdxeditor-toolbar-button-line-height: 1;
          --mdxeditor-toolbar-button-letter-spacing: 0;
          --mdxeditor-toolbar-button-text-transform: none;
          --mdxeditor-toolbar-button-text-decoration: none;
          --mdxeditor-toolbar-button-text-align: center;
          --mdxeditor-toolbar-button-vertical-align: middle;
          --mdxeditor-toolbar-button-white-space: nowrap;
          --mdxeditor-toolbar-button-overflow: hidden;
          --mdxeditor-toolbar-button-text-overflow: ellipsis;
          --mdxeditor-toolbar-button-word-wrap: break-word;
          --mdxeditor-toolbar-button-word-break: break-word;
          --mdxeditor-toolbar-button-hyphens: auto;
          --mdxeditor-toolbar-button-tab-size: 4;
          --mdxeditor-toolbar-button-webkit-font-smoothing: antialiased;
          --mdxeditor-toolbar-button-moz-osx-font-smoothing: grayscale;
          --mdxeditor-toolbar-button-font-feature-settings: 'kern' 1;
          --mdxeditor-toolbar-button-font-variant-ligatures: common-ligatures;
          --mdxeditor-toolbar-button-font-kerning: normal;
          --mdxeditor-toolbar-button-font-stretch: normal;
          --mdxeditor-toolbar-button-font-style: normal;
          --mdxeditor-toolbar-button-font-variant: normal;
        }
        
        .mdxeditor .mdxeditor-toolbar {
          border-bottom: 1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'};
          padding: 8px 12px;
          background: ${theme === 'dark' ? '#374151' : '#f9fafb'};
        }
        
        .mdxeditor .mdxeditor-content {
          padding: 16px;
          min-height: 200px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: ${theme === 'dark' ? '#f9fafb' : '#111827'};
        }
        
        .mdxeditor .mdxeditor-content h1,
        .mdxeditor .mdxeditor-content h2,
        .mdxeditor .mdxeditor-content h3,
        .mdxeditor .mdxeditor-content h4,
        .mdxeditor .mdxeditor-content h5,
        .mdxeditor .mdxeditor-content h6 {
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: ${theme === 'dark' ? '#f9fafb' : '#111827'};
        }
        
        .mdxeditor .mdxeditor-content h1 { font-size: 1.875rem; }
        .mdxeditor .mdxeditor-content h2 { font-size: 1.5rem; }
        .mdxeditor .mdxeditor-content h3 { font-size: 1.25rem; }
        .mdxeditor .mdxeditor-content h4 { font-size: 1.125rem; }
        .mdxeditor .mdxeditor-content h5 { font-size: 1rem; }
        .mdxeditor .mdxeditor-content h6 { font-size: 0.875rem; }
        
        .mdxeditor .mdxeditor-content p {
          margin-bottom: 1em;
        }
        
        .mdxeditor .mdxeditor-content ul,
        .mdxeditor .mdxeditor-content ol {
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        
        .mdxeditor .mdxeditor-content li {
          margin-bottom: 0.25em;
        }
        
        .mdxeditor .mdxeditor-content blockquote {
          border-left: 4px solid ${theme === 'dark' ? '#6b7280' : '#d1d5db'};
          padding-left: 1em;
          margin: 1em 0;
          color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};
          font-style: italic;
        }
        
        .mdxeditor .mdxeditor-content code {
          background: ${theme === 'dark' ? '#374151' : '#f3f4f6'};
          padding: 0.125em 0.25em;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875em;
        }
        
        .mdxeditor .mdxeditor-content pre {
          background: ${theme === 'dark' ? '#1f2937' : '#f9fafb'};
          border: 1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'};
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1em 0;
          overflow-x: auto;
        }
        
        .mdxeditor .mdxeditor-content pre code {
          background: transparent;
          padding: 0;
          border-radius: 0;
        }
        
        .mdxeditor .mdxeditor-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        
        .mdxeditor .mdxeditor-content th,
        .mdxeditor .mdxeditor-content td {
          border: 1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'};
          padding: 0.5em;
          text-align: left;
        }
        
        .mdxeditor .mdxeditor-content th {
          background: ${theme === 'dark' ? '#374151' : '#f9fafb'};
          font-weight: 600;
        }
        
        .mdxeditor .mdxeditor-content a {
          color: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
          text-decoration: underline;
        }
        
        .mdxeditor .mdxeditor-content a:hover {
          color: ${theme === 'dark' ? '#93c5fd' : '#1d4ed8'};
        }
        
        .mdxeditor .mdxeditor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1em 0;
        }
        
        .mdxeditor .mdxeditor-content hr {
          border: none;
          border-top: 1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'};
          margin: 2em 0;
        }
      `}</style>
      
      <MDXEditorDynamic
        ref={setEditorRef}
        markdown={value}
        onChange={handleChange}
        plugins={plugins}
        contentEditableClassName="prose prose-sm max-w-none"
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  )
}
