"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PickedColor {
  hex: string;
  rgb: string;
  hsl: string;
  r: number;
  g: number;
  b: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  ).toUpperCase();
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function colorDistance(
  a: [number, number, number],
  b: [number, number, number]
): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}

function extractDominantColors(
  imageData: ImageData,
  count: number = 8
): PickedColor[] {
  const pixels: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(imageData.data.length / 4 / 2000));
  for (let i = 0; i < imageData.data.length; i += 4 * step) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];
    if (a < 128) continue;
    pixels.push([r, g, b]);
  }
  if (pixels.length === 0) return [];

  // Simple k-means-ish clustering
  let centroids: [number, number, number][] = [];
  for (let i = 0; i < Math.min(count, pixels.length); i++) {
    centroids.push(pixels[Math.floor((i * pixels.length) / count)]);
  }

  for (let iter = 0; iter < 10; iter++) {
    const clusters: [number, number, number][][] = centroids.map(() => []);
    for (const p of pixels) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let c = 0; c < centroids.length; c++) {
        const d = colorDistance(p, centroids[c]);
        if (d < minDist) {
          minDist = d;
          minIdx = c;
        }
      }
      clusters[minIdx].push(p);
    }
    centroids = clusters.map((cluster, idx) => {
      if (cluster.length === 0) return centroids[idx];
      const avg: [number, number, number] = [0, 0, 0];
      for (const p of cluster) {
        avg[0] += p[0];
        avg[1] += p[1];
        avg[2] += p[2];
      }
      return [
        Math.round(avg[0] / cluster.length),
        Math.round(avg[1] / cluster.length),
        Math.round(avg[2] / cluster.length),
      ];
    });
  }

  // Deduplicate close centroids
  const unique: [number, number, number][] = [];
  for (const c of centroids) {
    if (!unique.some((u) => colorDistance(u, c) < 30)) {
      unique.push(c);
    }
  }

  return unique.slice(0, count).map(([r, g, b]) => {
    const hsl = rgbToHsl(r, g, b);
    return {
      hex: rgbToHex(r, g, b),
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      r,
      g,
      b,
    };
  });
}

function makeColorObj(r: number, g: number, b: number): PickedColor {
  const hsl = rgbToHsl(r, g, b);
  return {
    hex: rgbToHex(r, g, b),
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    r,
    g,
    b,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ColorPickerPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState<PickedColor | null>(null);
  const [palette, setPalette] = useState<PickedColor[]>([]);
  const [dominantColors, setDominantColors] = useState<PickedColor[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const drawImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    // Extract dominant colors
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDominantColors(extractDominantColors(imageData));
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setImageSrc(src);
        setPalette([]);
        setCurrentColor(null);
        const img = new Image();
        img.onload = () => {
          imgRef.current = img;
          drawImage(img);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [drawImage]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const color = makeColorObj(pixel[0], pixel[1], pixel[2]);
      setCurrentColor(color);
    },
    []
  );

  const addToPalette = useCallback(() => {
    if (!currentColor) return;
    setPalette((prev) => {
      if (prev.length >= 10) return prev;
      if (prev.some((c) => c.hex === currentColor.hex)) return prev;
      return [...prev, currentColor];
    });
  }, [currentColor]);

  const copyToClipboard = useCallback(
    (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    },
    []
  );

  const exportPaletteAsPng = useCallback(() => {
    const allColors = palette;
    if (allColors.length === 0) return;
    const swatchSize = 80;
    const canvas = document.createElement("canvas");
    canvas.width = allColors.length * swatchSize;
    canvas.height = swatchSize + 30;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    allColors.forEach((c, i) => {
      ctx.fillStyle = c.hex;
      ctx.fillRect(i * swatchSize, 0, swatchSize, swatchSize);
      ctx.fillStyle = "#000000";
      ctx.font = "11px monospace";
      ctx.fillText(c.hex, i * swatchSize + 4, swatchSize + 18);
    });
    const link = document.createElement("a");
    link.download = "palette.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [palette]);

  const copyAllAsText = useCallback(() => {
    const text = palette.map((c) => `${c.hex}  ${c.rgb}  ${c.hsl}`).join("\n");
    copyToClipboard(text, "all-text");
  }, [palette, copyToClipboard]);

  // Drag and drop handlers
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
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
            Color Picker
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Color Picker from Image
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upload an image and click anywhere to pick colors. Build palettes and extract dominant colors instantly.
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
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">PNG, JPG, WEBP, SVG</p>
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
              {/* Canvas */}
              <div className="flex-1">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Click on the image to pick a color
                    </h2>
                    <button
                      onClick={() => {
                        setImageSrc(null);
                        setCurrentColor(null);
                        setPalette([]);
                        setDominantColors([]);
                      }}
                      className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Upload New
                    </button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="w-full max-h-[500px] object-contain rounded-xl cursor-crosshair"
                    style={{ imageRendering: "auto" }}
                  />
                </div>

                {/* Dominant Colors */}
                {dominantColors.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-5 mt-6">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Dominant Colors (auto-extracted)
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {dominantColors.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentColor(c)}
                          className="group flex flex-col items-center gap-1.5"
                          title={c.hex}
                        >
                          <div
                            className="w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-violet-500 transition-colors shadow-sm"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                            {c.hex}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="w-full lg:w-80 space-y-6">
                {/* Current color */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Picked Color
                  </h3>
                  {currentColor ? (
                    <div className="space-y-4">
                      <div
                        className="w-full h-24 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner"
                        style={{ backgroundColor: currentColor.hex }}
                      />
                      {/* HEX */}
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-gray-400">HEX</span>
                          <p className="text-sm font-mono text-gray-800 dark:text-gray-200">{currentColor.hex}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(currentColor.hex, "hex")}
                          className="text-xs px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition"
                        >
                          {copied === "hex" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      {/* RGB */}
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-gray-400">RGB</span>
                          <p className="text-sm font-mono text-gray-800 dark:text-gray-200">{currentColor.rgb}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(currentColor.rgb, "rgb")}
                          className="text-xs px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition"
                        >
                          {copied === "rgb" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      {/* HSL */}
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-gray-400">HSL</span>
                          <p className="text-sm font-mono text-gray-800 dark:text-gray-200">{currentColor.hsl}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(currentColor.hsl, "hsl")}
                          className="text-xs px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition"
                        >
                          {copied === "hsl" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <button
                        onClick={addToPalette}
                        disabled={palette.length >= 10}
                        className="w-full py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
                      >
                        Add to Palette {palette.length}/10
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                      Click on the image to pick a color
                    </div>
                  )}
                </div>

                {/* Palette */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Your Palette
                  </h3>
                  {palette.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {palette.map((c, i) => (
                          <div key={i} className="relative group">
                            <div
                              className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer"
                              style={{ backgroundColor: c.hex }}
                              title={c.hex}
                              onClick={() => setCurrentColor(c)}
                            />
                            <button
                              onClick={() =>
                                setPalette((prev) =>
                                  prev.filter((_, idx) => idx !== i)
                                )
                              }
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={exportPaletteAsPng}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all"
                        >
                          Export PNG
                        </button>
                        <button
                          onClick={copyAllAsText}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all"
                        >
                          {copied === "all-text" ? "Copied!" : "Copy All"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                      Pick colors to build your palette
                    </p>
                  )}
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
