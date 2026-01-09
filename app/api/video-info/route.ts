import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get client IP to forward to backend for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0].trim() || 
                     request.headers.get("x-real-ip") || 
                     "127.0.0.1";

    const response = await fetch(`${BACKEND_URL}/api/video-info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientIp,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Video info API error:", error);
    return NextResponse.json(
      { detail: "Failed to fetch video info" },
      { status: 500 }
    );
  }
}
