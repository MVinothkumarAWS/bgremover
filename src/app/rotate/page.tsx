"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RotatePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // Draw the transformed image on the canvas whenever state changes
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => {
      originalImageRef.current = img;
      drawCanvas(img, rotation, flipH, flipV);
    };
    // Only create a new image if we don't already have one loaded with this src
    if (originalImageRef.current?.src === imageSrc) {
      drawCanvas(originalImageRef.current, rotation, flipH, flipV);
    } else {
      img.src = imageSrc;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, rotation, flipH, flipV]);

  function drawCanvas(
    img: HTMLImageElement,
    angleDeg: number,
    hFlip: boolean,
    vFlip: boolean
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rad = (angleDeg * Math.PI) / 180;
    const absCos = Math.abs(Math.cos(rad));
    const absSin = Math.abs(Math.sin(rad));

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const newW = Math.ceil(w * absCos + h * absSin);
    const newH = Math.ceil(w * absSin + h * absCos);

    canvas.width = newW;
    canvas.height = newH;

    ctx.clearRect(0, 0, newW, newH);
    ctx.save();
    ctx.translate(newW / 2, newH / 2);
    ctx.rotate(rad);
    ctx.scale(hFlip ? -1 : 1, vFlip ? -1 : 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
    const link = document.createElement("a");
    link.download = `rotated-${fileName}`;
    link.href = canvas.toDataURL(mime, 0.95);
    link.click();
  }

  function handleReset() {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  }

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-white dark:bg-gray-950">
        {/* Hero / Upload Zone */}
        {!imageSrc && (
          <section className="relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />

            <div className="relative max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Free &middot; No uploads &middot; 100% in-browser
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
                <span className="text-gray-900 dark:text-white">Rotate </span>
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  IMAGE
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
                Rotate, flip, and adjust the angle of any image instantly.
                Everything runs in your browser -- your files never leave your
                device.
              </p>

              {/* Upload zone */}
              <div
                className={`relative max-w-xl mx-auto border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer ${
                  dragActive
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02]"
                    : "border-gray-300 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 bg-white/60 dark:bg-gray-900/60"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleInputChange}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-semibold text-lg">
                      Drop your image here or{" "}
                      <span className="text-violet-600 dark:text-violet-400">
                        browse
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      PNG, JPG, WebP up to 50 MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Editor */}
        {imageSrc && (
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-white to-indigo-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />

            <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-16">
              {/* Top bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Rotate &amp; Flip
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                    {fileName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setImageSrc(null);
                    setFileName("");
                    handleReset();
                  }}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Upload a different image
                </button>
              </div>

              <div className="grid lg:grid-cols-[1fr_320px] gap-8">
                {/* Preview */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex items-center justify-center min-h-[400px] p-4">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    style={{ imageRendering: "auto" }}
                  />
                </div>

                {/* Controls */}
                <div className="space-y-6">
                  {/* Quick Rotate */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Quick Rotate
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 transition-all text-gray-700 dark:text-gray-300 hover:text-violet-700 dark:hover:text-violet-300"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h1.586a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20M3 10v4a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-6"
                          />
                        </svg>
                        <span className="text-xs font-medium">90° Left</span>
                      </button>
                      <button
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 transition-all text-gray-700 dark:text-gray-300 hover:text-violet-700 dark:hover:text-violet-300"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 10h-1.586a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4M21 10v4a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h6"
                          />
                        </svg>
                        <span className="text-xs font-medium">90° Right</span>
                      </button>
                      <button
                        onClick={() => setRotation((r) => (r + 180) % 360)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 transition-all text-gray-700 dark:text-gray-300 hover:text-violet-700 dark:hover:text-violet-300"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span className="text-xs font-medium">180°</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom Angle */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Custom Angle
                    </h3>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="flex-1 accent-violet-600 h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 cursor-pointer"
                      />
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white w-12 text-right">
                        {rotation}°
                      </span>
                    </div>
                  </div>

                  {/* Flip */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Flip
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setFlipH((v) => !v)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                          flipH
                            ? "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-600 text-violet-700 dark:text-violet-300"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-600"
                        }`}
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
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                        Horizontal
                      </button>
                      <button
                        onClick={() => setFlipV((v) => !v)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                          flipV
                            ? "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-600 text-violet-700 dark:text-violet-300"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-600"
                        }`}
                      >
                        <svg
                          className="w-4 h-4 rotate-90"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                        Vertical
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] transition-all"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
