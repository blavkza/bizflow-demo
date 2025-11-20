import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in", "/api/auth/(.*)"]);

// Allowed origins for CORS
const allowedOrigins = [
  // Expo development origins
  "exp://localhost:19000",
  "exp://192.168.*:*",
  "http://localhost:8081",
];

function setCorsHeaders(req: Request, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");

  // Allow requests from allowed origins or development (no origin)
  if (!origin || allowedOrigins.some((allowed) => origin.includes(allowed))) {
    res.headers.set("Access-Control-Allow-Origin", origin || "*");
  }

  // Full REST API methods support
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Expo-Platform, Expo-Runtime-Version, X-API-Key"
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Max-Age", "86400");
  res.headers.set("Vary", "Origin");

  return res;
}

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = new URL(req.url);

  // Handle API routes with CORS
  if (url.pathname.startsWith("/api/")) {
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 200 });
      return setCorsHeaders(req, preflight);
    }

    // Apply CORS to all API responses
    const res = NextResponse.next();
    setCorsHeaders(req, res);

    // Authentication check - allow public routes for mobile
    if (!userId && !isPublicRoute(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return res;
  }

  // Handle page routes (web only)
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
