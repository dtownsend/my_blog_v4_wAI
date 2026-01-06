import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  
  if (host.includes('dtsresume.com') && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/cv', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/',
};