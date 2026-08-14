import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { collections, ensureIndexes } from "./models";

/**
 * NextAuth (Auth.js) configuration.
 * Replaces Meteor's `accounts-password`: username + password credentials,
 * bcrypt-hashed, with a stateless JWT session carrying the user id.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Please enter both username and password");
        }
        await ensureIndexes();
        const users = await collections.users();
        const user = await users.findOne({ username: credentials.username.trim() });
        if (!user) throw new Error("Incorrect username or password");

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) throw new Error("Incorrect username or password");

        return {
          id: user._id!,
          name: user.profile?.name || user.username,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid as string;
        (session.user as any).username = token.username as string;
      }
      return session;
    },
  },
};
