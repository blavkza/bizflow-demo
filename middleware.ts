import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  // Web routes
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/auth/(.*)",

  // Health check and public APIs
  "/api/health",
  "/api/public/(.*)",
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

  // Set CORS headers
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
  res.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  res.headers.set("Vary", "Origin");

  return res;
}

function isMobileAppRequest(req: Request): boolean {
  const origin = req.headers.get("origin");
  const userAgent = req.headers.get("user-agent") || "";

  return (
    !!origin &&
    (origin.includes("exp://") ||
      origin.includes("localhost:8081") ||
      origin.includes("localhost:19000") ||
      userAgent.includes("Expo") ||
      userAgent.includes("Android") ||
      userAgent.includes("iOS"))
  );
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionId } = await auth();
  const url = new URL(req.url);
  const pathname = url.pathname;

  console.log(`[Middleware] ${req.method} ${pathname}`, {
    userId,
    sessionId: sessionId ? "present" : "none",
    origin: req.headers.get("origin"),
    userAgent: req.headers.get("user-agent"),
  });

  if (pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 200 });
      return setCorsHeaders(req, preflight);
    }

    const res = NextResponse.next();
    setCorsHeaders(req, res);

    if (isPublicRoute(req)) {
      console.log(`[Middleware] Allowing public API route: ${pathname}`);
      return res;
    }

    if (isMobileAppRequest(req)) {
      console.log(`[Middleware] Mobile app request detected for: ${pathname}`);

      const authHeader = req.headers.get("authorization");

      if (authHeader?.startsWith("Bearer ")) {
        console.log(`[Middleware] Bearer token present for mobile request`);
        if (!userId) {
          console.log(`[Middleware] Invalid token for mobile request`);
          return NextResponse.json(
            {
              error: "Unauthorized",
              message: "Invalid or expired authentication token",
            },
            { status: 401 }
          );
        }

        console.log(`[Middleware] Mobile user authenticated: ${userId}`);
        return res;
      }

      if (!userId) {
        console.log(
          `[Middleware] No authentication for mobile API: ${pathname}`
        );
        return NextResponse.json(
          {
            error: "Authentication required",
            message: "Please include Authorization header with Bearer token",
          },
          { status: 401 }
        );
      }
    }

    if (!userId && !isPublicRoute(req)) {
      console.log(`[Middleware] Unauthenticated web request to: ${pathname}`);
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Please sign in to access this resource",
        },
        { status: 401 }
      );
    }

    if (userId && pathname.startsWith("/api/users/userId/")) {
      const requestedUserId = pathname.split("/").pop();
      if (requestedUserId && requestedUserId !== userId) {
        console.log(
          `[Middleware] User ${userId} attempted to access data for ${requestedUserId}`
        );
        return NextResponse.json(
          { error: "Forbidden", message: "You can only access your own data" },
          { status: 403 }
        );
      }
    }

    console.log(`[Middleware] Allowing authenticated request to: ${pathname}`);
    return res;
  }

  if (!userId && !isPublicRoute(req)) {
    console.log(
      `[Middleware] Redirecting unauthenticated web request to sign-in`
    );

    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", pathname);

    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (!pathname.startsWith("/api/") && !isMobileAppRequest(req)) {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    );
  }

  console.log(`[Middleware] Allowing request to: ${pathname}`);
  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",

    "/(api|trpc)(.*)",
  ],
};
