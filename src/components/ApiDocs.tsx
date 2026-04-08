"use client";

import { useState } from "react";

const CODE_EXAMPLES = {
  curl: `# Upload a file
curl -X POST https://yourdomain.com/api/remove-bg \\
  -H "x-api-key: YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -o result.png

# From URL
curl -X POST https://yourdomain.com/api/remove-bg \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"image_url": "https://example.com/photo.jpg"}' \\
  -o result.png

# With format option
curl -X POST https://yourdomain.com/api/remove-bg \\
  -H "x-api-key: YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -F "format=webp" \\
  -o result.webp`,

  python: `import requests

API_KEY = "YOUR_API_KEY"
URL = "https://yourdomain.com/api/remove-bg"

# Method 1: Upload a file
with open("photo.jpg", "rb") as f:
    response = requests.post(
        URL,
        headers={"x-api-key": API_KEY},
        files={"image": f}
    )

if response.status_code == 200:
    with open("result.png", "wb") as out:
        out.write(response.content)
    print(f"Remaining: {response.headers['X-RateLimit-Remaining']}")
else:
    print(f"Error: {response.json()}")

# Method 2: From URL
response = requests.post(
    URL,
    headers={
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
    },
    json={
        "image_url": "https://example.com/photo.jpg",
        "format": "png"
    }
)`,

  javascript: `// Node.js / Browser
const API_KEY = "YOUR_API_KEY";
const URL = "https://yourdomain.com/api/remove-bg";

// Method 1: Upload a file
const formData = new FormData();
formData.append("image", fileInput.files[0]);
formData.append("format", "png"); // optional: png, jpg, webp

const response = await fetch(URL, {
  method: "POST",
  headers: { "x-api-key": API_KEY },
  body: formData,
});

if (response.ok) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  console.log("Remaining:", response.headers.get("X-RateLimit-Remaining"));
  // Use the blob URL to display or download
} else {
  const error = await response.json();
  console.error(error);
}

// Method 2: From URL
const response2 = await fetch(URL, {
  method: "POST",
  headers: {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    image_url: "https://example.com/photo.jpg",
    format: "png",
  }),
});`,

  php: `<?php
$api_key = "YOUR_API_KEY";
$url = "https://yourdomain.com/api/remove-bg";

// Upload a file
$ch = curl_init($url);
$data = [
    "image" => new CURLFile("photo.jpg", "image/jpeg"),
    "format" => "png"
];

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $data,
    CURLOPT_HTTPHEADER => ["x-api-key: $api_key"],
    CURLOPT_RETURNTRANSFER => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    file_put_contents("result.png", $response);
    echo "Background removed!";
} else {
    echo "Error: " . $response;
}
?>`,
};

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "50 requests/day",
      "Max 20MB per image",
      "PNG, JPG, WebP output",
      "URL & file upload",
      "Community support",
    ],
    cta: "Get Free Key",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    features: [
      "1,000 requests/day",
      "Max 50MB per image",
      "All output formats",
      "Priority processing",
      "HD output quality",
      "Email support",
      "Batch endpoint",
    ],
    cta: "Coming Soon",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited requests",
      "No size limits",
      "Dedicated infrastructure",
      "99.9% SLA uptime",
      "Custom integrations",
      "On-premise option",
      "24/7 priority support",
    ],
    cta: "Contact Us",
    highlighted: false,
  },
];

