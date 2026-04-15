"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSharedImage } from "@/context/SharedImageContext";

type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "3:2" | "2:3";
type DragMode = "none" | "draw" | "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

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
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [aspect, setAspect] = useState<AspectRatio>("free");
  const [isDragOver, setIsDragOver] = useState(false);

  const [dragMode, setDragMode] = useState<DragMode>("none");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sharedFile, setSharedImage } = useSharedImage();

  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

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

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setSharedImage(file);
    const ext = file.name.split(".").pop() || "png";
    setFileName(`cropped-image.${ext}`);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      setCrop({ x: 0, y: 0, w: 0, h: 0 });
      const img = new Image();
      img.onload = () => {
        setImageEl(img);
        setTimeout(updateDisplayMetrics, 100);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSharedImage]);

  // Load shared image on mount
  useEffect(() => {
    if (sharedFile && !imageSrc) handleFile(sharedFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scale factors
  const scaleX = imageEl ? imageEl.naturalWidth / (displaySize.w || 1) : 1;
  const scaleY = imageEl ? imageEl.naturalHeight / (displaySize.h || 1) : 1;

  const naturalCrop = {
    x: Math.round(crop.x * scaleX),
    y: Math.round(crop.y * scaleY),
    w: Math.round(crop.w * scaleX),
    h: Math.round(crop.h * scaleY),
  };

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const getMousePos = (e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const containerRect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - containerRect.left - imageOffset.x,
      y: e.clientY - containerRect.top - imageOffset.y,
    };
  };

  // Determine which handle the mouse is over
  const getHandleAtPos = (mx: number, my: number): DragMode => {
    if (crop.w < 5 || crop.h < 5) return "none";
    const threshold = 10;
    const { x, y, w, h } = crop;

    const onLeft = Math.abs(mx - x) < threshold;
    const onRight = Math.abs(mx - (x + w)) < threshold;
    const onTop = Math.abs(my - y) < threshold;
    const onBottom = Math.abs(my - (y + h)) < threshold;
    const inX = mx > x + threshold && mx < x + w - threshold;
    const inY = my > y + threshold && my < y + h - threshold;

    if (onTop && onLeft) return "nw";
    if (onTop && onRight) return "ne";
    if (onBottom && onLeft) return "sw";
    if (onBottom && onRight) return "se";
    if (onTop && inX) return "n";
    if (onBottom && inX) return "s";
    if (onLeft && inY) return "w";
    if (onRight && inY) return "e";
    if (mx > x && mx < x + w && my > y && my < y + h) return "move";
    return "none";
  };

  const getCursorForMode = (mode: DragMode): string => {
    switch (mode) {
      case "nw": case "se": return "nwse-resize";
      case "ne": case "sw": return "nesw-resize";
      case "n": case "s": return "ns-resize";
      case "e": case "w": return "ew-resize";
      case "move": return "move";
      default: return "crosshair";
    }
  };

  const [hoverMode, setHoverMode] = useState<DragMode>("none");

  const enforceAspect = (rect: CropRect, anchor: "tl" | "tr" | "bl" | "br"): CropRect => {
    const ratioObj = ASPECT_RATIOS.find((a) => a.value === aspect);
    if (!ratioObj?.ratio) return rect;
    const r = ratioObj.ratio;
    let { x, y, w, h } = rect;
    if (w / h > r) {
      w = h * r;
    } else {
      h = w / r;
    }
    // Adjust position based on anchor
    if (anchor === "tr" || anchor === "br") { /* x stays */ }
    if (anchor === "tl" || anchor === "bl") { x = rect.x + rect.w - w; }
    if (anchor === "bl" || anchor === "br") { /* y stays */ }
    if (anchor === "tl" || anchor === "tr") { y = rect.y + rect.h - h; }
    return { x, y, w, h };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getMousePos(e);
    const handle = getHandleAtPos(pos.x, pos.y);

    if (handle !== "none") {
      setDragMode(handle);
      setDragStart(pos);
      setCropStart({ ...crop });
    } else {
      // Start drawing new crop
      setDragMode("draw");
      setDragStart(pos);
      setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 });
      setCropStart({ x: pos.x, y: pos.y, w: 0, h: 0 });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    const pos = getMousePos(e);

    if (dragMode === "none") {
      setHoverMode(getHandleAtPos(pos.x, pos.y));
      return;
    }

    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    let next = { ...cropStart };

    switch (dragMode) {
      case "draw": {
        let x = Math.min(dragStart.x, pos.x);
        let y = Math.min(dragStart.y, pos.y);
        let w = Math.abs(pos.x - dragStart.x);
        let h = Math.abs(pos.y - dragStart.y);
        const ratioObj = ASPECT_RATIOS.find((a) => a.value === aspect);
        if (ratioObj?.ratio) {
          if (w / h > ratioObj.ratio) w = h * ratioObj.ratio;
          else h = w / ratioObj.ratio;
        }
        next = { x, y, w, h };
        break;
      }
      case "move": {
        next.x = clamp(cropStart.x + dx, 0, displaySize.w - cropStart.w);
        next.y = clamp(cropStart.y + dy, 0, displaySize.h - cropStart.h);
        next.w = cropStart.w;
        next.h = cropStart.h;
        break;
      }
      case "se": {
        next.w = clamp(cropStart.w + dx, 10, displaySize.w - cropStart.x);
        next.h = clamp(cropStart.h + dy, 10, displaySize.h - cropStart.y);
        next = enforceAspect(next, "tl");
        break;
      }
      case "sw": {
        const newW = clamp(cropStart.w - dx, 10, cropStart.x + cropStart.w);
        next.h = clamp(cropStart.h + dy, 10, displaySize.h - cropStart.y);
        next.x = cropStart.x + cropStart.w - newW;
        next.w = newW;
        next = enforceAspect(next, "tr");
        break;
      }
      case "ne": {
        next.w = clamp(cropStart.w + dx, 10, displaySize.w - cropStart.x);
        const newH = clamp(cropStart.h - dy, 10, cropStart.y + cropStart.h);
        next.y = cropStart.y + cropStart.h - newH;
        next.h = newH;
        next = enforceAspect(next, "bl");
        break;
      }
      case "nw": {
        const newW = clamp(cropStart.w - dx, 10, cropStart.x + cropStart.w);
        const newH = clamp(cropStart.h - dy, 10, cropStart.y + cropStart.h);
        next.x = cropStart.x + cropStart.w - newW;
        next.y = cropStart.y + cropStart.h - newH;
        next.w = newW;
        next.h = newH;
        next = enforceAspect(next, "br");
        break;
      }
      case "n": {
        const newH = clamp(cropStart.h - dy, 10, cropStart.y + cropStart.h);
        next.y = cropStart.y + cropStart.h - newH;
        next.h = newH;
        break;
      }
      case "s": {
        next.h = clamp(cropStart.h + dy, 10, displaySize.h - cropStart.y);
        break;
      }
      case "w": {
        const newW = clamp(cropStart.w - dx, 10, cropStart.x + cropStart.w);
        next.x = cropStart.x + cropStart.w - newW;
        next.w = newW;
        break;
      }
      case "e": {
        next.w = clamp(cropStart.w + dx, 10, displaySize.w - cropStart.x);
        break;
      }
    }

    // Clamp within bounds
    next.x = clamp(next.x, 0, displaySize.w - 10);
    next.y = clamp(next.y, 0, displaySize.h - 10);
    next.w = clamp(next.w, 0, displaySize.w - next.x);
    next.h = clamp(next.h, 0, displaySize.h - next.y);

    setCrop(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragMode, dragStart, cropStart, displaySize, aspect]);

  const handleMouseUp = useCallback(() => {
    setDragMode("none");
  }, []);

  // Global mouse events for dragging outside container
  useEffect(() => {
    if (dragMode === "none") return;
    const onMove = (e: MouseEvent) => handleMouseMove(e);
    const onUp = () => handleMouseUp();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragMode, handleMouseMove, handleMouseUp]);

  const applyCropAndDownload = useCallback(() => {
    if (!imageEl || naturalCrop.w <= 0 || naturalCrop.h <= 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = naturalCrop.w;
    canvas.height = naturalCrop.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imageEl, naturalCrop.x, naturalCrop.y, naturalCrop.w, naturalCrop.h, 0, 0, naturalCrop.w, naturalCrop.h);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = fileName;
    link.click();
  }, [imageEl, naturalCrop, fileName]);

  // Set crop from manual input (natural pixels)
  const handleManualInput = (field: "w" | "h" | "x" | "y", value: number) => {
    if (!imageEl) return;
    const v = Math.max(0, value);
    const updated = { ...crop };
    switch (field) {
      case "x": updated.x = clamp(v / scaleX, 0, displaySize.w - crop.w); break;
      case "y": updated.y = clamp(v / scaleY, 0, displaySize.h - crop.h); break;
      case "w": updated.w = clamp(v / scaleX, 0, displaySize.w - crop.x); break;
      case "h": updated.h = clamp(v / scaleY, 0, displaySize.h - crop.y); break;
    }
    setCrop(updated);
  };

  // Initialize default crop (center 80%)
  const initDefaultCrop = useCallback(() => {
    if (!displaySize.w || !displaySize.h) return;
    const margin = 0.1;
    setCrop({
      x: displaySize.w * margin,
      y: displaySize.h * margin,
      w: displaySize.w * (1 - margin * 2),
      h: displaySize.h * (1 - margin * 2),
    });
  }, [displaySize]);

  useEffect(() => {
    if (imageEl && displaySize.w > 0 && crop.w === 0 && crop.h === 0) {
      initDefaultCrop();
    }
  }, [imageEl, displaySize, crop.w, crop.h, initDefaultCrop]);

  const resetAll = () => {
    setImageSrc(null);
    setImageEl(null);
    setCrop({ x: 0, y: 0, w: 0, h: 0 });
  };

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-gradient-to-b from-white via-violet-50/30 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Hero / Upload */}
        {!imageSrc && (
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
              Upload your image, drag to select a region, and download the perfectly cropped result.
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={`max-w-xl mx-auto border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-300 ${
                isDragOver
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02]"
                  : "border-gray-300 dark:border-gray-700 hover:border-violet-400 bg-white dark:bg-gray-900/50"
              }`}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">Drop your image here or click to browse</p>
              <p className="text-sm text-gray-500">Supports PNG, JPG, WEBP, and more</p>
            </div>
          </section>
        )}

        {/* Crop Editor - iLoveIMG style layout */}
        {imageSrc && imageEl && (
          <section className="max-w-7xl mx-auto px-4 py-6 pb-20">
            {/* Top bar with aspect ratio + new image */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aspect:</span>
                <div className="flex gap-1">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.value}
                      onClick={() => { setAspect(ar.value); }}
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
              <button onClick={resetAll} className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                New Image
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              {/* Left: Image with crop overlay */}
              <div className="bg-gray-950 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800">
                <div
                  ref={containerRef}
                  className="relative select-none flex items-center justify-center p-4"
                  style={{ cursor: dragMode !== "none" ? getCursorForMode(dragMode) : getCursorForMode(hoverMode || "none") }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={(e) => { if (dragMode === "none") { const pos = getMousePos(e); setHoverMode(getHandleAtPos(pos.x, pos.y)); } }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt="Source"
                    className="max-w-full max-h-[70vh]"
                    onLoad={updateDisplayMetrics}
                    draggable={false}
                  />

                  {/* Crop overlay */}
                  {crop.w > 0 && crop.h > 0 && (
                    <div
                      className="absolute pointer-events-none"
                      style={{ left: imageOffset.x, top: imageOffset.y, width: displaySize.w, height: displaySize.h }}
                    >
                      {/* Darkened overlay outside crop */}
                      <div className="absolute inset-0">
                        {/* Top */}
                        <div className="absolute bg-black/50" style={{ left: 0, top: 0, width: "100%", height: crop.y }} />
                        {/* Bottom */}
                        <div className="absolute bg-black/50" style={{ left: 0, top: crop.y + crop.h, width: "100%", height: displaySize.h - crop.y - crop.h }} />
                        {/* Left */}
                        <div className="absolute bg-black/50" style={{ left: 0, top: crop.y, width: crop.x, height: crop.h }} />
                        {/* Right */}
                        <div className="absolute bg-black/50" style={{ left: crop.x + crop.w, top: crop.y, width: displaySize.w - crop.x - crop.w, height: crop.h }} />
                      </div>

                      {/* Crop border */}
                      <div
                        className="absolute border-2 border-blue-500"
                        style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
                      >
                        {/* Rule of thirds grid */}
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />

                        {/* Corner handles */}
                        <div className="absolute -top-[5px] -left-[5px] w-[10px] h-[10px] bg-blue-500 border-2 border-white" />
                        <div className="absolute -top-[5px] -right-[5px] w-[10px] h-[10px] bg-blue-500 border-2 border-white" />
                        <div className="absolute -bottom-[5px] -left-[5px] w-[10px] h-[10px] bg-blue-500 border-2 border-white" />
                        <div className="absolute -bottom-[5px] -right-[5px] w-[10px] h-[10px] bg-blue-500 border-2 border-white" />

                        {/* Edge handles */}
                        <div className="absolute -top-[4px] left-1/2 -translate-x-1/2 w-[20px] h-[8px] bg-blue-500 border-2 border-white rounded-sm" />
                        <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-[20px] h-[8px] bg-blue-500 border-2 border-white rounded-sm" />
                        <div className="absolute -left-[4px] top-1/2 -translate-y-1/2 w-[8px] h-[20px] bg-blue-500 border-2 border-white rounded-sm" />
                        <div className="absolute -right-[4px] top-1/2 -translate-y-1/2 w-[8px] h-[20px] bg-blue-500 border-2 border-white rounded-sm" />
                      </div>

                      {/* Dimension label */}
                      {crop.w > 60 && (
                        <div
                          className="absolute text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium"
                          style={{ left: crop.x + crop.w / 2, top: crop.y - 26, transform: "translateX(-50%)" }}
                        >
                          {naturalCrop.w} &times; {naturalCrop.h}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Crop Options panel */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Crop options</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Width (px)</label>
                      <input
                        type="number"
                        min={1}
                        value={naturalCrop.w}
                        onChange={(e) => handleManualInput("w", parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Height (px)</label>
                      <input
                        type="number"
                        min={1}
                        value={naturalCrop.h}
                        onChange={(e) => handleManualInput("h", parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Position X (px)</label>
                      <input
                        type="number"
                        min={0}
                        value={naturalCrop.x}
                        onChange={(e) => handleManualInput("x", parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Position Y (px)</label>
                      <input
                        type="number"
                        min={0}
                        value={naturalCrop.y}
                        onChange={(e) => handleManualInput("y", parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Original info */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Original</span>
                    <span className="font-medium text-gray-900 dark:text-white">{imageEl.naturalWidth} &times; {imageEl.naturalHeight}</span>
                  </div>
                </div>

                {/* Crop button */}
                <button
                  onClick={applyCropAndDownload}
                  disabled={crop.w < 5 || crop.h < 5}
                  className="w-full py-4 px-6 text-base font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:from-violet-700 hover:to-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Crop IMAGE
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
