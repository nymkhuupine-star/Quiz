import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Бүх нийтэд нээлттэй замууд (Нүүр хуудас болон Clerk-ийн дотоод замууд)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk(.*)",
  "/sso-callback(.*)", // Үүнийг заавал нэмж өгөөрэй
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
