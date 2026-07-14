import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string | null
    user: {
      id: string
    } & DefaultSession["user"]
  }
}
