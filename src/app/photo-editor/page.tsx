"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Tab = "adjust" | "filters" | "transform";
type DownloadFormat = "png" | "jpeg" | "webp";

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  blur: number;
}

interface Transform {
  rotation: number;   // degrees, multiples of 90 via buttons + free slider
  flipH: boolean;
  flipV: boolean;
  freeRotation: number; // -180 to 180
}

interface PresetFilter {
  name: string;
  filter: string;       // CSS filter string
  label: string;
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  blur: 0,
};

const DEFAULT_TRANSFORM: Transform = {
  rotation: 0,
  flipH: false,
  flipV: false,
  freeRotation: 0,
};

/* ------------------------------------------------------------------ */
/*  Preset filters                                                     */
/* ------------------------------------------------------------------ */

const PRESET_FILTERS: PresetFilter[] = [
  { name: "original",  label: "Original",   filter: "none" },
  { name: "grayscale", label: "Grayscale",  filter: "grayscale(1)" },
  { name: "sepia",     label: "Sepia",      filter: "sepia(1)" },
  { name: "vintage",   label: "Vintage",    filter: "sepia(0.4) contrast(1.1) brightness(1.1) saturate(0.9)" },
  { name: "cool",      label: "Cool",       filter: "saturate(1.3) hue-rotate(20deg) brightness(1.05)" },
  { name: "warm",      label: "Warm",       filter: "saturate(1.4) sepia(0.25) brightness(1.05)" },
  { name: "dramatic",  label: "Dramatic",   filter: "contrast(1.5) saturate(1.3) brightness(0.9)" },
  { name: "fade",      label: "Fade",       filter: "saturate(0.6) brightness(1.15) contrast(0.85)" },
  { name: "noir",      label: "Noir",       filter: "grayscale(1) contrast(1.4) brightness(0.9)" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Build a CSS filter string from adjustments + active preset */
function buildFilterString(adj: Adjustments, preset: string): string {
  const parts: string[] = [];

  // Preset first (may set base values)
  if (preset !== "none") parts.push(preset);

  // Map slider ranges to CSS filter values
  // brightness: -100..100 → 0..2
  parts.push(`brightness(${1 + adj.brightness / 100})`);
  // contrast: -100..100 → 0..2
  parts.push(`contrast(${1 + adj.contrast / 100})`);
  // saturation: -100..100 → 0..2
  parts.push(`saturate(${1 + adj.saturation / 100})`);
  // blur
  if (adj.blur > 0) parts.push(`blur(${adj.blur}px)`);

  return parts.join(" ");
}

/* ------------------------------------------------------------------ */
/*  Slider component                                                   */
/* ------------------------------------------------------------------ */

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
        <span className="text-violet-600 dark:text-violet-400 tabular-nums w-12 text-right">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-violet-600 bg-gray-200 dark:bg-gray-700"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function PhotoEditorPage() {
  /* Upload state */
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Editor state */
  const [activeTab, setActiveTab] = useState<Tab>("adjust");
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [activePreset, setActivePreset] = useState<string>("none");
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("png");

  /* Canvas refs */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImage = useRef<HTMLImageElement | null>(null);
  const [imageReady, setImageReady] = useState(false);

  /* Thumbnail canvas refs for filter previews */
  const thumbRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  /* ---------------------------------------------------------------- */
  /*  File handling                                                     */
  /* ---------------------------------------------------------------- */

  const loadImage = useCallback((file: File) => {
    setImageFile(file);
    setImageReady(false);
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    const img = new Image();
    img.onload = () => {
      originalImage.current = img;
      setImageReady(true);
    };
    img.src = url;
  }, []);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (arr.length > 0) loadImage(arr[0]);
    },
    [loadImage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const resetAll = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActivePreset("none");
    setTransform(DEFAULT_TRANSFORM);
    setActiveTab("adjust");
  }, []);

  const resetUpload = useCallback(() => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageFile(null);
    setImageSrc(null);
    setImageReady(false);
    originalImage.current = null;
    resetAll();
    if (inputRef.current) inputRef.current.value = "";
  }, [imageSrc, resetAll]);

  /* ---------------------------------------------------------------- */
  /*  Canvas rendering                                                  */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const img = originalImage.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const totalRotation = transform.rotation + transform.freeRotation;
    const radians = (totalRotation * Math.PI) / 180;
    const isOrthogonal = totalRotation % 180 !== 0 && totalRotation % 90 === 0;

    const w = isOrthogonal ? img.height : img.width;
    const h = isOrthogonal ? img.width : img.height;

    // If free rotation, we need a larger canvas to avoid clipping
    const absCos = Math.abs(Math.cos(radians));
    const absSin = Math.abs(Math.sin(radians));
    const canvasW = Math.ceil(img.width * absCos + img.height * absSin);
    const canvasH = Math.ceil(img.width * absSin + img.height * absCos);

    canvas.width = canvasW;
    canvas.height = canvasH;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // Apply CSS filter
    const filterStr = buildFilterString(adjustments, activePreset);
    ctx.filter = filterStr;

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate(radians);
    if (transform.flipH) ctx.scale(-1, 1);
    if (transform.flipV) ctx.scale(1, -1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Sharpness is simulated with a second pass of slight contrast on an overlay
    // (True unsharp-mask requires pixel manipulation; we approximate with a slight contrast boost)
    if (adjustments.sharpness > 0) {
      const strength = 1 + adjustments.sharpness / 200; // subtle
      ctx.filter = `contrast(${strength})`;
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = adjustments.sharpness / 200;
      ctx.drawImage(canvas, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.filter = "none";
    }
  }, [adjustments, activePreset, transform, imageReady]);

  /* ---------------------------------------------------------------- */
  /*  Thumbnail rendering for filter presets                           */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const img = originalImage.current;
    if (!img) return;

    const THUMB = 80;
    PRESET_FILTERS.forEach((pf) => {
      const tc = thumbRefs.current.get(pf.name);
      if (!tc) return;
      const tCtx = tc.getContext("2d");
      if (!tCtx) return;

      const aspect = img.width / img.height;
      let tw = THUMB;
      let th = THUMB;
      if (aspect > 1) th = THUMB / aspect;
      else tw = THUMB * aspect;

      tc.width = tw;
      tc.height = th;
      tCtx.filter = pf.filter === "none" ? "none" : pf.filter;
      tCtx.drawImage(img, 0, 0, tw, th);
    });
  }, [imageSrc]);

  /* ---------------------------------------------------------------- */
  /*  Download                                                          */
  /* ---------------------------------------------------------------- */

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mime =
      downloadFormat === "png"
        ? "image/png"
        : downloadFormat === "jpeg"
          ? "image/jpeg"
          : "image/webp";

    const ext = downloadFormat === "jpeg" ? "jpg" : downloadFormat;
    const baseName = imageFile?.name?.replace(/\.[^.]+$/, "") ?? "edited";

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}-edited.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      mime,
      0.92,
    );
  }, [downloadFormat, imageFile]);

  /* ---------------------------------------------------------------- */
  /*  Render: Hero / Upload Zone                                        */
  /* ---------------------------------------------------------------- */

  if (!imageSrc) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen">
          {/* Hero */}
          <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Free Online Photo Editor
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Photo Editor
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
                Adjust brightness, contrast, saturation, apply filters, rotate and flip -- all in your browser. No uploads to any server.
              </p>

              {/* Upload zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative mx-auto max-w-xl border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all ${
                  dragActive
                    ? "border-white bg-white/20 scale-[1.02]"
                    : "border-white/40 bg-white/10 hover:bg-white/15 hover:border-white/60"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                <svg
                  className="mx-auto w-12 h-12 mb-4 opacity-80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="font-semibold text-lg mb-1">
                  Drop an image here or click to browse
                </p>
                <p className="text-sm text-white/60">
                  PNG, JPG, WebP -- processed entirely in your browser
                </p>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Editor                                                    */
  /* ---------------------------------------------------------------- */

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "adjust",
      label: "Adjust",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      id: "filters",
      label: "Filters",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      id: "transform",
      label: "Transform",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <button
              onClick={resetUpload}
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Upload new image
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={resetAll}
                className="px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Reset All
              </button>

              <select
                value={downloadFormat}
                onChange={(e) => setDownloadFormat(e.target.value as DownloadFormat)}
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WebP</option>
              </select>

              <button
                onClick={handleDownload}
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all"
              >
                Download
              </button>
            </div>
          </div>

          {/* Editor layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Canvas preview */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-center min-h-[400px] overflow-auto">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[70vh] rounded-lg object-contain"
              />
            </div>

            {/* Controls panel */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 flex flex-col">
              {/* Tab buttons */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg transition-all ${
                      activeTab === t.id
                        ? "bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ---- Adjust tab ---- */}
              {activeTab === "adjust" && (
                <div className="space-y-5 flex-1 overflow-y-auto pr-1">
                  <Slider
                    label="Brightness"
                    value={adjustments.brightness}
                    min={-100}
                    max={100}
                    onChange={(v) => setAdjustments((p) => ({ ...p, brightness: v }))}
                  />
                  <Slider
                    label="Contrast"
                    value={adjustments.contrast}
                    min={-100}
                    max={100}
                    onChange={(v) => setAdjustments((p) => ({ ...p, contrast: v }))}
                  />
                  <Slider
                    label="Saturation"
                    value={adjustments.saturation}
                    min={-100}
                    max={100}
                    onChange={(v) => setAdjustments((p) => ({ ...p, saturation: v }))}
                  />
                  <Slider
                    label="Sharpness"
                    value={adjustments.sharpness}
                    min={0}
                    max={100}
                    onChange={(v) => setAdjustments((p) => ({ ...p, sharpness: v }))}
                  />
                  <Slider
                    label="Blur"
                    value={adjustments.blur}
                    min={0}
                    max={20}
                    step={0.5}
                    onChange={(v) => setAdjustments((p) => ({ ...p, blur: v }))}
                  />
                </div>
              )}

              {/* ---- Filters tab ---- */}
              {activeTab === "filters" && (
                <div className="grid grid-cols-3 gap-3 flex-1 overflow-y-auto pr-1">
                  {PRESET_FILTERS.map((pf) => (
                    <button
                      key={pf.name}
                      onClick={() => setActivePreset(pf.filter)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                        activePreset === pf.filter
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40"
                          : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700"
                      }`}
                    >
                      <canvas
                        ref={(el) => {
                          if (el) thumbRefs.current.set(pf.name, el);
                        }}
                        className="w-[72px] h-[72px] rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {pf.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* ---- Transform tab ---- */}
              {activeTab === "transform" && (
                <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                  {/* Rotate buttons */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Rotate</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          setTransform((p) => ({
                            ...p,
                            rotation: (p.rotation - 90) % 360,
                          }))
                        }
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        90° Left
                      </button>
                      <button
                        onClick={() =>
                          setTransform((p) => ({
                            ...p,
                            rotation: (p.rotation + 90) % 360,
                          }))
                        }
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 scale-x-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        90° Right
                      </button>
                    </div>
                  </div>

                  {/* Flip buttons */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Flip</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setTransform((p) => ({ ...p, flipH: !p.flipH }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition-colors ${
                          transform.flipH
                            ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400"
                            : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Horizontal
                      </button>
                      <button
                        onClick={() => setTransform((p) => ({ ...p, flipV: !p.flipV }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition-colors ${
                          transform.flipV
                            ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400"
                            : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Vertical
                      </button>
                    </div>
                  </div>

                  {/* Free rotation slider */}
                  <Slider
                    label="Free Rotation"
                    value={transform.freeRotation}
                    min={-180}
                    max={180}
                    onChange={(v) => setTransform((p) => ({ ...p, freeRotation: v }))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
