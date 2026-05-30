import { NextResponse } from 'next/server';

const jsonResponseHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function isDynamicServerUsage(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    (error as { digest?: unknown }).digest === 'DYNAMIC_SERVER_USAGE'
  );
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status, headers: jsonResponseHeaders });
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201, headers: jsonResponseHeaders });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status, headers: jsonResponseHeaders });
}

export function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401, headers: jsonResponseHeaders }
  );
}

export function forbidden() {
  return NextResponse.json(
    { success: false, error: 'Forbidden' },
    { status: 403, headers: jsonResponseHeaders }
  );
}

export function notFound(resource = 'Resource') {
  return NextResponse.json(
    { success: false, error: `${resource} not found` },
    { status: 404, headers: jsonResponseHeaders }
  );
}

export function serverError(error: unknown) {
  if (isDynamicServerUsage(error)) {
    throw error;
  }

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error instanceof Error
        ? error.message
        : 'Internal server error';
  console.error('[API Error]', error);
  return NextResponse.json(
    { success: false, error: message },
    { status: 500, headers: jsonResponseHeaders }
  );
}
