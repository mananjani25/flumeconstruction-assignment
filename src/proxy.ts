import { NextResponse, type NextRequest } from "next/server";

// Runs at the edge (Next 16 "proxy" convention) and can't touch the database,
// so it gates on the presence of the session cookie only. Real session
// validation (expiry, revocation) happens in the route handlers / server
// components via getCurrentUser / requireUser.

const SESSION_COOKIE = "session";
const PUBLIC_PAGES = ["/login", "/signup"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // Auth endpoints are always reachable (login, signup, logout, me).
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Data API: no cookie -> 401 JSON (don't redirect XHR to an HTML page).
  if (pathname.startsWith("/api")) {
    if (!hasSession) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PAGES.includes(pathname);

  // Unauthenticated -> bounce to /login, remembering where they were headed.
  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Already signed in -> keep them out of the login/signup pages.
  if (hasSession && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static files (anything with a
  // file extension).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
