import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

const adapter = PrismaAdapter(db)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          return null
        }

        // Vérification sécurisée du mot de passe avec bcrypt
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
        session.user.role = token.role as "USER" | "COMPANY" | "DRIVER" | "ADMIN" | undefined
      }
      return session
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id
      }

      // Always fetch current role from database (handles role changes after onboarding)
      if (token.sub) {
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          include: { company: true, driverProfile: true },
        })
        if (dbUser?.role === "ADMIN") {
          token.role = "ADMIN"
        } else if (dbUser?.company) {
          token.role = "COMPANY"
        } else if (dbUser?.driverProfile) {
          token.role = "DRIVER"
        } else {
          token.role = dbUser?.role || "USER"
        }
      }
      return token
    },
  },
})
