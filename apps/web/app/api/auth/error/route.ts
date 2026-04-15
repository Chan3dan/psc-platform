import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL('/auth/error', request.url);
  const error = request.nextUrl.searchParams.get('error');
  if (error) url.searchParams.set('error', error);
  return NextResponse.redirect(url);
}
