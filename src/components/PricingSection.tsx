"use client";

import { useState } from "react";
import { usePremium } from "@/context/PremiumContext";
import { useRazorpay } from "@/hooks/useRazorpay";

const CREDIT_OPTIONS = [3, 5, 10, 25, 50, 100];
const CREDIT_PRICE_PER = 67; // ₹67 per credit for pay-as-you-go

const plans = [
  {
    id: "payg",
    name: "Pay-as-you-go",
    subtitle: null,
    hasDropdown: true,
    price: null,
    period: null,
    yearly: null,
    features: ["Start small with a one-off purchase — upgrade and scale when needed.", "Need more? Top up your credits anytime, on top of your current plan."],
    featureGroups: [
      { title: "AI Photo editor", items: ["Remove background", "Max quality exports"] },
    ],
    highlighted: false,
  },
  {
    id: "lite",
    name: "Lite",
    subtitle: "Use up to 40 credits per month",
    hasDropdown: false,
    price: "₹539",
    period: "/ month",
    yearly: "₹6,469 billed yearly",
    features: [],
    featureGroups: [
      { title: "AI Photo editor", items: ["Remove background", "AI background", "Erase & restore", "Max quality exports"] },
      { title: "Automation", items: ["API and integrations"] },
    ],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "Use up to 200 credits per month",
    hasDropdown: false,
    price: "₹2,385",
    period: "/ month",
    yearly: "₹28,620 billed yearly",
    features: [],
    featureGroups: [
      { title: "AI Photo editor", items: ["Remove background", "AI background", "Erase & restore", "Max quality exports"] },
      { title: "Automation", items: ["API and integrations", "Bulk editing ⚡"] },
    ],
    highlighted: true,
  },
  {
    id: "volume",
    name: "Volume+",
    subtitle: null,
    hasDropdown: true,
    price: null,
    period: "/ month",
    yearly: null,
    features: [],
    featureGroups: [
      { title: "Everything in Pro, plus", items: [] },
      { title: "Custom volume", items: ["For scale, speed and flexibility.", "Need more than 100,000 images/year?"] },
      { title: "API Custom controls ⚡", items: ["Crop, scale, and position"] },
    ],
    highlighted: false,
  },
];

const VOLUME_OPTIONS = [
  { credits: 500, price: "₹5,355", yearly: "₹64,260 billed yearly" },
  { credits: 1000, price: "₹9,500", yearly: "₹1,14,000 billed yearly" },
  { credits: 2500, price: "₹21,000", yearly: "₹2,52,000 billed yearly" },
];

const faqs = [
  { q: "What is a credit?", a: "1 credit = 1 HD image download at full resolution. Preview downloads are always free." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel your subscription at any time. You'll retain access until the end of your billing period." },
  { q: "Is my data safe?", a: "Yes. All image processing happens in your browser. Your images are never uploaded to our servers." },
  { q: "What payment methods do you accept?", a: "We accept UPI, credit/debit cards, net banking, and wallets via Razorpay." },
  { q: "Do you offer refunds?", a: "Yes. 14-day money-back guarantee on all paid plans. No questions asked." },
  { q: "What about the API?", a: "Lite and above plans include API access. Check our API docs for integration details." },
];

export default function PricingSection() {
  const { state } = usePremium();
  const { pay } = useRazorpay();
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [selectedCredits, setSelectedCredits] = useState(3);
  const [selectedVolume, setSelectedVolume] = useState(0);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const handleBuy = async (productId: string) => {
    setProcessing(productId);
    const result = await pay(productId);
    setProcessing(null);
    showToast(result.message);
  };

  const paygPrice = selectedCredits * CREDIT_PRICE_PER;

  return (
    <div className="py-16 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center px-3 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start for free. Upgrade when you need more power.
          </p>
        </div>

        {/* 4-tier grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 border-2 flex flex-col ${
                plan.highlighted
                  ? "border-amber-400 bg-white dark:bg-gray-900 shadow-xl shadow-amber-400/10"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                {plan.highlighted && (
                  <span className="px-2.5 py-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full uppercase">Most Popular</span>
                )}
              </div>

              {plan.subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Use up to <span className="font-bold text-gray-900 dark:text-white">
                    {plan.id === "pro" ? "200 credits" : "40 credits"}
                  </span> per month
                </p>
              )}

              {/* Pay-as-you-go dropdown */}
              {plan.id === "payg" && (
                <div className="mb-4">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Amount</label>
                  <select
                    value={selectedCredits}
                    onChange={(e) => setSelectedCredits(+e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    {CREDIT_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c} credits</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Volume dropdown */}
              {plan.id === "volume" && (
                <div className="mb-4">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Amount</label>
                  <select
                    value={selectedVolume}
                    onChange={(e) => setSelectedVolume(+e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    {VOLUME_OPTIONS.map((v, i) => (
                      <option key={v.credits} value={i}>{v.credits} credits</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price */}
              <div className="mb-4">
                {plan.id === "payg" ? (
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white">₹{paygPrice}</p>
                ) : plan.id === "volume" ? (
                  <>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      {VOLUME_OPTIONS[selectedVolume].price}
                      <span className="text-base font-normal text-gray-500 dark:text-gray-400"> / month</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{VOLUME_OPTIONS[selectedVolume].yearly}</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      {plan.price}
                      <span className="text-base font-normal text-gray-500 dark:text-gray-400"> {plan.period}</span>
                    </p>
                    {plan.yearly && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{plan.yearly}</p>}
                  </>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleBuy(plan.id === "payg" ? `credits_${selectedCredits}` : `${plan.id}_monthly`)}
                disabled={processing === plan.id}
                className={`w-full py-3 font-semibold rounded-full transition-all mb-6 ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20"
                    : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                } ${processing === plan.id ? "opacity-60 cursor-wait" : ""}`}
              >
                {processing === plan.id ? "Processing..." : plan.id === "payg" ? "Buy now" : "Subscribe"}
              </button>

              {/* Separator */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex-1">
                {/* Description for pay-as-you-go */}
                {plan.features.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4 leading-relaxed">
                    {plan.features.join(" ")}
                  </p>
                )}

                {/* Feature groups */}
                {plan.featureGroups.map((group) => (
                  <div key={group.title} className="mb-4">
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{group.title}</p>
                    <ul className="space-y-1.5">
                      {group.items.map((item) => (
                        <li key={item} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {plan.id === "volume" && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Need more than 100,000 images/year?{" "}
                    <a href="mailto:sales@k2techinfo.com" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">Let&apos;s talk!</a>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Trial credit banner */}
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            1 trial credit to get started
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">Your balance: <span className="font-bold text-violet-600">{state.credits} credits</span></p>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Money-back */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">14-day money-back guarantee on all paid plans</p>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-xl shadow-lg toast-enter z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
