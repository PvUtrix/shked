'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAnimationSettings } from '@/lib/stores/animation-store'

export default function TestViewTransitionsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const { isSupported, enabled, type, speed, setEnabled, setType, setSpeed } = useAnimationSettings()

  const testTransition = () => {
    console.error('Testing View Transitions API...')
    console.error('document.startViewTransition:', typeof document.startViewTransition)
    console.error('document.startViewTransition function:', document.startViewTransition)

    if (typeof document !== 'undefined' && document.startViewTransition) {
      console.error('Using View Transitions API')
      document.startViewTransition(() => {
        setCurrentPage(prev => prev === 1 ? 2 : 1)
      })
    } else {
      console.error('View Transitions API not available, using regular state update')
      setCurrentPage(prev => prev === 1 ? 2 : 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Тест View Transitions API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Информация о поддержке</h3>
                <div className="space-y-2">
                  <p><strong>Поддерживается:</strong> {isSupported ? '✅ Да' : '❌ Нет'}</p>
                  <p><strong>Включено:</strong> {enabled ? '✅ Да' : '❌ Нет'}</p>
                  <p><strong>Тип:</strong> {type}</p>
                  <p><strong>Скорость:</strong> {speed}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Настройки</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Включить анимации</span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Тип анимации</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'fade' | 'slide')}
                      className="w-full p-2 border rounded"
                    >
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Скорость</label>
                    <select
                      value={speed}
                      onChange={(e) => setSpeed(e.target.value as 'fast' | 'medium' | 'slow')}
                      className="w-full p-2 border rounded"
                    >
                      <option value="fast">Быстрая (300ms)</option>
                      <option value="medium">Средняя (500ms)</option>
                      <option value="slow">Медленная (750ms)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t">
              <Button onClick={testTransition} className="w-full">
                Тест перехода (Страница {currentPage} → {currentPage === 1 ? 2 : 1})
              </Button>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Отладочная информация:</h4>
              <pre className="text-sm text-gray-600">
                {JSON.stringify({
                  hasStartViewTransition: typeof document !== 'undefined' && typeof document.startViewTransition === 'function',
                  hasCSSSupport: typeof CSS !== 'undefined' && CSS.supports('view-transition-name', 'test'),
                  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                  chromeVersion: typeof navigator !== 'undefined' ? navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] : 'unknown'
                }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Содержимое страницы {currentPage}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {currentPage}
              </div>
              <p className="text-gray-600">
                Это содержимое страницы {currentPage}. 
                {isSupported && enabled ? ' Анимация должна работать!' : ' Анимация не поддерживается или отключена.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
