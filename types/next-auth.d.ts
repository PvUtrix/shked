
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: string
    groupId?: string
    firstName?: string
    lastName?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      groupId?: string | undefined
    }
  }

  interface JWT {
    role: string
    groupId?: string
  }
}
