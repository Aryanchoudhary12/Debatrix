import NextAuth from "next-auth";
import { authConfig } from "@/app/auth.config";

export const { auth } = NextAuth(authConfig);

export default auth; 

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};