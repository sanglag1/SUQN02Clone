import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
 
// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/interview(.*)',
  '/profile(.*)',
  '/jd(.*)',
  '/saved(.*)',
  '/tracking(.*)',
  '/avatar-interview(.*)',
  '/interview-review(.*)',
  '/payment(.*)',
  '/test(.*)',
  '/onboarding(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Protect routes that require authentication
  if (isProtectedRoute(req) && !userId) {
    // Always send unauthenticated users to our custom sign-in page
    const url = new URL('/sign-in', req.url);
    // preserve where the user was heading (optional)
    url.searchParams.set('redirect_url', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});
 
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
