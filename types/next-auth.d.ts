
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: 'admin' | 'student' | 'lector' | 'mentor' | 'assistant' | 'co_lecturer' | 'education_office_head' | 'department_admin'
    groupId?: string
    firstName?: string
    lastName?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'admin' | 'student' | 'lector' | 'mentor' | 'assistant' | 'co_lecturer' | 'education_office_head' | 'department_admin'
      groupId?: string | undefined
    }
  }

  interface JWT {
    role: 'admin' | 'student' | 'lector' | 'mentor' | 'assistant' | 'co_lecturer' | 'education_office_head' | 'department_admin'
    groupId?: string
  }
}
