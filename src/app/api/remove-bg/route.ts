import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiting (per API key)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const FREE_LIMIT = 50; // 50 requests per day for free tier
const RATE_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(apiKey: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimits.get(apiKey);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(apiKey, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true, remaining: FREE_LIMIT - 1 };
  }

  if (entry.count >= FREE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: FREE_LIMIT - entry.count };
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key. Include 'x-api-key' header. Get your key at /api-docs" },
        { status: 401 }
      );
    }

    // Rate limiting
    const { allowed, remaining } = checkRateLimit(apiKey);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Free tier allows 50 requests/day." },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
      );
    }

    // Parse request
    const contentType = request.headers.get("content-type") || "";
    let imageBuffer: ArrayBuffer;
    let outputFormat = "image/png";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No 'image' field in form data" }, { status: 400 });
      }
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "File must be an image (PNG, JPG, WebP)" }, { status: 400 });
      }
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json({ error: "Image too large. Max 20MB." }, { status: 400 });
      }
      imageBuffer = await file.arrayBuffer();

      // Optional output format
      const format = formData.get("format") as string | null;
      if (format === "jpg" || format === "jpeg") outputFormat = "image/jpeg";
      else if (format === "webp") outputFormat = "image/webp";
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      if (!body.image_url) {
        return NextResponse.json({ error: "Provide 'image_url' in JSON body" }, { status: 400 });
      }
      const imageRes = await fetch(body.image_url);
      if (!imageRes.ok) {
        return NextResponse.json({ error: "Failed to fetch image from URL" }, { status: 400 });
      }
      imageBuffer = await imageRes.arrayBuffer();
      if (body.format === "jpg" || body.format === "jpeg") outputFormat = "image/jpeg";
      else if (body.format === "webp") outputFormat = "image/webp";
    } else {
      // Raw image body
      imageBuffer = await request.arrayBuffer();
      if (imageBuffer.byteLength === 0) {
        return NextResponse.json({ error: "Empty request body" }, { status: 400 });
      }
    }

    // Process image (client-side library used server-side as fallback)
    const { removeBackground } = await import("@imgly/background-removal");
    const inputBlob = new Blob([imageBuffer]);
    const resultBlob = await removeBackground(inputBlob, {
      model: "isnet",
      rescale: false,
      output: { format: "image/png", quality: 1.0 },
    });

    const resultBuffer = await resultBlob.arrayBuffer();

    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        "Content-Type": outputFormat,
        "Content-Disposition": `inline; filename="result.${outputFormat.split("/")[1]}"`,
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Limit": FREE_LIMIT.toString(),
      },
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Failed to process image. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "BG Remover API",
    version: "1.0",
    docs: "/api-docs",
    endpoints: {
      "POST /api/remove-bg": {
        description: "Remove background from an image",
        headers: { "x-api-key": "Your API key (required)" },
        body: "multipart/form-data with 'image' field, OR JSON with 'image_url', OR raw image bytes",
        options: { format: "Output format: png (default), jpg, webp" },
        response: "Processed image binary",
        rate_limit: "50 requests/day (free tier)",
      },
    },
  });
}
