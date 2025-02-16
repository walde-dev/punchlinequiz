import NextAuth from "next-auth";
import { authConfig } from "~/server/auth/config";

// @ts-expect-error Async component type error
export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
