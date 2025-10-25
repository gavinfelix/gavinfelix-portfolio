import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { DUMMY_PASSWORD } from "@/lib/constants";
import { createGuestUser, getUser } from "@/lib/db/queries";
import { authConfig } from "./auth.config";

export type UserType = "guest" | "regular";

// Type declarations for NextAuth
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

// Helper function to validate user credentials
async function validateUserCredentials(email: string, password: string) {
  try {
    const users = await getUser(email);

    if (users.length === 0) {
      // Perform dummy comparison to prevent timing attacks
      await compare(password, DUMMY_PASSWORD);
      return null;
    }

    const [user] = users;

    if (!user.password) {
      // Perform dummy comparison to prevent timing attacks
      await compare(password, DUMMY_PASSWORD);
      return null;
    }

    const passwordsMatch = await compare(password, user.password);
    return passwordsMatch ? { ...user, type: "regular" as const } : null;
  } catch (error) {
    console.error("Error validating user credentials:", error);
    return null;
  }
}

// Helper function to create guest user with error handling
async function createGuestUserSafely() {
  try {
    const [guestUser] = await createGuestUser();
    return { ...guestUser, type: "guest" as const };
  } catch (error) {
    console.error("Error creating guest user:", error);
    // Return a fallback guest user if database fails
    return {
      id: `fallback-${Date.now()}`,
      email: `fallback-guest-${Date.now()}`,
      type: "guest" as const,
    };
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  trustHost: true, // Allow localhost in development
  providers: [
    // Regular user credentials provider
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        return await validateUserCredentials(email, password);
      },
    }),
    // Guest user provider
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        return await createGuestUserSafely();
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
      }
      return session;
    },
  },
});
