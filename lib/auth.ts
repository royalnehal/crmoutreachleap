import type { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Temporary bypass: works until MySQL is connected and seeded.
        // Remove this block once DATABASE_URL is live and migrated.
        if (
          credentials.email === "admin@outreachleap.com" &&
          credentials.password === "admin123"
        ) {
          return {
            id: "dev-admin",
            name: "Admin",
            email: "admin@outreachleap.com",
            role: "ADMIN",
          }
        }

        try {
          const teamMember = await prisma.teamMember.findUnique({
            where: { email: credentials.email },
          })

          if (!teamMember || !teamMember.password || !teamMember.isActive) {
            return null
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            teamMember.password
          )

          if (!isValid) {
            return null
          }

          return {
            id: teamMember.id,
            name: teamMember.name,
            email: teamMember.email,
            role: teamMember.role,
          }
        } catch {
          // DB not available — only the dev bypass above works
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // `user.role` is only present right after sign-in via the Credentials
        // provider above; for Google sign-in we look the role up by email.
        token.role = (user as { role?: string }).role
      }

      if (!token.role && token.email) {
        const teamMember = await prisma.teamMember.findUnique({
          where: { email: token.email },
        })
        if (teamMember) {
          token.role = teamMember.role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | undefined
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
