"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface ImageDimensions {
  width: number;
  height: number;
}

const PERCENTAGE_OPTIONS = [25, 50, 75, 100, 150, 200] as const;

export default function ResizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const aspectRatio = originalDimensions.width / (originalDimensions.height || 1);

  // Load image and extract dimensions
  const loadImage = useCallback((f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setOriginalUrl(url);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
      setPreviewUrl("");
    };
    img.src = url;
  }, []);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [originalUrl, previewUrl]);

  const handleFiles = useCallback(
    (files: File[]) => {
      const imageFile = files.find((f) => f.type.startsWith("image/"));
      if (imageFile) loadImage(imageFile);
    },
    [loadImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(Array.from(e.dataTransfer.files));
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(Array.from(e.target.files || []));
    },
    [handleFiles]
  );

  const handleWidthChange = (val: string) => {
    const w = Math.max(1, parseInt(val) || 1);
    setTargetWidth(w);
    if (lockAspect) {
      setTargetHeight(Math.round(w / aspectRatio));
    }
  };

  const handleHeightChange = (val: string) => {
    const h = Math.max(1, parseInt(val) || 1);
    setTargetHeight(h);
    if (lockAspect) {
      setTargetWidth(Math.round(h * aspectRatio));
    }
  };

  const applyPercentage = (pct: number) => {
    const w = Math.round(originalDimensions.width * (pct / 100));
    const h = Math.round(originalDimensions.height * (pct / 100));
    setTargetWidth(w);
    setTargetHeight(h);
  };

  const resizeImage = useCallback(() => {
    if (!imgRef.current || targetWidth < 1 || targetHeight < 1) return;
    setProcessing(true);

    // Use requestAnimationFrame to let the UI update before heavy canvas work
    requestAnimationFrame(() => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setProcessing(false);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imgRef.current!, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(blob));
          }
          setProcessing(false);
        },
        file?.type || "image/png",
        0.92
      );
    });
  }, [targetWidth, targetHeight, file, previewUrl]);

  const downloadImage = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    const ext = file?.name.split(".").pop() || "png";
    const baseName = file?.name.replace(/\.[^.]+$/, "") || "resized";
    a.download = `${baseName}-${targetWidth}x${targetHeight}.${ext}`;
    a.click();
  }, [previewUrl, file, targetWidth, targetHeight]);

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setOriginalUrl("");
    setPreviewUrl("");
    setOriginalDimensions({ width: 0, height: 0 });
    setTargetWidth(0);
    setTargetHeight(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden min-h-[calc(100vh-4rem)]">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950" />
          <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-violet-300/15 dark:bg-violet-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-indigo-300/15 dark:bg-indigo-600/5 rounded-full blur-3xl" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            {/* Title */}
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1]">
                Resize{" "}
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Image
                </span>
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Resize any image to exact dimensions. Fast, free, and entirely in your browser.
              </p>
            </div>

            {!file ? (
              /* ── Upload Zone ── */
              <div
                className={`mx-auto max-w-2xl rounded-3xl p-8 sm:p-10 cursor-pointer border-2 border-dashed transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 dark:shadow-none ${
                  dragActive
                    ? "border-violet-500 bg-violet-50/80 dark:bg-violet-950/50"
                    : "border-gray-200 dark:border-gray-700 hover:border-violet-400 hover:shadow-violet-200/30"
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleInputChange}
                />
                <div className="flex flex-col items-center gap-5">
                  {/* Upload icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <button
                    type="button"
                    className="px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-lg font-bold rounded-full hover:from-violet-700 hover:to-indigo-700 transition-all shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5"
                  >
                    Upload Image
                  </button>

                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    or drag and drop your image here
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    Supports PNG, JPEG, WebP
                  </p>
                </div>
              </div>
            ) : (
              /* ── Resize Interface ── */
              <div className="space-y-6">
                {/* Controls Card */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                  {/* Original dimensions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Original Size</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {originalDimensions.width} x {originalDimensions.height} px
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium"
                    >
                      Upload different image
                    </button>
                  </div>

                  {/* Width / Height inputs */}
                  <div className="flex flex-wrap items-end gap-4 mb-6">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={targetWidth}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      />
                    </div>

                    {/* Lock toggle */}
                    <button
                      onClick={() => setLockAspect(!lockAspect)}
                      className={`mb-1 p-2.5 rounded-xl border transition-all ${
                        lockAspect
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                      }`}
                      title={lockAspect ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                    >
                      {lockAspect ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={targetHeight}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      />
                    </div>
                  </div>

                  {/* Percentage presets */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Resize by Percentage
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PERCENTAGE_OPTIONS.map((pct) => {
                        const isActive =
                          targetWidth === Math.round(originalDimensions.width * (pct / 100)) &&
                          targetHeight === Math.round(originalDimensions.height * (pct / 100));
                        return (
                          <button
                            key={pct}
                            onClick={() => applyPercentage(pct)}
                            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                              isActive
                                ? "border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30"
                                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                            }`}
                          >
                            {pct}%
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* New dimensions summary + Resize button */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">New Size</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {targetWidth} x {targetHeight} px
                      </p>
                    </div>
                    <button
                      onClick={resizeImage}
                      disabled={processing}
                      className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-full hover:from-violet-700 hover:to-indigo-700 transition-all shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      {processing ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Resizing...
                        </span>
                      ) : (
                        "Resize Image"
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original */}
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Original</p>
                    <div className="relative rounded-xl overflow-hidden bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3C%2Fsvg%3E')]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={originalUrl}
                        alt="Original"
                        className="w-full h-auto max-h-[400px] object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                      {originalDimensions.width} x {originalDimensions.height} px
                    </p>
                  </div>

                  {/* Resized preview */}
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Resized Preview</p>
                    <div className="relative rounded-xl overflow-hidden bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3C%2Fsvg%3E')] min-h-[200px] flex items-center justify-center">
                      {previewUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={previewUrl}
                          alt="Resized"
                          className="w-full h-auto max-h-[400px] object-contain"
                        />
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 text-sm py-16">
                          Click &quot;Resize Image&quot; to generate preview
                        </p>
                      )}
                    </div>
                    {previewUrl && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                        {targetWidth} x {targetHeight} px
                      </p>
                    )}
                  </div>
                </div>

                {/* Download button */}
                {previewUrl && (
                  <div className="text-center">
                    <button
                      onClick={downloadImage}
                      className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-lg font-bold rounded-full hover:from-violet-700 hover:to-indigo-700 transition-all shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Resized Image
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
