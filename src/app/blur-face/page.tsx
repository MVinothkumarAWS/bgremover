"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BlurRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

function applyBoxBlur(
  imageData: ImageData,
  radius: number
): ImageData {
  const { width, height, data } = imageData;
  const out = new Uint8ClampedArray(data);

  // Two-pass separable box blur for performance
  const temp = new Uint8ClampedArray(data);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        if (nx >= 0 && nx < width) {
          const idx = (y * width + nx) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
          count++;
        }
      }
      const idx = (y * width + x) * 4;
      temp[idx] = r / count;
      temp[idx + 1] = g / count;
      temp[idx + 2] = b / count;
      temp[idx + 3] = a / count;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny >= 0 && ny < height) {
          const idx = (ny * width + x) * 4;
          r += temp[idx];
          g += temp[idx + 1];
          b += temp[idx + 2];
          a += temp[idx + 3];
          count++;
        }
      }
      const idx = (y * width + x) * 4;
      out[idx] = r / count;
      out[idx + 1] = g / count;
      out[idx + 2] = b / count;
      out[idx + 3] = a / count;
    }
  }

  return new ImageData(out, width, height);
}

export default function BlurFacePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [regions, setRegions] = useState<BlurRegion[]>([]);
  const [blurRadius, setBlurRadius] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<BlurRegion | null>(null);
  const [blurApplied, setBlurApplied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drawImageToCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    overlay.width = img.naturalWidth;
    overlay.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
  }, []);

  const drawOverlay = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw existing regions
    for (const region of regions) {
      ctx.strokeStyle = "rgba(139, 92, 246, 0.8)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(region.x, region.y, region.w, region.h);
      ctx.fillStyle = "rgba(139, 92, 246, 0.15)";
      ctx.fillRect(region.x, region.y, region.w, region.h);
    }

    // Draw current drawing rect
    if (currentRect) {
      ctx.strokeStyle = "rgba(99, 102, 241, 0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
    }

    ctx.setLineDash([]);
  }, [regions, currentRect]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      setRegions([]);
      setBlurApplied(false);

      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        drawImageToCanvas(img);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return { x: 0, y: 0 };
    const rect = overlay.getBoundingClientRect();
    const scaleX = overlay.width / rect.width;
    const scaleY = overlay.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (blurApplied) return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setDrawStart(coords);
    setCurrentRect({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;
    const coords = getCanvasCoords(e);
    setCurrentRect({
      x: Math.min(drawStart.x, coords.x),
      y: Math.min(drawStart.y, coords.y),
      w: Math.abs(coords.x - drawStart.x),
      h: Math.abs(coords.y - drawStart.y),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect) {
      setIsDrawing(false);
      setDrawStart(null);
      setCurrentRect(null);
      return;
    }
    // Only add region if it has meaningful size
    if (currentRect.w > 5 && currentRect.h > 5) {
      setRegions((prev) => [...prev, currentRect]);
    }
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentRect(null);
  };

  const deleteRegion = (index: number) => {
    setRegions((prev) => prev.filter((_, i) => i !== index));
  };

  const undoLastRegion = () => {
    setRegions((prev) => prev.slice(0, -1));
  };

  const clearAllRegions = () => {
    setRegions([]);
  };

  const applyBlur = () => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img || regions.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Redraw original image first
    ctx.drawImage(img, 0, 0);

    // Apply blur to each region
    for (const region of regions) {
      const rx = Math.max(0, Math.round(region.x));
      const ry = Math.max(0, Math.round(region.y));
      const rw = Math.min(Math.round(region.w), canvas.width - rx);
      const rh = Math.min(Math.round(region.h), canvas.height - ry);

      if (rw <= 0 || rh <= 0) continue;

      const imageData = ctx.getImageData(rx, ry, rw, rh);

      // Apply multiple passes for stronger blur
      const passes = Math.ceil(blurRadius / 10);
      const passRadius = Math.ceil(blurRadius / passes);
      let blurred = imageData;
      for (let p = 0; p < passes; p++) {
        blurred = applyBoxBlur(blurred, passRadius);
      }

      ctx.putImageData(blurred, rx, ry);
    }

    setBlurApplied(true);
    // Clear overlay
    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const octx = overlay.getContext("2d");
      octx?.clearRect(0, 0, overlay.width, overlay.height);
    }
  };

  const resetImage = () => {
    const img = originalImageRef.current;
    if (!img) return;
    drawImageToCanvas(img);
    setRegions([]);
    setBlurApplied(false);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "blurred-image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        {/* Hero / Upload Zone */}
        {!imageSrc ? (
          <section className="pt-24 pb-20 px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Privacy Tool
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Blur Face
                </span>{" "}
                <span className="text-gray-900 dark:text-white">& Regions</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto">
                Protect privacy by blurring faces or any region in your images.
                Draw rectangles over sensitive areas and apply a smooth blur effect — all processed locally in your browser.
              </p>

              {/* Upload Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative mx-auto max-w-lg rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all duration-300 ${
                  dragOver
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02]"
                    : "border-gray-300 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 bg-white dark:bg-gray-800/50"
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
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Drop your image here or{" "}
                      <span className="text-violet-600 dark:text-violet-400">browse</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      PNG, JPG, WebP supported
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Editor */
          <section className="pt-20 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Canvas Area */}
                <div className="flex-1 min-w-0">
                  <div className="rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {blurApplied ? "Blur Applied" : "Draw to Blur"}
                      </h2>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {blurApplied
                          ? "Download your image or reset to start over"
                          : "Click and drag to select regions to blur"}
                      </span>
                    </div>
                    <div className="relative bg-gray-100 dark:bg-gray-900/50 flex items-center justify-center p-4">
                      <div className="relative inline-block max-w-full">
                        <canvas
                          ref={canvasRef}
                          className="max-w-full h-auto rounded-lg"
                          style={{ display: "block" }}
                        />
                        <canvas
                          ref={overlayCanvasRef}
                          className="absolute top-0 left-0 max-w-full h-auto rounded-lg"
                          style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            cursor: blurApplied ? "default" : "crosshair",
                          }}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls Panel */}
                <div className="lg:w-80 flex-shrink-0">
                  <div className="rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 shadow-xl p-5 space-y-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Controls</h3>

                    {/* Blur Intensity Slider */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Blur Intensity: {blurRadius}px
                      </label>
                      <input
                        type="range"
                        min={5}
                        max={50}
                        value={blurRadius}
                        onChange={(e) => setBlurRadius(Number(e.target.value))}
                        disabled={blurApplied}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>5px</span>
                        <span>50px</span>
                      </div>
                    </div>

                    {/* Blur Regions List */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Blur Regions ({regions.length})
                        </span>
                        {regions.length > 0 && !blurApplied && (
                          <button
                            onClick={clearAllRegions}
                            className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      {regions.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                          No regions selected yet. Draw on the image to add blur areas.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {regions.map((region, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2"
                            >
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                Region {i + 1}{" "}
                                <span className="text-gray-400">
                                  ({Math.round(region.w)}x{Math.round(region.h)})
                                </span>
                              </span>
                              {!blurApplied && (
                                <button
                                  onClick={() => deleteRegion(i)}
                                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                  title="Delete region"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                      {!blurApplied && (
                        <>
                          <button
                            onClick={undoLastRegion}
                            disabled={regions.length === 0}
                            className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Undo Last Region
                          </button>
                          <button
                            onClick={applyBlur}
                            disabled={regions.length === 0}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                          >
                            Apply Blur
                          </button>
                        </>
                      )}

                      {blurApplied && (
                        <>
                          <button
                            onClick={downloadImage}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all"
                          >
                            Download Image
                          </button>
                          <button
                            onClick={resetImage}
                            className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            Reset & Start Over
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setImageSrc(null);
                          setRegions([]);
                          setBlurApplied(false);
                          originalImageRef.current = null;
                        }}
                        className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        Upload New Image
                      </button>
                    </div>
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
