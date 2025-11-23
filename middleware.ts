import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/auth/(.*)",
  "/api/health",
  "/api/public/(.*)",
  "/api/users/userId/(.*)",
  "/api/leaves",
  "/api/subtasksMobile/(.*)",
  "/api/time-entries-mobile/(.*)",
  "/api/documents/(.*)",
  "/api/attendance/(.*)",
]);

const allowedOrigins = [
  "exp://",
  "http://localhost:8081",
  "http://localhost:19000",
  "http://localhost:19006",
  "http://192.168.*:*",
  "http://10.*:*",
  "https://necs-engineers-bizflow.vercel.app",
];

function setCorsHeaders(req: Request, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");

  const isAllowedOrigin =
    !origin ||
    allowedOrigins.some(
      (allowed) => origin.includes(allowed) || allowed.includes(origin)
    );

  if (isAllowedOrigin) {
    res.headers.set("Access-Control-Allow-Origin", origin || "*");
  }

  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-CSRF-Token",
      "X-API-Key",
      "Expo-Platform",
      "Expo-Runtime-Version",
      "Clerk-Auth",
    ].join(", ")
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Max-Age", "86400");
  res.headers.set("Vary", "Origin");

  return res;
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionId } = await auth();
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Handle API routes
  if (pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 200 });
      return setCorsHeaders(req, preflight);
    }

    const res = NextResponse.next();
    setCorsHeaders(req, res);

    if (isPublicRoute(req)) {
      return res;
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Please sign in to access this resource",
        },
        { status: 401 }
      );
    }

    return res;
  }

  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", pathname);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
    "/(api|trpc)(.*)",
  ],
};
