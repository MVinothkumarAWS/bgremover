import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId } = body;

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Payment verified - determine what was purchased
    let result: { type: string; value: string | number } = { type: "unknown", value: 0 };

    if (productId === "pro_monthly") {
      result = { type: "plan", value: "pro" };
    } else if (productId === "business_monthly") {
      result = { type: "plan", value: "business" };
    } else if (productId.startsWith("credits_")) {
      const credits = parseInt(productId.replace("credits_", ""));
      result = { type: "credits", value: credits };
    }

    // In production, you'd save this to a database
    // For now, the client will handle updating localStorage

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      ...result,
    });
  } catch (err) {
    console.error("Payment verification failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
