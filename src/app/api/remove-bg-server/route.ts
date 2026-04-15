import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large. Max 20MB." }, { status: 400 });
    }

    const imageBuffer = await file.arrayBuffer();

    // Use Node.js server-side library
    const { removeBackground } = await import("@imgly/background-removal-node");
    const inputBlob = new Blob([imageBuffer]);
    const resultBlob = await removeBackground(inputBlob, {
      model: "large",
      output: { format: "image/png", quality: 1.0 },
    });

    const resultBuffer = await resultBlob.arrayBuffer();

    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'inline; filename="result.png"',
      },
    });
  } catch (err) {
    console.error("Server BG removal error:", err);
    return NextResponse.json(
      { error: "Server processing failed" },
      { status: 500 }
    );
  }
}
