import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plans and credit packs with pricing in INR (paise)
const PRODUCTS: Record<string, { amount: number; currency: string; description: string }> = {
  // Subscription plans
  pro_monthly: { amount: 79900, currency: "INR", description: "BG Remover Pro - Monthly" },
  business_monthly: { amount: 249900, currency: "INR", description: "BG Remover Business - Monthly" },
  // Credit packs
  credits_10: { amount: 39900, currency: "INR", description: "10 HD Credits" },
  credits_50: { amount: 159900, currency: "INR", description: "50 HD Credits" },
  credits_200: { amount: 499900, currency: "INR", description: "200 HD Credits" },
  credits_500: { amount: 839900, currency: "INR", description: "500 HD Credits" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;

    const product = PRODUCTS[productId];
    if (!product) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
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
