"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSharedImage } from "@/context/SharedImageContext";

interface SizePreset {
  label: string;
  size: number;
}

const SIZE_PRESETS: SizePreset[] = [
  { label: "Instagram", size: 320 },
  { label: "Facebook", size: 170 },
  { label: "Twitter/X", size: 400 },
  { label: "LinkedIn", size: 400 },
  { label: "YouTube", size: 800 },
  { label: "TikTok", size: 200 },
  { label: "WhatsApp", size: 500 },
];

type OutputShape = "circle" | "square";

export default function ProfilePicturePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedPreset, setSelectedPreset] = useState<string>("Twitter/X");
  const [customSize, setCustomSize] = useState(400);
  const [outputShape, setOutputShape] = useState<OutputShape>("circle");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const { sharedFile, setSharedImage } = useSharedImage();

  const PREVIEW_DISPLAY_SIZE = 300;

  const getOutputSize = (): number => {
    if (selectedPreset === "Custom") return customSize;
    const preset = SIZE_PRESETS.find((p) => p.label === selectedPreset);
    return preset?.size ?? 400;
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setSharedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      setPreviewUrl("");
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      const img = new Image();
      img.onload = () => setImageEl(img);
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, [setSharedImage]);

  useEffect(() => {
    if (sharedFile && !imageSrc) handleFile(sharedFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((f) => f.type.startsWith("image/"));
      if (imageFile) handleFile(imageFile);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const imageFile = files.find((f) => f.type.startsWith("image/"));
      if (imageFile) handleFile(imageFile);
    },
    [handleFile]
  );

  // Draw the preview canvas
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imageEl) return;

    const size = PREVIEW_DISPLAY_SIZE;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    // Save and clip to circle if needed
    ctx.save();
    if (outputShape === "circle") {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    // Calculate draw dimensions: fit the image so that the shorter side fills the circle
    const imgAspect = imageEl.naturalWidth / imageEl.naturalHeight;
    let drawW: number, drawH: number;
    if (imgAspect >= 1) {
      drawH = size * zoom;
      drawW = drawH * imgAspect;
    } else {
      drawW = size * zoom;
      drawH = drawW / imgAspect;
    }

    const drawX = (size - drawW) / 2 + offset.x;
    const drawY = (size - drawH) / 2 + offset.y;

    ctx.drawImage(imageEl, drawX, drawY, drawW, drawH);
    ctx.restore();

    // If circle shape, draw a darkened overlay outside the circle for visual cue
    if (outputShape === "circle") {
      // The clip already handled the image; draw a subtle ring border
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [imageEl, zoom, offset, outputShape]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Mouse/touch drag handlers for repositioning
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  // Generate final output and download
  const generateAndDownload = useCallback(() => {
    if (!imageEl) return;
    const outputSize = getOutputSize();
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, outputSize, outputSize);

    ctx.save();
    if (outputShape === "circle") {
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    const imgAspect = imageEl.naturalWidth / imageEl.naturalHeight;
    let drawW: number, drawH: number;
    if (imgAspect >= 1) {
      drawH = outputSize * zoom;
      drawW = drawH * imgAspect;
    } else {
      drawW = outputSize * zoom;
      drawH = drawW / imgAspect;
    }

    // Scale offset from preview size to output size
    const scale = outputSize / PREVIEW_DISPLAY_SIZE;
    const drawX = (outputSize - drawW) / 2 + offset.x * scale;
    const drawY = (outputSize - drawH) / 2 + offset.y * scale;

    ctx.drawImage(imageEl, drawX, drawY, drawW, drawH);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const presetLabel = selectedPreset === "Custom" ? "custom" : selectedPreset.toLowerCase().replace(/\//g, "-");
        a.download = `profile-${presetLabel}-${outputSize}x${outputSize}.png`;
        a.click();
        URL.revokeObjectURL(url);
      },
      "image/png"
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageEl, zoom, offset, outputShape, selectedPreset, customSize]);

  const handleReset = () => {
    setImageSrc(null);
    setImageEl(null);
    setPreviewUrl("");
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
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
                Profile Picture{" "}
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Maker
                </span>
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Create perfectly sized profile pictures for any platform. Crop, zoom, and download — all in your browser.
              </p>
            </div>

            {!imageEl ? (
              /* Upload Zone */
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
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleInputChange}
                />
                <div className="flex flex-col items-center gap-5">
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
                    Upload Photo
                  </button>

                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    or drag and drop your photo here
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    Supports PNG, JPEG, WebP
                  </p>
                </div>
              </div>
            ) : (
              /* Editor Interface */
              <div className="space-y-6">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                  {/* Top bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Output Size</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getOutputSize()} x {getOutputSize()} px
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium"
                    >
                      Upload different photo
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Preview Column */}
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Drag to reposition &middot; Scroll or use slider to zoom
                      </p>

                      {/* Circular preview area */}
                      <div
                        ref={previewContainerRef}
                        className="relative select-none"
                        style={{ width: PREVIEW_DISPLAY_SIZE, height: PREVIEW_DISPLAY_SIZE }}
                      >
                        {/* Checkerboard background for transparency */}
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            backgroundImage:
                              "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%)",
                            backgroundSize: "16px 16px",
                            clipPath: outputShape === "circle" ? "circle(50%)" : "none",
                            borderRadius: outputShape === "square" ? "0.75rem" : "50%",
                          }}
                        />
                        <canvas
                          ref={previewCanvasRef}
                          width={PREVIEW_DISPLAY_SIZE}
                          height={PREVIEW_DISPLAY_SIZE}
                          className="relative cursor-grab active:cursor-grabbing"
                          style={{
                            borderRadius: outputShape === "circle" ? "50%" : "0.75rem",
                            width: PREVIEW_DISPLAY_SIZE,
                            height: PREVIEW_DISPLAY_SIZE,
                          }}
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onPointerCancel={handlePointerUp}
                          onWheel={(e) => {
                            e.preventDefault();
                            setZoom((prev) =>
                              Math.min(3, Math.max(1, prev - e.deltaY * 0.002))
                            );
                          }}
                        />
                        {/* Overlay ring */}
                        {outputShape === "circle" && (
                          <div
                            className="absolute inset-0 pointer-events-none rounded-full ring-2 ring-violet-500/50"
                            style={{ width: PREVIEW_DISPLAY_SIZE, height: PREVIEW_DISPLAY_SIZE }}
                          />
                        )}
                      </div>

                      {/* Zoom slider */}
                      <div className="w-full max-w-xs">
                        <label className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span>Zoom</span>
                          <span className="font-mono">{zoom.toFixed(2)}x</span>
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.01}
                          value={zoom}
                          onChange={(e) => setZoom(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-violet-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                          <span>1x</span>
                          <span>2x</span>
                          <span>3x</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls Column */}
                    <div className="space-y-6">
                      {/* Size Presets */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Platform Size
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {SIZE_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              onClick={() => setSelectedPreset(preset.label)}
                              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                selectedPreset === preset.label
                                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 shadow-sm"
                                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-700"
                              }`}
                            >
                              <span className="block">{preset.label}</span>
                              <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {preset.size}x{preset.size}
                              </span>
                            </button>
                          ))}
                          {/* Custom */}
                          <button
                            onClick={() => setSelectedPreset("Custom")}
                            className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                              selectedPreset === "Custom"
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 shadow-sm"
                                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-700"
                            }`}
                          >
                            <span className="block">Custom</span>
                            <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              any size
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Custom size input */}
                      {selectedPreset === "Custom" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Custom Size (px)
                          </label>
                          <input
                            type="number"
                            min={16}
                            max={4096}
                            value={customSize}
                            onChange={(e) =>
                              setCustomSize(Math.max(16, Math.min(4096, parseInt(e.target.value) || 16)))
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                          />
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Output will be {customSize}x{customSize} px
                          </p>
                        </div>
                      )}

                      {/* Output Shape */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Output Shape
                        </label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setOutputShape("circle")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                              outputShape === "circle"
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 shadow-sm"
                                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-700"
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full border-2 border-current" />
                            Circle
                          </button>
                          <button
                            onClick={() => setOutputShape("square")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                              outputShape === "square"
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 shadow-sm"
                                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-700"
                            }`}
                          >
                            <div className="w-5 h-5 rounded-sm border-2 border-current" />
                            Square
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {outputShape === "circle"
                            ? "Circle output uses transparent PNG background"
                            : "Square output saves as a standard image"}
                        </p>
                      </div>

                      {/* Reset position */}
                      <button
                        onClick={() => {
                          setZoom(1);
                          setOffset({ x: 0, y: 0 });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:border-violet-300 dark:hover:border-violet-700 transition-all"
                      >
                        Reset Position & Zoom
                      </button>

                      {/* Download Button */}
                      <button
                        onClick={generateAndDownload}
                        className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-lg font-bold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Download {getOutputSize()}x{getOutputSize()} PNG
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info section */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Platform Size Guide
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SIZE_PRESETS.map((preset) => (
                      <div
                        key={preset.label}
                        className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {preset.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {preset.size}x{preset.size}px
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
