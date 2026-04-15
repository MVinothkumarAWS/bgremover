"use client";

import { useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type ScaleFactor = 2 | 4;

export default function UpscalePage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [scaleFactor, setScaleFactor] = useState<ScaleFactor>(2);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalImage(dataUrl);
      setUpscaledImage(null);
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUpscale = useCallback(() => {
    if (!originalImage || !originalDimensions) return;
    setProcessing(true);
    setUpscaledImage(null);

    // Use requestAnimationFrame to let the spinner render before heavy work
    requestAnimationFrame(() => {
      setTimeout(() => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) {
            setProcessing(false);
            return;
          }

          const targetWidth = img.width * scaleFactor;
          const targetHeight = img.height * scaleFactor;

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setProcessing(false);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          const result = canvas.toDataURL("image/png");
          setUpscaledImage(result);
          setProcessing(false);
        };
        img.src = originalImage;
      }, 50);
    });
  }, [originalImage, originalDimensions, scaleFactor]);

  const handleDownload = useCallback(() => {
    if (!upscaledImage) return;
    const a = document.createElement("a");
    a.href = upscaledImage;
    a.download = `upscaled-${scaleFactor}x.png`;
    a.click();
  }, [upscaledImage, scaleFactor]);

  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setUpscaledImage(null);
    setOriginalDimensions(null);
    setScaleFactor(2);
    setProcessing(false);
  }, []);

  const outputDimensions = originalDimensions
    ? {
        width: originalDimensions.width * scaleFactor,
        height: originalDimensions.height * scaleFactor,
      }
    : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950">
        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hero Section */}
        <section className="pt-28 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              AI-Powered Upscaling
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Upscale Your{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Images
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Enlarge images up to 4x their original size with high-quality smoothing. Fast, free, and entirely in your browser.
            </p>
          </div>
        </section>

        {/* Upload / Editor Section */}
        <section className="pb-20 px-4">
          <div className="max-w-5xl mx-auto">
            {!originalImage ? (
              /* Upload Zone */
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-12 md:p-20 text-center ${
                  dragOver
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02]"
                    : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-900/10"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Drop your image here
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  or click to browse — PNG, JPG, WebP supported
                </p>
              </div>
            ) : (
              /* Upscale Interface */
              <div className="space-y-6">
                {/* Controls Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Scale Factor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Scale Factor
                      </label>
                      <div className="flex gap-2">
                        {([2, 4] as ScaleFactor[]).map((factor) => (
                          <button
                            key={factor}
                            onClick={() => {
                              setScaleFactor(factor);
                              setUpscaledImage(null);
                            }}
                            disabled={processing}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              scaleFactor === factor
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                          >
                            {factor}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dimensions Display */}
                    <div className="flex items-center gap-4">
                      {originalDimensions && (
                        <>
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Original</p>
                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                              {originalDimensions.width} x {originalDimensions.height}
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-violet-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          {outputDimensions && (
                            <div className="text-center">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Output</p>
                              <p className="text-sm font-mono font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent bg-violet-50 dark:bg-violet-900/30 px-3 py-1.5 rounded-lg">
                                {outputDimensions.width} x {outputDimensions.height}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleUpscale}
                        disabled={processing}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            Upscale
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleReset}
                        disabled={processing}
                        className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Before / After Comparison */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Original</span>
                      {originalDimensions && (
                        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {originalDimensions.width}x{originalDimensions.height}
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=')] min-h-[300px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={originalImage}
                        alt="Original"
                        className="max-w-full max-h-[400px] object-contain rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Upscaled */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upscaled</span>
                      {upscaledImage && outputDimensions && (
                        <span className="ml-auto text-xs font-mono bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                          {outputDimensions.width}x{outputDimensions.height}
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=')] min-h-[300px]">
                      {processing ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 rounded-full border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400 animate-spin" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">Upscaling image...</p>
                        </div>
                      ) : upscaledImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={upscaledImage}
                          alt="Upscaled"
                          className="max-w-full max-h-[400px] object-contain rounded-lg"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 py-12">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            Choose a scale and click Upscale
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                {upscaledImage && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Upscaled Image
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
