"use client";

import { useState } from "react";
import { usePremium } from "@/context/PremiumContext";
import { useRazorpay } from "@/hooks/useRazorpay";
import Link from "next/link";

const plans = [
  {
    id: "free" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out and occasional use",
    features: [
      "5 free credits to start",
      "10 images/day",
      "Standard quality downloads",
      "Watermark on downloads",
      "Basic backgrounds (colors)",
      "Community support",
      "Ad-supported",
    ],
    limitations: [
      "No HD downloads",
      "No batch processing",
      "No touch-up editor",
      "No text overlay",
    ],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "For professionals and regular users",
    features: [
      "Unlimited HD downloads",
      "Unlimited images/day",
      "No watermark",
      "Batch processing",
      "Touch-up editor (erase/restore)",
      "Custom background images",
      "Blur background effect",
      "Drop shadow effect",
      "Text overlay",
      "All preset templates",
      "All export formats (PNG, JPG, WebP)",
      "Quality slider control",
      "1,000 API requests/day",
      "No ads",
      "Email support",
    ],
    limitations: [],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "business" as const,
    name: "Business",
    price: "$29.99",
    period: "/month",
    description: "For teams and high-volume businesses",
    features: [
      "Everything in Pro",
      "Unlimited API requests",
      "Priority processing",
      "Dedicated support",
      "Custom branding (remove K2 TechInfo)",
      "Team accounts (up to 10 users)",
      "Invoice billing",
      "SLA guarantee (99.9% uptime)",
      "On-premise deployment option",
    ],
    limitations: [],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const creditPacks = [
  { credits: 10, price: "$4.99", perCredit: "$0.50" },
  { credits: 50, price: "$19.99", perCredit: "$0.40" },
  { credits: 200, price: "$59.99", perCredit: "$0.30" },
  { credits: 500, price: "$99.99", perCredit: "$0.20" },
];

const faqs = [
  {
    q: "What is a credit?",
    a: "Each HD download costs 1 credit. Free users get 5 credits to start. You can buy more credits or upgrade to Pro for unlimited HD downloads.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel your subscription at any time. You'll retain access until the end of your billing period.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. All image processing happens in your browser. Your images are never uploaded to our servers.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, PayPal, and bank transfers for Business plans.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. We offer a 14-day money-back guarantee on all paid plans. No questions asked.",
  },
  {
    q: "What happens to my credits if I upgrade?",
    a: "Your remaining credits carry over when you upgrade. Pro users don't need credits for HD downloads.",
  },
];

export default function PricingSection() {
  const { state, setPlan, isPro } = usePremium();
  const { pay } = useRazorpay();
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const handleSelectPlan = async (planId: "free" | "pro" | "business") => {
    if (planId === "free") {
      setPlan("free");
      return;
    }
    if (planId === "business") {
      window.open("mailto:sales@k2techinfo.com?subject=BG Remover Business Plan", "_blank");
      return;
    }
    setProcessing(planId);
    const result = await pay(`${planId}_monthly`);
    setProcessing(null);
    showToast(result.message);
  };

  const handleBuyCredits = async (credits: number) => {
    setProcessing(`credits_${credits}`);
    const result = await pay(`credits_${credits}`);
    setProcessing(null);
    showToast(result.message);
  };

  return (
    <div className="py-16 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start for free. Upgrade when you need more power. No hidden fees.
          </p>
          {state.plan !== "free" && (
            <div className="inline-flex items-center mt-4 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
              You&apos;re on the {state.plan.charAt(0).toUpperCase() + state.plan.slice(1)} plan
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-8 border ${
                plan.highlighted
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50 shadow-xl shadow-blue-600/10 relative"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>
              </div>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={state.plan === plan.id || processing === plan.id}
                className={`w-full py-3 font-semibold rounded-xl transition-colors mb-6 ${
                  state.plan === plan.id
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : plan.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                } ${processing === plan.id ? "opacity-60 cursor-wait" : ""}`}
              >
                {processing === plan.id ? "Processing..." : state.plan === plan.id ? "Current Plan" : plan.cta}
              </button>

              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
                {plan.limitations.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400 dark:text-gray-500">
                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Credit Packs */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Or Buy Credits
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Pay-as-you-go. 1 credit = 1 HD download. No subscription needed.
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
              Your balance: {state.credits} credits
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {creditPacks.map((pack) => (
              <div
                key={pack.credits}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{pack.credits}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">credits</p>
                <p className="text-lg font-bold text-blue-600 mb-1">{pack.price}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{pack.perCredit}/credit</p>
                <button
                  onClick={() => handleBuyCredits(pack.credits)}
                  disabled={processing === `credits_${pack.credits}`}
                  className={`w-full py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${processing === `credits_${pack.credits}` ? "opacity-60 cursor-wait" : ""}`}
                >
                  {processing === `credits_${pack.credits}` ? "Processing..." : "Buy Now"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Affiliate Section */}
        <div className="mb-20 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-8 sm:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Earn With Our Affiliate Program
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Earn 30% recurring commission for every customer you refer. Share your unique link and get paid monthly.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                <p className="text-3xl font-bold text-blue-600 mb-1">30%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recurring Commission</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                <p className="text-3xl font-bold text-blue-600 mb-1">90 days</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cookie Duration</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                <p className="text-3xl font-bold text-blue-600 mb-1">Monthly</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Payouts via PayPal</p>
              </div>
            </div>
            <a
              href="mailto:affiliates@k2techinfo.com?subject=BG Remover Affiliate Program"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
            >
              Join Affiliate Program
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Money-back guarantee */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">14-day money-back guarantee on all paid plans</p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-xl shadow-lg toast-enter z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
