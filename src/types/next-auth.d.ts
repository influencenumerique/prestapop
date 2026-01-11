import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: "USER" | "COMPANY" | "DRIVER" | "ADMIN"
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string
    role?: "USER" | "COMPANY" | "DRIVER" | "ADMIN"
  }
}
