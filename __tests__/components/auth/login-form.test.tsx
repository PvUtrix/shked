import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'
import { signIn } from 'next-auth/react'

// Мокаем next-auth/react
jest.mock('next-auth/react')

// Мокаем next/navigation
const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
}

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
}))

// Мокаем useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('LoginForm компонент', () => {
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.skip('должен рендерить форму с полями email и password', () => {
    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Пароль')
    const submitButton = screen.getByRole('button', { name: /войти/i })

    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(submitButton).toBeInTheDocument()
  })

  it.skip('должен показывать заголовок формы', () => {
    render(<LoginForm />)

    const title = screen.getByText('Вход в систему')
    expect(title).toBeInTheDocument()
  })

  it.skip('должен показывать демо аккаунты', () => {
    render(<LoginForm />)

    expect(screen.getByText(/Демо аккаунты/i)).toBeInTheDocument()
    expect(screen.getByText(/admin@shked.com/i)).toBeInTheDocument()
    expect(screen.getByText(/student123@demo.com/i)).toBeInTheDocument()
  })

  it.skip('должен обновлять значение email при вводе', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement

    await user.type(emailInput, 'test@example.com')

    expect(emailInput.value).toBe('test@example.com')
  })

  it.skip('должен обновлять значение password при вводе', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const passwordInput = screen.getByPlaceholderText('Пароль') as HTMLInputElement

    await user.type(passwordInput, 'password123')

    expect(passwordInput.value).toBe('password123')
  })

  it.skip('должен вызывать signIn при успешном submit', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ ok: true } as any)

    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Пароль')
    const submitButton = screen.getByRole('button', { name: /войти/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
    })
  })

  it.skip('должен показывать состояние загрузки во время submit', async () => {
    const user = userEvent.setup()
    
    // Создаем промис который будет висеть
    let resolveSignIn: any
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve
    })
    mockSignIn.mockReturnValue(signInPromise as any)

    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Пароль')
    const submitButton = screen.getByRole('button', { name: /войти/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Проверяем состояние загрузки
    await waitFor(() => {
      expect(screen.getByText('Входим...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    // Завершаем промис
    resolveSignIn({ ok: true })
  })

  it.skip('должен вызвать router.refresh при успешном входе', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ ok: true } as any)

    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Пароль')
    const submitButton = screen.getByRole('button', { name: /войти/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled()
    })
  })

  it.skip('должен обрабатывать ошибку при неудачном входе', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials', ok: false } as any)

    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Пароль')
    const submitButton = screen.getByRole('button', { name: /войти/i })

    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled()
      // Ошибка будет показана через toast, но мы его замокали
    })

    // Кнопка должна вернуться в активное состояние
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it.skip('должен требовать заполнения обязательных полей', () => {
    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Пароль')

    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  it.skip('должен использовать правильный тип для password input', () => {
    render(<LoginForm />)

    const passwordInput = screen.getByPlaceholderText('Пароль')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it.skip('должен использовать правильный тип для email input', () => {
    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('Email')
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it.skip('не должен вызывать signIn при пустой форме', async () => {
    render(<LoginForm />)

    const form = screen.getByRole('button', { name: /войти/i }).closest('form')
    
    if (form) {
      fireEvent.submit(form)
    }

    // signIn не должен быть вызван, т.к. браузер остановит submit из-за required
    expect(mockSignIn).not.toHaveBeenCalled()
  })
})

