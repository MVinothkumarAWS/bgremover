"use client";

import { useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HtmlToImagePage() {
  const [url, setUrl] = useState("");
  const [htmlCode, setHtmlCode] = useState(
    `<div style="padding: 40px; font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center;">\n  <h1 style="font-size: 48px; margin-bottom: 16px;">Hello World</h1>\n  <p style="font-size: 20px; opacity: 0.9;">Edit this HTML to create your image</p>\n</div>`
  );
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCapture = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const htmlToRender = htmlCode.trim();
      if (!htmlToRender) {
        throw new Error("Please enter some HTML code to render.");
      }

      // Build SVG with foreignObject containing the user's HTML
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;">
              ${htmlToRender}
            </div>
          </foreignObject>
        </svg>
      `;

      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(
            new Error(
              "Failed to render HTML. Make sure your HTML is valid and does not reference external resources (images, fonts, etc.) due to browser security restrictions."
            )
          );
        img.src = svgUrl;
      });

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not available.");

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context.");

      // Draw white background for JPEG (no transparency)
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);

      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, 0.95);
      setPreview(dataUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }, [htmlCode, width, height, format]);

  const handleFetchUrl = useCallback(async () => {
    if (!url.trim()) return;
    setError(
      "Direct URL screenshots are not possible from the browser due to CORS restrictions. Please copy the HTML source of the page and paste it into the editor below."
    );
  }, [url]);

  const handleDownload = useCallback(() => {
    if (!preview) return;
    const ext = format === "png" ? "png" : "jpg";
    const link = document.createElement("a");
    link.download = `html-capture-${Date.now()}.${ext}`;
    link.href = preview;
    link.click();
  }, [preview, format]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        {/* Hero */}
        <section className="relative pt-24 pb-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 dark:bg-violet-900/40 rounded-full text-sm font-medium text-violet-700 dark:text-violet-300 mb-6">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              HTML to Image Converter
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              Convert{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                HTML &amp; CSS
              </span>{" "}
              to Image
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Paste your HTML code below and export it as a high-quality PNG or
              JPG image. Everything runs entirely in your browser.
            </p>
          </div>
        </section>

        {/* Tool */}
        <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-24">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl shadow-violet-500/5 p-6 sm:p-8 space-y-8">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Website URL{" "}
                <span className="font-normal text-gray-400 dark:text-gray-500">
                  (optional)
                </span>
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
                <button
                  onClick={handleFetchUrl}
                  className="px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Fetch
                </button>
              </div>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Note: Due to browser security (CORS), direct URL screenshots are
                not supported. Please paste the HTML source code below instead.
              </p>
            </div>

            {/* HTML Editor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                HTML / CSS Code
              </label>
              <textarea
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                rows={14}
                spellCheck={false}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-y"
                placeholder="<div>Your HTML here...</div>"
              />
            </div>

            {/* Settings Row */}
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  min={100}
                  max={4096}
                  value={width}
                  onChange={(e) =>
                    setWidth(
                      Math.max(100, Math.min(4096, Number(e.target.value)))
                    )
                  }
                  className="w-28 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  min={100}
                  max={4096}
                  value={height}
                  onChange={(e) =>
                    setHeight(
                      Math.max(100, Math.min(4096, Number(e.target.value)))
                    )
                  }
                  className="w-28 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as "png" | "jpeg")}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPG</option>
                </select>
              </div>
              <button
                onClick={handleCapture}
                disabled={loading || !htmlCode.trim()}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Rendering...
                  </span>
                ) : (
                  "Capture"
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Hidden canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Preview */}
            {preview && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Preview
                  </h2>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download {format.toUpperCase()}
                  </button>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={preview}
                    alt="Rendered HTML"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                How it works
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    step: "1",
                    title: "Paste HTML",
                    desc: "Write or paste your HTML and inline CSS into the editor.",
                  },
                  {
                    step: "2",
                    title: "Render via SVG",
                    desc: "Your HTML is wrapped in an SVG foreignObject and rendered to a canvas.",
                  },
                  {
                    step: "3",
                    title: "Download",
                    desc: "Export the canvas as a PNG or JPG image file.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
