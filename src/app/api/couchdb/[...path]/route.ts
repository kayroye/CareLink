import { NextRequest } from 'next/server';

const COUCHDB_URL = process.env.COUCHDB_URL || 'http://localhost:5984';
const COUCHDB_USER = process.env.COUCHDB_USER || 'carelink-admin';
const COUCHDB_PASSWORD = process.env.COUCHDB_PASSWORD || 'secure-password1';

function getAuthHeaders() {
  const credentials = Buffer.from(`${COUCHDB_USER}:${COUCHDB_PASSWORD}`).toString('base64');
  return {
    Authorization: `Basic ${credentials}`,
  };
}

async function proxyRequest(request: NextRequest, path: string) {
  const url = new URL(path, COUCHDB_URL);

  // Forward query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  console.log(`[CouchDB Proxy] ${request.method} ${url.toString()}`);

  // Get request body if present
  let body: BodyInit | null = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }

  // Forward the request to CouchDB
  const response = await fetch(url.toString(), {
    method: request.method,
    headers: {
      ...getAuthHeaders(),
      'Content-Type': request.headers.get('Content-Type') || 'application/json',
      'Accept': request.headers.get('Accept') || 'application/json',
    },
    body,
  });

  // Stream the response back
  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    // Skip headers that shouldn't be forwarded
    if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, '/' + path.join('/'));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, '/' + path.join('/'));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, '/' + path.join('/'));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, '/' + path.join('/'));
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, '/' + path.join('/'));
}
