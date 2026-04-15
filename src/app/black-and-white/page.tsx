"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FilterPreset {
  name: string;
  label: string;
  apply: (
    src: ImageData,
    intensity: number
  ) => ImageData;
}

/* ------------------------------------------------------------------ */
/*  Pixel manipulation helpers                                         */
/* ------------------------------------------------------------------ */

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function lerpChannel(original: number, filtered: number, t: number): number {
  return clamp(original + (filtered - original) * t);
}

function applyGrayscale(src: ImageData, intensity: number): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = lerpChannel(d[i], gray, intensity);
    d[i + 1] = lerpChannel(d[i + 1], gray, intensity);
    d[i + 2] = lerpChannel(d[i + 2], gray, intensity);
  }
  return out;
}

function applyHighContrastBW(src: ImageData, intensity: number): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const bw = gray > 128 ? 255 : 0;
    d[i] = lerpChannel(d[i], bw, intensity);
    d[i + 1] = lerpChannel(d[i + 1], bw, intensity);
    d[i + 2] = lerpChannel(d[i + 2], bw, intensity);
  }
  return out;
}

function applySepia(src: ImageData, intensity: number): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const sr = clamp(r * 0.393 + g * 0.769 + b * 0.189);
    const sg = clamp(r * 0.349 + g * 0.686 + b * 0.168);
    const sb = clamp(r * 0.272 + g * 0.534 + b * 0.131);
    d[i] = lerpChannel(r, sr, intensity);
    d[i + 1] = lerpChannel(g, sg, intensity);
    d[i + 2] = lerpChannel(b, sb, intensity);
  }
  return out;
}

function applyVintage(src: ImageData, intensity: number): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    // Sepia + reduced saturation + slight warmth
    const sr = clamp(r * 0.393 + g * 0.769 + b * 0.189);
    const sg = clamp(r * 0.349 + g * 0.686 + b * 0.168);
    const sb = clamp(r * 0.272 + g * 0.534 + b * 0.131);
    const vr = clamp(sr * 1.05 + 10);
    const vg = clamp(sg * 0.95);
    const vb = clamp(sb * 0.85);
    d[i] = lerpChannel(r, vr, intensity);
    d[i + 1] = lerpChannel(g, vg, intensity);
    d[i + 2] = lerpChannel(b, vb, intensity);
  }
  return out;
}

function applyWarmTone(src: ImageData, intensity: number): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    d[i] = lerpChannel(r, clamp(r * 1.1 + 15), intensity);
    d[i + 1] = lerpChannel(g, clamp(g * 1.02 + 5), intensity);
    d[i + 2] = lerpChannel(b, clamp(b * 0.9 - 10), intensity);
  }
  return out;
}

function applyCoolTone(src: ImageData, intensity: number): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    d[i] = lerpChannel(r, clamp(r * 0.9 - 10), intensity);
    d[i + 1] = lerpChannel(g, clamp(g * 1.02 + 5), intensity);
    d[i + 2] = lerpChannel(b, clamp(b * 1.15 + 20), intensity);
  }
  return out;
}

function applyDuotone(src: ImageData, intensity: number): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const d = out.data;
  // Purple shadow, orange highlight
  const shadow = [80, 40, 120];  // purple
  const highlight = [255, 160, 50]; // orange
  for (let i = 0; i < d.length; i += 4) {
    const gray = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    const dr = shadow[0] + (highlight[0] - shadow[0]) * gray;
    const dg = shadow[1] + (highlight[1] - shadow[1]) * gray;
    const db = shadow[2] + (highlight[2] - shadow[2]) * gray;
    d[i] = lerpChannel(d[i], dr, intensity);
    d[i + 1] = lerpChannel(d[i + 1], dg, intensity);
    d[i + 2] = lerpChannel(d[i + 2], db, intensity);
  }
  return out;
}

function applyOriginal(src: ImageData, _intensity: number): ImageData {
  return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
}

/* ------------------------------------------------------------------ */
/*  Presets                                                            */
/* ------------------------------------------------------------------ */

