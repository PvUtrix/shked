import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import packageJson from '@/package.json'

export function Footer() {
  const version = packageJson.version

  return (
    <footer className="py-4 border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-600 text-sm">
          © 2025 Шкед. Система управления университетскими расписаниями.
        </p>
        <p className="text-gray-600 text-sm mt-1">
          Сделано с ❤️ в МФТИ
        </p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <Link
            href="https://github.com/PvUtrix/shked"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Открыть репозиторий проекта на GitHub (откроется в новой вкладке)"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 text-sm"
          >
            <ExternalLink className="h-3 w-3 mr-1" aria-hidden="true" />
            Исходный код на GitHub
          </Link>
          <span className="text-gray-400">•</span>
          <Link
            href={`https://github.com/PvUtrix/shked/releases/tag/v${version}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Версия ${version} (откроется в новой вкладке)`}
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200 text-sm"
          >
            v{version}
          </Link>
        </div>
      </div>
    </footer>
  )
}

