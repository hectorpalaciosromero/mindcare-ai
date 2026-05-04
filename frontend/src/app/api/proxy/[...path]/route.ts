import { NextRequest, NextResponse } from 'next/server';

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const backendUrl = process.env.INTERNAL_API_URL || "http://backend:8000";
    const pathStr = resolvedParams.path.join('/');
    const url = `${backendUrl}/api/${pathStr}${request.nextUrl.search}`;

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    
    // Forward content type if it exists
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    const options: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      options.body = await request.text();
    }

    const response = await fetch(url, options);
    
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = text;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Error interno del proxy" }, { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
