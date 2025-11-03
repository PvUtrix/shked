'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MDXEditor, type MDXEditorMethods } from '@mdxeditor/editor'
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
  Separator
} from '@mdxeditor/editor'
import type { MarkdownEditorProps } from './markdown-editor'

export default function MarkdownEditorClient({ 
  value, 
  onChange, 
  placeholder,
  readOnly = false,
  className = "",
  height = "400px"
}: MarkdownEditorProps) {
  const t = useTranslations()
  const defaultPlaceholder = placeholder || t('ui.markdownEditor.placeholder')
  const [editorRef, setEditorRef] = useState<MDXEditorMethods | null>(null)

  return (
    <div className={`markdown-editor border rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <MDXEditor
        ref={setEditorRef}
        markdown={value}
        onChange={onChange}
        placeholder={defaultPlaceholder}
        readOnly={readOnly}
        contentEditableClassName="prose prose-sm max-w-none p-4"
        plugins={[
          // Основные плагины
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          
          // Ссылки и изображения
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin({
            imageUploadHandler: async () => {
              return Promise.resolve('https://via.placeholder.com/150')
            }
          }),
          
          // Таблицы и код
          tablePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'javascript' }),
          codeMirrorPlugin({ 
            codeBlockLanguages: { 
              js: 'JavaScript', 
              ts: 'TypeScript', 
              css: 'CSS', 
              html: 'HTML', 
              json: 'JSON', 
              md: 'Markdown',
              python: 'Python',
              sql: 'SQL'
            } 
          }),
          
          // Панель инструментов
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertImage />
                <Separator />
                <InsertTable />
                <InsertThematicBreak />
              </>
            )
          })
        ]}
      />
    </div>
  )
}