const FILTER_PRESETS: FilterPreset[] = [
  { name: "original",        label: "Original",           apply: applyOriginal },
  { name: "grayscale",       label: "Grayscale",          apply: applyGrayscale },
  { name: "high-contrast-bw", label: "High Contrast B&W", apply: applyHighContrastBW },
  { name: "sepia",           label: "Sepia",              apply: applySepia },
  { name: "vintage",         label: "Vintage",            apply: applyVintage },
  { name: "warm",            label: "Warm Tone",          apply: applyWarmTone },
  { name: "cool",            label: "Cool Tone",          apply: applyCoolTone },
  { name: "duotone",         label: "Duotone",            apply: applyDuotone },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BlackAndWhitePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("original");
  const [intensity, setIntensity] = useState(100);
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpg">("png");
  const [isDragOver, setIsDragOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load image onto canvas and store original data
  const loadImageToCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setOriginalImageData(data);
    setImgElement(img);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setImageSrc(src);
        setActiveFilter("original");
        setIntensity(100);
        const img = new Image();
        img.onload = () => loadImageToCanvas(img);
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [loadImageToCanvas]
  );

  // Apply filter whenever activeFilter or intensity changes
  useEffect(() => {
    if (!originalImageData || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const preset = FILTER_PRESETS.find((p) => p.name === activeFilter);
    if (!preset) return;
    const filtered = preset.apply(originalImageData, intensity / 100);
    ctx.putImageData(filtered, 0, 0);
  }, [activeFilter, intensity, originalImageData]);

  // Generate thumbnail for preset preview
  const generateThumbnail = useCallback(
    (preset: FilterPreset): string => {
      if (!originalImageData) return "";
      const size = 80;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      // Draw scaled original first
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = originalImageData.width;
      tmpCanvas.height = originalImageData.height;
      const tmpCtx = tmpCanvas.getContext("2d")!;
      tmpCtx.putImageData(originalImageData, 0, 0);

      // Scale to thumbnail
      ctx.drawImage(tmpCanvas, 0, 0, size, size);
      const thumbData = ctx.getImageData(0, 0, size, size);
      const filtered = preset.apply(thumbData, 1);
      ctx.putImageData(filtered, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.7);
    },
    [originalImageData]
  );

  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!originalImageData) return;
    const thumbs: Record<string, string> = {};
    for (const preset of FILTER_PRESETS) {
      thumbs[preset.name] = generateThumbnail(preset);
    }
    setThumbnails(thumbs);
  }, [originalImageData, generateThumbnail]);

  // Download
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = downloadFormat === "png" ? "image/png" : "image/jpeg";
    const ext = downloadFormat === "png" ? "png" : "jpg";
    const link = document.createElement("a");
    link.download = `filtered-image.${ext}`;
    link.href = canvas.toDataURL(mime, 0.92);
    link.click();
  }, [downloadFormat]);

  // Drag and drop
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-24 pb-16 px-4">
        {/* Hero */}
        <section className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            Color Filters
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Black &amp; White / Color Filters
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Apply stunning filters to your images. From classic grayscale to creative duotone effects.
          </p>
        </section>

        {/* Upload area */}
        {!imageSrc && (
          <section className="max-w-2xl mx-auto">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all bg-white dark:bg-gray-900 shadow-xl shadow-violet-500/5 ${
                isDragOver
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                  : "border-gray-300 dark:border-gray-700 hover:border-violet-400"
              }`}
            >
              <svg className="w-12 h-12 mx-auto mb-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Drop an image here or <span className="text-violet-600 dark:text-violet-400 underline">browse</span>
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">PNG, JPG, WEBP</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          </section>
        )}

        {/* Workspace */}
        {imageSrc && (
          <section className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Canvas preview */}
              <div className="flex-1">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Live Preview
                    </h2>
                    <button
                      onClick={() => {
                        setImageSrc(null);
                        setOriginalImageData(null);
                        setImgElement(null);
                        setActiveFilter("original");
                        setIntensity(100);
                        setThumbnails({});
                      }}
                      className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Upload New
                    </button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    className="w-full max-h-[520px] object-contain rounded-xl"
                    style={{ imageRendering: "auto" }}
                  />
                </div>
              </div>

              {/* Sidebar controls */}
              <div className="w-full lg:w-96 space-y-6">
                {/* Filter presets */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Filter Presets
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {FILTER_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setActiveFilter(preset.name)}
                        className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                          activeFilter === preset.name
                            ? "bg-violet-100 dark:bg-violet-900/40 ring-2 ring-violet-500"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {thumbnails[preset.name] ? (
                          <img
                            src={thumbnails[preset.name]}
                            alt={preset.label}
                            className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                        )}
                        <span
                          className={`text-[10px] font-medium text-center leading-tight ${
                            activeFilter === preset.name
                              ? "text-violet-700 dark:text-violet-300"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensity slider */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Intensity
                    </h3>
                    <span className="text-sm font-mono text-violet-600 dark:text-violet-400">
                      {intensity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
                  />
                  <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Download */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Download
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setDownloadFormat("png")}
                      className={`flex-1 py-1.5 rounded-xl text-sm font-medium transition-all ${
                        downloadFormat === "png"
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                          : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      PNG
                    </button>
                    <button
                      onClick={() => setDownloadFormat("jpg")}
                      className={`flex-1 py-1.5 rounded-xl text-sm font-medium transition-all ${
                        downloadFormat === "jpg"
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                          : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      JPG
                    </button>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
                  >
                    Download Filtered Image
                  </button>
                </div>

                {/* Image info */}
                {imgElement && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-5">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Image Info
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-500">Dimensions</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {imgElement.naturalWidth} &times; {imgElement.naturalHeight}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-500">Active Filter</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {FILTER_PRESETS.find((p) => p.name === activeFilter)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-500">Intensity</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {intensity}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <canvas ref={thumbCanvasRef} className="hidden" />
      </main>
      <Footer />
    </>
  );
}
