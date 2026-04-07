"use client";

import { useCallback } from "react";
import { usePremium } from "@/context/PremiumContext";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const { setPlan, addCredits } = usePremium();

  const pay = useCallback(
    async (productId: string): Promise<{ success: boolean; message: string }> => {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        return { success: false, message: "Failed to load payment gateway" };
      }

      // Create order on server
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        return { success: false, message: err.error || "Failed to create order" };
      }

      const order = await orderRes.json();

      // Open Razorpay checkout
      return new Promise((resolve) => {
        const options: RazorpayOptions = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          amount: order.amount,
          currency: order.currency,
          name: "BG Remover",
          description: order.description,
          order_id: order.orderId,
          handler: async (response: RazorpayResponse) => {
            // Verify payment on server
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                productId,
              }),
            });

            if (verifyRes.ok) {
              const result = await verifyRes.json();
              // Update local state based on purchase
              if (result.type === "plan") {
                setPlan(result.value as "pro" | "business");
              } else if (result.type === "credits") {
                addCredits(result.value as number);
              }
              resolve({ success: true, message: "Payment successful!" });
            } else {
              resolve({ success: false, message: "Payment verification failed" });
            }
          },
          theme: { color: "#2563eb" },
          modal: {
            ondismiss: () => {
              resolve({ success: false, message: "Payment cancelled" });
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    },
    [setPlan, addCredits]
  );

  return { pay };
}
