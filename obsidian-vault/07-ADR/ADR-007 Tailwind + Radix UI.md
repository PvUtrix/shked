# ADR-007: Tailwind CSS + Radix UI

**Статус**: ✅ Принято  
**Дата**: Январь 2024  
**Авторы**: Павел Шершнёв  
**Связи**: [[Технологический стек]], [[UI компоненты]]

## Контекст и проблема

Для UI системы Шкед нужен CSS фреймворк и библиотека компонентов, которые обеспечат:
- Быстрый прототипирование
- Адаптивный дизайн
- Доступность (a11y)
- Темную и светлую тему
- Современный внешний вид
- Хорошую поддержку TypeScript

## Рассмотренные варианты

### CSS Фреймворки

#### 1. Tailwind CSS ✅
**Описание**: Utility-first CSS framework

**Плюсы**:
- ✅ Быстрая разработка через utility классы
- ✅ Отличная кастомизация через конфиг
- ✅ Tree-shaking (только используемые классы)
- ✅ Адаптивность из коробки (`sm:`, `md:`, `lg:`)
- ✅ Темная тема через `dark:` префикс
- ✅ Большое сообщество
- ✅ Интеграция с Next.js

**Минусы**:
- ⚠️ Много классов в JSX
- ⚠️ Нужно знать утилиты

#### 2. CSS Modules
**Плюсы**:
- ✅ Встроены в Next.js

**Минусы**:
- ❌ Больше boilerplate
- ❌ Нужно писать CSS вручную
- ❌ Медленнее разработка

#### 3. Styled Components
**Плюсы**:
- ✅ CSS-in-JS

**Минусы**:
- ❌ Runtime overhead
- ❌ Плохо работает с RSC
- ❌ Нужна конфигурация для SSR

### UI Библиотеки

#### 1. Radix UI ✅
**Описание**: Headless UI компоненты

**Плюсы**:
- ✅ Headless (полный контроль над стилями)
- ✅ Доступность (a11y) из коробки
- ✅ TypeScript из коробки
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ ARIA attributes
- ✅ Composable API
- ✅ Работает с RSC

**Минусы**:
- ⚠️ Нужно стилизовать самостоятельно

#### 2. Material UI (MUI)
**Плюсы**:
- ✅ Готовые стили

**Минусы**:
- ❌ Тяжелый bundle
- ❌ Сложно кастомизировать
- ❌ Material Design может не подойти

#### 3. Ant Design
**Плюсы**:
- ✅ Много компонентов

**Минусы**:
- ❌ Специфичный дизайн
- ❌ Тяжелый
- ❌ Сложная кастомизация

#### 4. Chakra UI
**Плюсы**:
- ✅ Хорошая DX

**Минусы**:
- ❌ CSS-in-JS (плохо с RSC)
- ❌ Runtime overhead

## Решение

**Выбрана связка: Tailwind CSS + Radix UI + shadcn/ui**

### Обоснование

1. **Tailwind CSS**: Быстрая разработка, маленький bundle, отличная кастомизация

2. **Radix UI**: Headless компоненты с accessibility из коробки

3. **shadcn/ui**: Копируемые компоненты на базе Radix UI + Tailwind

4. **Синергия**: Radix предоставляет логику и a11y, Tailwind — стили

5. **Производительность**: Нет runtime CSS-in-JS

## Конфигурация

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## shadcn/ui компоненты

**Установка**:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
# и т.д.
```

**Папка**: `components/ui/`

### Пример: Button Component

```typescript
// components/ui/button.tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

### Использование

```typescript
import { Button } from '@/components/ui/button'

<Button>Кнопка по умолчанию</Button>
<Button variant="destructive">Удалить</Button>
<Button variant="outline" size="sm">Маленькая</Button>
<Button variant="ghost">Без фона</Button>
```

## Radix UI компоненты

### Установленные компоненты

- `@radix-ui/react-dialog` - модальные окна
- `@radix-ui/react-dropdown-menu` - выпадающие меню
- `@radix-ui/react-select` - селекты
- `@radix-ui/react-tabs` - табы
- `@radix-ui/react-accordion` - аккордеон
- `@radix-ui/react-toast` - уведомления (через sonner)
- `@radix-ui/react-checkbox` - чекбоксы
- `@radix-ui/react-radio-group` - радио кнопки
- `@radix-ui/react-switch` - переключатели
- `@radix-ui/react-slider` - слайдеры
- `@radix-ui/react-label` - labels
- `@radix-ui/react-avatar` - аватары
- И другие...

### Пример: Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

<Dialog>
  <DialogTrigger asChild>
    <Button>Открыть диалог</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Вы уверены?</DialogTitle>
      <DialogDescription>
        Это действие нельзя отменить.
      </DialogDescription>
    </DialogHeader>
    {/* Контент */}
  </DialogContent>
</Dialog>
```

## Темная тема

### Провайдер темы

```typescript
// components/theme-provider.tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### Root Layout

```typescript
// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Toggle темы

```typescript
'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Переключить тему</span>
    </Button>
  )
}
```

## Последствия

### Положительные

- ✅ **Быстрая разработка**: Utility классы + готовые компоненты
- ✅ **Доступность**: Radix обеспечивает a11y из коробки
- ✅ **Кастомизация**: Полный контроль над стилями
- ✅ **Производительность**: Нет runtime, только CSS
- ✅ **Адаптивность**: Responsive дизайн через Tailwind
- ✅ **Темная тема**: Встроенная поддержка
- ✅ **TypeScript**: Типизированные компоненты

### Негативные

- ⚠️ **Много классов**: JSX может быть перегружен классами
- ⚠️ **Learning curve**: Нужно знать Tailwind утилиты
- ⚠️ **Копирование**: shadcn/ui компоненты копируются в проект

### Смягчения

1. **cn helper**: Функция для объединения классов
2. **Варианты**: CVA для управления вариантами
3. **Документация**: Примеры в [[UI компоненты]]

## Влияние на другие компоненты

### Затронутые области
- Все UI компоненты в `components/ui/`
- Все страницы используют Tailwind
- [[Admin компоненты]]
- [[Student компоненты]]
- [[Lector компоненты]]
- [[Mentor компоненты]]

### Связанные решения
- [[ADR-001 Next.js 14 App Router]] - интеграция с Next.js

## Ссылки

### Документация
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [next-themes](https://github.com/pacocoursey/next-themes)

### Внутренние ресурсы
- [[UI компоненты]] - список компонентов
- [[Технологический стек]]

## История обновлений

- **2024-01**: Первоначальное решение
- **2024-02**: Добавлена темная тема
- **2024-10**: Обновлены компоненты shadcn/ui

---

#adr #architecture #ui #tailwind #radix #shadcn #decision

