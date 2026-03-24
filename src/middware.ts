/**
 * Next.js Middleware — minimal version.
 *
 * We rely on RouteGuard (client-side) for auth protection instead of middleware.
 * Middleware only handles one simple case: redirect from root / to landing page.
 *
 * Why: The ventsafe-token cookie is set on localhost:3000 by the frontend,
 * but cross-origin cookie reading between ports caused redirect loops.
 * RouteGuard reads from Zustand store (which reads from localStorage + /auth/me)
 * and is more reliable.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Let everything through — RouteGuard handles auth on the client side
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
