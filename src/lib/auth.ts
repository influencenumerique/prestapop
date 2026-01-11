import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
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
        console.log("[AUTH] Attempting login with:", credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing credentials")
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        console.log("[AUTH] User found:", user?.email, "Password in DB:", user?.password)

        if (!user || !user.password) {
          console.log("[AUTH] User not found or no password")
          return null
        }

        // Simple password check for dev/test (use bcrypt in production)
        if (credentials.password !== user.password) {
          console.log("[AUTH] Password mismatch. Input:", credentials.password, "Expected:", user.password)
          return null
        }

        console.log("[AUTH] Login successful for:", user.email)
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
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        // Fetch user role from database
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
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
