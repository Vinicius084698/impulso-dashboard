import NextAuth, { NextAuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "public_profile,ads_read",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
        
        // Vamos buscar a conta do provedor (Facebook) vinculada a esse usuario
        // para disponibilizarmos o access_token se necessario no backend.
        const account = await prisma.account.findFirst({
          where: { userId: user.id, provider: "facebook" }
        });
        
        if (account) {
          session.accessToken = account.access_token;
        }
      }
      return session;
    },
  },
};
