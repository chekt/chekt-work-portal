import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // eslint-disable-next-line no-console
  console.log(`[Middleware] ${pathname}`);

  // NextAuth API 경로는 인증 체크 제외
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 인증 토큰 확인
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // eslint-disable-next-line no-console
  console.log(`[Middleware] Token exists: ${!!token}`);

  // API 경로: 인증이 없으면 401 반환
  if (pathname.startsWith("/api")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Host validation
    const host = req.headers.get("host");
    const port = process.env.PORT || 3000;
    let allowedHosts = [`localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`];
    const allowAll = process.env.HOMEPAGE_ALLOWED_HOSTS === "*";
    if (process.env.HOMEPAGE_ALLOWED_HOSTS) {
      allowedHosts = allowedHosts.concat(process.env.HOMEPAGE_ALLOWED_HOSTS.split(","));
    }
    if (!allowAll && (!host || !allowedHosts.includes(host))) {
      // eslint-disable-next-line no-console
      console.error(
        `Host validation failed for: ${host}. Hint: Set the HOMEPAGE_ALLOWED_HOSTS environment variable to allow requests from this host / port.`,
      );
      return NextResponse.json({ error: "Host validation failed. See logs for more details." }, { status: 400 });
    }

    return NextResponse.next();
  }

  // 프론트엔드 경로: 인증이 없으면 Keycloak 로그인 페이지로 리다이렉트
  if (!token) {
    const signInUrl = new URL("/api/auth/signin/keycloak", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
