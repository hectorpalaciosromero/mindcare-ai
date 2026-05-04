import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // In Docker, the frontend communicates with the backend via the internal hostname "backend"
    const backendUrl = process.env.INTERNAL_API_URL || "http://backend:8000";
    
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const data = await response.json();
const res = NextResponse.json({ role: data.role, success: true });
res.cookies.set("token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && !request.url.startsWith("http://localhost"),
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ error: "Error de servidor interno" }, { status: 500 });
  }
}
