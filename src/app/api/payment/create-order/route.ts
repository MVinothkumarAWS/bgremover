import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

// Plans and credit packs with pricing in INR (paise) - ~50% of remove.bg
const PRODUCTS: Record<string, { amount: number; currency: string; description: string }> = {
  // Subscription plans
  lite_monthly: { amount: 26900, currency: "INR", description: "BG Remover Lite - 40 credits/mo" },
  pro_monthly: { amount: 119900, currency: "INR", description: "BG Remover Pro - 200 credits/mo" },
  volume_500_monthly: { amount: 269900, currency: "INR", description: "BG Remover Volume+ 500 credits/mo" },
  volume_1000_monthly: { amount: 479900, currency: "INR", description: "BG Remover Volume+ 1000 credits/mo" },
  volume_2500_monthly: { amount: 999900, currency: "INR", description: "BG Remover Volume+ 2500 credits/mo" },
  // Pay-as-you-go credit packs (₹33/credit)
  credits_3: { amount: 9900, currency: "INR", description: "3 HD Credits" },
  credits_5: { amount: 16500, currency: "INR", description: "5 HD Credits" },
  credits_10: { amount: 33000, currency: "INR", description: "10 HD Credits" },
  credits_25: { amount: 82500, currency: "INR", description: "25 HD Credits" },
  credits_50: { amount: 165000, currency: "INR", description: "50 HD Credits" },
  credits_100: { amount: 330000, currency: "INR", description: "100 HD Credits" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;

    const product = PRODUCTS[productId];
    if (!product) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    const order = await getRazorpay().orders.create({
      amount: product.amount,
      currency: product.currency,
      receipt: `bgr_${productId}_${Date.now()}`,
      notes: {
        productId,
        description: product.description,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      productId,
      description: product.description,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
