import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const backendUrl = process.env.INTERNAL_API_URL || "http://backend:8000";
    
    const response = await fetch(`${backendUrl}/api/patients/checkins`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(()=>({}));
      return NextResponse.json({ error: err.detail || "Error al registrar check-in" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const backendUrl = process.env.INTERNAL_API_URL || "http://backend:8000";
    const response = await fetch(`${backendUrl}/api/patients/checkins`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!response.ok) return NextResponse.json([], { status: response.status });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