export default function ApiDocs() {
  const [activeTab, setActiveTab] = useState<keyof typeof CODE_EXAMPLES>("curl");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const generateKey = () => {
    const key = "bgr_" + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setApiKey(key);
    setShowKey(true);
    // Save to localStorage
    const keys = JSON.parse(localStorage.getItem("bgr-api-keys") || "[]");
    keys.push({ key, created: new Date().toISOString() });
    localStorage.setItem("bgr-api-keys", JSON.stringify(keys));
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
  };

  return (
    <div className="py-16 bg-white dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium rounded-full mb-4">
            REST API
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            BG Remover API
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Integrate AI background removal into your app. Simple REST API with
            50 free requests per day. No credit card required.
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Start</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Get your API key</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Click below to generate a free API key instantly.</p>
                {!showKey ? (
                  <button onClick={generateKey} className="px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors text-sm">
                    Generate Free API Key
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono text-gray-900 dark:text-white">
                      {apiKey}
                    </code>
                    <button onClick={copyKey} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Make your first request</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Send an image to the API and get back a transparent PNG.</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Reference */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">API Reference</h2>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Endpoint */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold rounded">POST</span>
                <code className="text-sm font-mono text-gray-900 dark:text-white">/api/remove-bg</code>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Remove the background from an image.</p>
            </div>

            {/* Headers */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Headers</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Required</th>
                    <th className="pb-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
                  <tr>
                    <td className="py-1"><code className="text-xs bg-gray-200 dark:bg-gray-800 px-1 rounded">x-api-key</code></td>
                    <td className="py-1"><span className="text-red-500">Yes</span></td>
                    <td className="py-1">Your API key</td>
                  </tr>
                  <tr>
                    <td className="py-1"><code className="text-xs bg-gray-200 dark:bg-gray-800 px-1 rounded">Content-Type</code></td>
                    <td className="py-1">Auto</td>
                    <td className="py-1">multipart/form-data or application/json</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Request Body */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Request Body</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Three ways to send an image:</p>
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Option 1: File upload (multipart/form-data)</p>
                  <table className="w-full text-xs mt-2">
                    <tbody className="text-gray-600 dark:text-gray-400">
                      <tr><td className="py-0.5 w-24"><code>image</code></td><td>Image file (PNG, JPG, WebP). Max 20MB.</td></tr>
                      <tr><td className="py-0.5"><code>format</code></td><td>Optional. Output format: png (default), jpg, webp</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Option 2: Image URL (application/json)</p>
                  <table className="w-full text-xs mt-2">
                    <tbody className="text-gray-600 dark:text-gray-400">
                      <tr><td className="py-0.5 w-24"><code>image_url</code></td><td>URL of the image to process</td></tr>
                      <tr><td className="py-0.5"><code>format</code></td><td>Optional. Output format: png (default), jpg, webp</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Option 3: Raw image bytes</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Send raw image binary as request body. Output: PNG.</p>
                </div>
              </div>
            </div>

            {/* Response */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Response</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold rounded">200</span>
                  <span className="text-gray-600 dark:text-gray-400">Image binary with transparent background</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-bold rounded">401</span>
                  <span className="text-gray-600 dark:text-gray-400">Missing or invalid API key</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-bold rounded">429</span>
                  <span className="text-gray-600 dark:text-gray-400">Rate limit exceeded</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-bold rounded">500</span>
                  <span className="text-gray-600 dark:text-gray-400">Processing error</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Response headers include:</p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside mt-1">
                  <li><code>X-RateLimit-Remaining</code> - Requests remaining today</li>
                  <li><code>X-RateLimit-Limit</code> - Total daily limit</li>
                </ul>
              </div>
            </div>

            {/* Code Examples */}
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Code Examples</h3>
              <div className="flex gap-1 mb-3">
                {(Object.keys(CODE_EXAMPLES) as Array<keyof typeof CODE_EXAMPLES>).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                      activeTab === tab
                        ? "bg-violet-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {tab === "curl" ? "cURL" : tab === "javascript" ? "JavaScript" : tab === "php" ? "PHP" : "Python"}
                  </button>
                ))}
              </div>
              <pre className="bg-gray-900 dark:bg-black text-gray-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed">
                <code>{CODE_EXAMPLES[activeTab]}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">API Pricing</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">Start free. Scale when you need it.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl p-6 border ${
                  tier.highlighted
                    ? "border-violet-600 bg-violet-50 dark:bg-violet-950 shadow-lg shadow-violet-600/10"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                }`}
              >
                {tier.highlighted && (
                  <div className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-2">MOST POPULAR</div>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{tier.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{tier.price}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{tier.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={tier.name === "Free" && !showKey ? generateKey : undefined}
                  className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                    tier.highlighted
                      ? "bg-violet-600 text-white hover:bg-violet-700"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rate Limits */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Rate Limits</h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
            <li>Free tier: 50 requests per day, resets at midnight UTC</li>
            <li>Max file size: 20MB per image</li>
            <li>Supported formats: PNG, JPG, JPEG, WebP</li>
            <li>Rate limit info is included in response headers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
