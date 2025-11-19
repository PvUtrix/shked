
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './db'
import bcryptjs from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { group: true }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcryptjs.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          role: user.role as 'admin' | 'student' | 'lector' | 'mentor' | 'assistant' | 'co_lecturer' | 'education_office_head' | 'department_admin',
          groupId: user.groupId || undefined,
          mustChangePassword: user.mustChangePassword || false
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.groupId = user.groupId
        token.mustChangePassword = (user as any).mustChangePassword || false
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as 'admin' | 'student' | 'lector' | 'mentor' | 'assistant' | 'co_lecturer' | 'education_office_head' | 'department_admin'
        session.user.groupId = token.groupId as string | undefined
        session.user.mustChangePassword = (token.mustChangePassword as boolean) || false
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
}
