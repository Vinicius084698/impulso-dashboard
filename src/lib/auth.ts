import NextAuth, { NextAuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";

export const authOptions: NextAuthOptions = {
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
  session: {
    strategy: "jwt", // Não usaremos banco de dados, a sessão ficará segura em cookies
  },
  callbacks: {
    // Pega o token na hora do login com o Facebook
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    // Repassa o token para a sessão do frontend/backend
    async session({ session, token }) {
      if (session.user) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
};
