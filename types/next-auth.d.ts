
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: 'admin' | 'student' | 'lector' | 'mentor'
    groupId?: string
    firstName?: string
    lastName?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'admin' | 'student' | 'lector' | 'mentor'
      groupId?: string | undefined
    }
  }

  interface JWT {
    role: 'admin' | 'student' | 'lector' | 'mentor'
    groupId?: string
  }
}
