import type { NextAuthConfig } from "next-auth";
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const protectedPaths = ["/debate","/profile","/discover"]; 
      const authOnlyPaths = ["/login", "/register"]; 

      const isProtected = protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );
      const isAuthPage = authOnlyPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (isProtected && !isLoggedIn) {
        return false;
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;