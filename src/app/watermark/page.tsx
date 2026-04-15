"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSharedImage } from "@/context/SharedImageContext";

type WatermarkMode = "text" | "image";
type Position =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

const POSITIONS: { key: Position; label: string }[] = [
  { key: "top-left", label: "TL" },
  { key: "top-center", label: "TC" },
  { key: "top-right", label: "TR" },
  { key: "middle-left", label: "ML" },
  { key: "center", label: "C" },
  { key: "middle-right", label: "MR" },
  { key: "bottom-left", label: "BL" },
  { key: "bottom-center", label: "BC" },
  { key: "bottom-right", label: "BR" },
];

const FONTS = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"];

export default function WatermarkPage() {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceFileName, setSourceFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Watermark mode
  const [mode, setMode] = useState<WatermarkMode>("text");

  // Text watermark settings
  const [text, setText] = useState("Watermark");
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);

  // Image watermark
  const [watermarkImage, setWatermarkImage] = useState<HTMLImageElement | null>(null);

  // Shared settings
  const [opacity, setOpacity] = useState(50);
  const [position, setPosition] = useState<Position>("center");
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(30);
  const [tile, setTile] = useState(false);

  const { sharedFile, setSharedImage } = useSharedImage();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wmFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageLoad = useCallback((file: File) => {
    setSharedImage(file);
    const img = new Image();
    img.onload = () => {
      setSourceImage(img);
      setSourceFileName(file.name);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  useEffect(() => {
    if (sharedFile && !sourceImage) handleImageLoad(sharedFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleImageLoad(file);
    },
    [handleImageLoad]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageLoad(file);
    },
    [handleImageLoad]
  );

  const handleWmImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => setWatermarkImage(img);
      img.src = URL.createObjectURL(file);
    },
    []
  );

  // --- Canvas rendering ---
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = sourceImage.naturalWidth;
    canvas.height = sourceImage.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceImage, 0, 0);

    ctx.globalAlpha = opacity / 100;

    const drawWatermarkAt = (cx: number, cy: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rotation * Math.PI) / 180);

      if (mode === "text" && text) {
        const style = `${italic ? "italic " : ""}${bold ? "bold " : ""}`;
        ctx.font = `${style}${fontSize}px "${fontFamily}"`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 0, 0);
      } else if (mode === "image" && watermarkImage) {
        const wmScale = scale / 100;
        const w = watermarkImage.naturalWidth * wmScale;
        const h = watermarkImage.naturalHeight * wmScale;
        ctx.drawImage(watermarkImage, -w / 2, -h / 2, w, h);
      }

      ctx.restore();
    };

    if (tile) {
      // Compute step based on watermark size
      let stepX: number;
      let stepY: number;
      if (mode === "text" && text) {
        const style = `${italic ? "italic " : ""}${bold ? "bold " : ""}`;
        ctx.font = `${style}${fontSize}px "${fontFamily}"`;
        const m = ctx.measureText(text);
        stepX = m.width + 60;
        stepY = fontSize + 60;
      } else if (mode === "image" && watermarkImage) {
        const wmScale = scale / 100;
        stepX = watermarkImage.naturalWidth * wmScale + 60;
        stepY = watermarkImage.naturalHeight * wmScale + 60;
      } else {
        return;
      }
      for (let y = stepY / 2; y < canvas.height + stepY; y += stepY) {
        for (let x = stepX / 2; x < canvas.width + stepX; x += stepX) {
          drawWatermarkAt(x, y);
        }
      }
    } else {
      const pos = getPositionCoords(position, canvas.width, canvas.height, 40);
      drawWatermarkAt(pos.x, pos.y);
    }

    ctx.globalAlpha = 1;
  }, [
    sourceImage,
    mode,
    text,
    fontSize,
    fontColor,
    fontFamily,
    bold,
    italic,
    watermarkImage,
    opacity,
    position,
    rotation,
    scale,
    tile,
  ]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const ext = sourceFileName.replace(/.*\./, "").toLowerCase();
    const mime = ext === "png" ? "image/png" : "image/jpeg";
    link.download = `watermarked-${sourceFileName || "image.png"}`;
    link.href = canvas.toDataURL(mime, 0.95);
    link.click();
  };

  const handleReset = () => {
    setSourceImage(null);
    setSourceFileName("");
    setWatermarkImage(null);
    setText("Watermark");
    setFontSize(48);
    setFontColor("#ffffff");
    setFontFamily("Arial");
    setBold(false);
    setItalic(false);
    setOpacity(50);
    setPosition("center");
    setRotation(0);
    setScale(30);
    setTile(false);
    setMode("text");
  };

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        {/* Hero / Upload Zone */}
        {!sourceImage ? (
          <section className="pt-24 pb-16 px-4">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Free &middot; No Upload &middot; 100% Browser
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Watermark
                </span>{" "}
                <span className="text-gray-900 dark:text-white">Your Image</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Add text or image watermarks to protect your photos. Runs entirely in your browser &mdash; nothing leaves your device.
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`max-w-2xl mx-auto rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
                dragOver
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02]"
                  : "border-gray-300 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 bg-white dark:bg-gray-900/50"
              }`}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                Drag &amp; drop your image here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                or click to browse &middot; PNG, JPG, WebP
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </section>
        ) : (
          /* ---- Editor ---- */
          <section className="pt-20 pb-16 px-4">
            <div className="max-w-7xl mx-auto">
              {/* Top bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Watermark Editor
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    New Image
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
                  >
                    Download
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
                {/* Sidebar Controls */}
                <div className="space-y-5">
                  {/* Mode Toggle */}
                  <div className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      {(["text", "image"] as WatermarkMode[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                            mode === m
                              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          {m === "text" ? "Text Watermark" : "Image Watermark"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Controls */}
                  {mode === "text" && (
                    <div className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Text Settings</h3>

                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Watermark Text
                        </label>
                        <input
                          type="text"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          placeholder="Enter watermark text"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Font Family
                        </label>
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          {FONTS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Font Size: {fontSize}px
                        </label>
                        <input
                          type="range"
                          min={12}
                          max={120}
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full accent-violet-600"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Color
                          </label>
                          <input
                            type="color"
                            value={fontColor}
                            onChange={(e) => setFontColor(e.target.value)}
                            className="w-full h-9 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer"
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={() => setBold(!bold)}
                            className={`w-9 h-9 rounded-lg text-sm font-bold flex items-center justify-center border transition-colors ${
                              bold
                                ? "bg-violet-600 text-white border-violet-600"
                                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            B
                          </button>
                          <button
                            onClick={() => setItalic(!italic)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium flex items-center justify-center border transition-colors italic ${
                              italic
                                ? "bg-violet-600 text-white border-violet-600"
                                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            I
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Watermark Controls */}
                  {mode === "image" && (
                    <div className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Image Watermark</h3>
                      <button
                        onClick={() => wmFileInputRef.current?.click()}
                        className="w-full py-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 text-gray-500 dark:text-gray-400 text-sm transition-colors"
                      >
                        {watermarkImage ? "Change watermark image" : "Upload a logo or image"}
                      </button>
                      <input
                        ref={wmFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleWmImageChange}
                      />
                      {watermarkImage && (
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Scale: {scale}%
                          </label>
                          <input
                            type="range"
                            min={5}
                            max={200}
                            value={scale}
                            onChange={(e) => setScale(Number(e.target.value))}
                            className="w-full accent-violet-600"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shared Controls */}
                  <div className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Position &amp; Style</h3>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Opacity: {opacity}%
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="w-full accent-violet-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Rotation: {rotation}&deg;
                      </label>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full accent-violet-600"
                      />
                    </div>

                    {/* Position Grid */}
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Position
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {POSITIONS.map((p) => (
                          <button
                            key={p.key}
                            onClick={() => setPosition(p.key)}
                            className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                              position === p.key
                                ? "bg-violet-600 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tile Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Tile / Repeat
                      </span>
                      <button
                        onClick={() => setTile(!tile)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          tile ? "bg-violet-600" : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            tile ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Canvas Preview */}
                <div className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-center overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[70vh] rounded-xl object-contain"
                    style={{ imageRendering: "auto" }}
                  />
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

/* ---- helpers ---- */
function getPositionCoords(
  pos: Position,
  w: number,
  h: number,
  pad: number
): { x: number; y: number } {
  const map: Record<Position, { x: number; y: number }> = {
    "top-left": { x: pad, y: pad },
    "top-center": { x: w / 2, y: pad },
    "top-right": { x: w - pad, y: pad },
    "middle-left": { x: pad, y: h / 2 },
    center: { x: w / 2, y: h / 2 },
    "middle-right": { x: w - pad, y: h / 2 },
    "bottom-left": { x: pad, y: h - pad },
    "bottom-center": { x: w / 2, y: h - pad },
    "bottom-right": { x: w - pad, y: h - pad },
  };
  return map[pos];
}
