import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

// Helper to sanitize filename for HTTP headers
function sanitizeFilename(filename: string): string {
  // Remove emojis and other non-ASCII characters, keep basic chars
  return filename
    .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII
    .replace(/[<>:"/\\|?*]/g, '_') // Remove invalid file chars
    .trim() || 'download';
}

// Helper to encode filename for Content-Disposition header
function encodeFilenameForHeader(filename: string): string {
  const sanitized = sanitizeFilename(filename);
  // Use RFC 5987 encoding for UTF-8 filename
  const encoded = encodeURIComponent(filename).replace(/'/g, "%27");
  return `attachment; filename="${sanitized}"; filename*=UTF-8''${encoded}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, ...requestBody } = body;

    // Validate endpoint
    const allowedEndpoints = ["/api/download", "/api/download-best", "/api/download-audio"];
    if (!allowedEndpoints.includes(endpoint)) {
      return NextResponse.json(
        { detail: "Invalid download endpoint" },
        { status: 400 }
      );
    }

    // Get client IP to forward to backend for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0].trim() || 
                     request.headers.get("x-real-ip") || 
                     "127.0.0.1";

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientIp,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // Stream the file response
    const headers = new Headers();
    
    // Get filename and properly encode it for headers
    const xFilename = response.headers.get("X-Filename") || "download";
    headers.set("Content-Disposition", encodeFilenameForHeader(xFilename));
    headers.set("X-Filename", sanitizeFilename(xFilename));
    
    const contentLength = response.headers.get("Content-Length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    
    headers.set("Content-Type", "application/octet-stream");

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json(
      { detail: "Download failed" },
      { status: 500 }
    );
  }
}

// Increase body size limit for streaming
export const config = {
  api: {
    responseLimit: false,
  },
};
