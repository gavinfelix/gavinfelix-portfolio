import type { NextAuthConfig } from "next-auth";

/**
 * NextAuth configuration for authentication
 * Provides custom pages and provider setup
 */
export const authConfig = {
  pages: {
    signIn: "/login", // Custom sign in page
    newUser: "/", // Where to redirect new users after registration
  },
  providers: [
    // Providers are added in auth.ts since they require bcrypt
    // which is only compatible with Node.js environments
    // This file is also used in non-Node.js environments
  ],
  callbacks: {},
  trustHost: true, // Allow localhost and custom domains in development
} satisfies NextAuthConfig;
