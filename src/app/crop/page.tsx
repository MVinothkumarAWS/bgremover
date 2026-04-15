"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "3:2" | "2:3";

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ASPECT_RATIOS: { label: string; value: AspectRatio; ratio: number | null }[] = [
  { label: "Free", value: "free", ratio: null },
  { label: "1:1", value: "1:1", ratio: 1 },
  { label: "4:3", value: "4:3", ratio: 4 / 3 },
  { label: "16:9", value: "16:9", ratio: 16 / 9 },
  { label: "3:2", value: "3:2", ratio: 3 / 2 },
  { label: "2:3", value: "2:3", ratio: 2 / 3 },
];

export default function CropPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("cropped-image.png");
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [aspect, setAspect] = useState<AspectRatio>("free");
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Display dimensions (the image as rendered on screen)
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [imageOffset, setImageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const updateDisplayMetrics = useCallback(() => {
    if (!containerRef.current || !imageEl) return;
    const img = containerRef.current.querySelector("img");
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    setDisplaySize({ w: rect.width, h: rect.height });
    setImageOffset({ x: rect.left - containerRect.left, y: rect.top - containerRect.top });
  }, [imageEl]);

  useEffect(() => {
    updateDisplayMetrics();
    window.addEventListener("resize", updateDisplayMetrics);
    return () => window.removeEventListener("resize", updateDisplayMetrics);
  }, [updateDisplayMetrics]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const ext = file.name.split(".").pop() || "png";
    setFileName(`cropped-image.${ext}`);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      setPreview(null);
      setCrop({ x: 0, y: 0, w: 0, h: 0 });
      const img = new Image();
      img.onload = () => {
        setImageEl(img);
        setTimeout(updateDisplayMetrics, 100);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Scale factor from display to natural image
  const scaleX = imageEl ? imageEl.naturalWidth / displaySize.w : 1;
  const scaleY = imageEl ? imageEl.naturalHeight / displaySize.h : 1;

  // Convert display-space crop to natural-space
  const naturalCrop = {
    x: Math.round(crop.x * scaleX),
    y: Math.round(crop.y * scaleY),
    w: Math.round(crop.w * scaleX),
    h: Math.round(crop.h * scaleY),
  };

  const getMousePos = (e: React.MouseEvent): { x: number; y: number } => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const containerRect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - containerRect.left - imageOffset.x,
      y: e.clientY - containerRect.top - imageOffset.y,
    };
  };

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getMousePos(e);
    setDragStart(pos);
    setDragging(true);
    setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setPreview(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart) return;
    const pos = getMousePos(e);

    let x = Math.min(dragStart.x, pos.x);
    let y = Math.min(dragStart.y, pos.y);
    let w = Math.abs(pos.x - dragStart.x);
    let h = Math.abs(pos.y - dragStart.y);

    // Enforce aspect ratio
    const ratioObj = ASPECT_RATIOS.find((a) => a.value === aspect);
    if (ratioObj?.ratio) {
      const r = ratioObj.ratio;
      if (w / h > r) {
        w = h * r;
      } else {
        h = w / r;
      }
    }

    // Clamp to image bounds
    x = clamp(x, 0, displaySize.w - 1);
    y = clamp(y, 0, displaySize.h - 1);
    w = clamp(w, 0, displaySize.w - x);
    h = clamp(h, 0, displaySize.h - y);

    setCrop({ x, y, w, h });
  };

  const handleMouseUp = () => {
    setDragging(false);
    setDragStart(null);
  };

  const applyCrop = useCallback(() => {
    if (!imageEl || naturalCrop.w <= 0 || naturalCrop.h <= 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = naturalCrop.w;
    canvas.height = naturalCrop.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      imageEl,
      naturalCrop.x,
      naturalCrop.y,
      naturalCrop.w,
      naturalCrop.h,
      0,
      0,
      naturalCrop.w,
      naturalCrop.h
    );
    setPreview(canvas.toDataURL("image/png"));
  }, [imageEl, naturalCrop.x, naturalCrop.y, naturalCrop.w, naturalCrop.h]);

  const downloadCropped = () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = fileName;
    a.click();
  };

  const handleManualInput = (field: keyof CropRect, value: number) => {
    if (!imageEl) return;
    const v = Math.max(0, value);
    const updated = { ...crop };
    // Inputs are in natural pixels, convert to display
    switch (field) {
      case "x":
        updated.x = clamp(v / scaleX, 0, displaySize.w - crop.w);
        break;
      case "y":
        updated.y = clamp(v / scaleY, 0, displaySize.h - crop.h);
        break;
      case "w":
        updated.w = clamp(v / scaleX, 0, displaySize.w - crop.x);
        break;
      case "h":
        updated.h = clamp(v / scaleY, 0, displaySize.h - crop.y);
        break;
    }
    setCrop(updated);
    setPreview(null);
  };

  const resetAll = () => {
    setImageSrc(null);
    setImageEl(null);
    setCrop({ x: 0, y: 0, w: 0, h: 0 });
    setPreview(null);
  };

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-gradient-to-b from-white via-violet-50/30 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Hero */}
        <section className="pt-24 pb-12 text-center px-4">
          <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l3-3m0 0l3 3M6 6v12m15-7l-3 3m0 0l-3-3m3 3V3" />
            </svg>
            Crop Tool
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Crop IMAGE
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            Upload your image, drag to select a region, and download the perfectly cropped result. 100% client-side — your images never leave your device.
          </p>

          {/* Upload zone (shown when no image) */}
          {!imageSrc && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`max-w-xl mx-auto border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-300 ${
                isDragOver
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02]"
                  : "border-gray-300 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 bg-white dark:bg-gray-900/50"
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
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Drop your image here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Supports PNG, JPG, WEBP, and more
              </p>
            </div>
          )}
        </section>

        {/* Crop Editor */}
        {imageSrc && imageEl && (
          <section className="max-w-7xl mx-auto px-4 pb-20">
            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Aspect ratio presets */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aspect:</span>
                  <div className="flex gap-1">
                    {ASPECT_RATIOS.map((ar) => (
                      <button
                        key={ar.value}
                        onClick={() => {
                          setAspect(ar.value);
                          setPreview(null);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          aspect === ar.value
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual inputs */}
                <div className="flex items-center gap-2 ml-auto">
                  {(["x", "y", "w", "h"] as const).map((field) => (
                    <div key={field} className="flex items-center gap-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase">
                        {field === "w" ? "W" : field === "h" ? "H" : field.toUpperCase()}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={Math.round(
                          field === "x"
                            ? naturalCrop.x
                            : field === "y"
                            ? naturalCrop.y
                            : field === "w"
                            ? naturalCrop.w
                            : naturalCrop.h
                        )}
                        onChange={(e) => handleManualInput(field, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={resetAll}
                    className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    New Image
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Canvas / image area */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-4 overflow-hidden">
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                    Click and drag on the image to select the crop area
                  </p>
                  <div
                    ref={containerRef}
                    className="relative inline-block select-none max-w-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt="Source"
                      className="max-w-full max-h-[60vh] rounded-xl"
                      onLoad={updateDisplayMetrics}
                      draggable={false}
                    />
                    {/* Dark overlay outside crop */}
                    {crop.w > 0 && crop.h > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ left: imageOffset.x, top: imageOffset.y, width: displaySize.w, height: displaySize.h }}
                      >
                        {/* Semi-transparent overlay */}
                        <div className="absolute inset-0 bg-black/50 rounded-xl" />
                        {/* Clear hole for the crop area */}
                        <div
                          className="absolute bg-transparent border-2 border-white shadow-lg"
                          style={{
                            left: crop.x,
                            top: crop.y,
                            width: crop.w,
                            height: crop.h,
                            boxShadow: `0 0 0 9999px rgba(0,0,0,0.5)`,
                            background: "transparent",
                          }}
                        />
                        {/* Visible crop region (shows through) */}
                        <div
                          className="absolute overflow-hidden rounded-sm"
                          style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageSrc}
                            alt=""
                            draggable={false}
                            className="max-w-none"
                            style={{
                              width: displaySize.w,
                              height: displaySize.h,
                              marginLeft: -crop.x,
                              marginTop: -crop.y,
                            }}
                          />
                        </div>
                        {/* Grid lines */}
                        <div
                          className="absolute pointer-events-none border border-white/30"
                          style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
                        >
                          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                          {/* Corner handles */}
                          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />
                        </div>
                        {/* Dimension label */}
                        <div
                          className="absolute text-xs bg-black/70 text-white px-2 py-0.5 rounded-md"
                          style={{ left: crop.x, top: crop.y - 24 }}
                        >
                          {naturalCrop.w} x {naturalCrop.h}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar: Preview + actions */}
              <div className="space-y-6">
                {/* Action buttons */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={applyCrop}
                      disabled={crop.w < 2 || crop.h < 2}
                      className="w-full py-3 px-4 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-violet-500/30"
                    >
                      Apply Crop
                    </button>
                    <button
                      onClick={downloadCropped}
                      disabled={!preview}
                      className="w-full py-3 px-4 text-sm font-semibold rounded-xl border-2 border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Download
                    </button>
                  </div>
                  {crop.w > 0 && crop.h > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Selection</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {naturalCrop.w} &times; {naturalCrop.h} px
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                        at ({naturalCrop.x}, {naturalCrop.y})
                      </p>
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Preview</h3>
                  {preview ? (
                    <div className="relative">
                      {/* Checkerboard background for transparency */}
                      <div
                        className="rounded-xl overflow-hidden"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Cropped preview" className="max-w-full rounded-xl" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                      <p className="text-sm text-gray-400 dark:text-gray-600">
                        {crop.w > 0 ? 'Click "Apply Crop" to preview' : "Select a crop area first"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Image info */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Original Image</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-500">Dimensions</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {imageEl.naturalWidth} &times; {imageEl.naturalHeight}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-500">Aspect</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {(imageEl.naturalWidth / imageEl.naturalHeight).toFixed(2)}
                      </span>
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
