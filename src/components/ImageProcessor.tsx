"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ImageProcessorProps {
  file: File;
  onReset: () => void;
}

type ProcessingStatus = "loading-model" | "processing" | "done" | "error";
type Tool = "none" | "erase" | "restore";

const PRESET_COLORS = [
  { label: "Transparent", value: "transparent" },
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Red", value: "#ef4444" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Yellow", value: "#eab308" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Gray", value: "#6b7280" },
];

const PRESET_TEMPLATES = [
  { label: "Original Size", width: 0, height: 0 },
  { label: "E-commerce (1000x1000)", width: 1000, height: 1000 },
  { label: "Passport (600x600)", width: 600, height: 600 },
  { label: "Instagram Post (1080x1080)", width: 1080, height: 1080 },
  { label: "Instagram Story (1080x1920)", width: 1080, height: 1920 },
  { label: "LinkedIn Banner (1584x396)", width: 1584, height: 396 },
  { label: "Twitter Header (1500x500)", width: 1500, height: 500 },
  { label: "Facebook Cover (820x312)", width: 820, height: 312 },
  { label: "YouTube Thumbnail (1280x720)", width: 1280, height: 720 },
];

export default function ImageProcessor({ file, onReset }: ImageProcessorProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("loading-model");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState<"result" | "compare">("result");

  // Background options
  const [bgColor, setBgColor] = useState("transparent");
  const [bgImageUrl, setBgImageUrl] = useState("");
  const bgImageRef = useRef<HTMLInputElement>(null);

  // Touch-up tool
  const [activeTool, setActiveTool] = useState<Tool>("none");
  const [brushSize, setBrushSize] = useState(20);
  const touchUpCanvasRef = useRef<HTMLCanvasElement>(null);
  const [touchedUpUrl, setTouchedUpUrl] = useState("");
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const originalImageData = useRef<ImageData | null>(null);
  const resultImageRef = useRef<HTMLImageElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Effects
  const [shadow, setShadow] = useState(false);
  const [blurBg, setBlurBg] = useState(0);

  // Download options
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpg" | "webp">("png");
  const [downloadQuality, setDownloadQuality] = useState(92);
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Text overlay
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(32);
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">("bottom");

  // History
  const [toast, setToast] = useState("");

  // Compare slider
  const compareRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Sidebar panel
  const [activePanel, setActivePanel] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Cleanup resultUrl and bgImageUrl on unmount
  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  useEffect(() => {
    return () => {
      if (bgImageUrl) URL.revokeObjectURL(bgImageUrl);
    };
  }, [bgImageUrl]);

  // Process image
  useEffect(() => {
    let cancelled = false;
    async function processImage() {
      try {
        setStatus("loading-model");
        setProgress(10);
        const { removeBackground } = await import("@imgly/background-removal");
        if (cancelled) return;
        setStatus("processing");
        setProgress(30);

        const progressInterval = setInterval(() => {
          setProgress((p) => (p >= 90 ? (clearInterval(progressInterval), 90) : p + Math.random() * 5));
        }, 500);

        const blob = await removeBackground(file, {
          progress: (key: string, current: number, total: number) => {
            if (key === "compute:inference") setProgress(30 + Math.round((current / total) * 60));
          },
        });
        clearInterval(progressInterval);
        if (cancelled) return;

        setResultBlob(blob);
        const blobUrl = URL.createObjectURL(blob);
        setResultUrl(blobUrl);
        setProgress(100);
        setStatus("done");
        saveToHistory(file, blobUrl);
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Failed to process image");
        setStatus("error");
      }
    }
    processImage();
    return () => { cancelled = true; };
  }, [file]);

  // Load images for touch-up canvas
  useEffect(() => {
    if (!resultUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { resultImageRef.current = img; };
    img.src = resultUrl;
  }, [resultUrl]);

  useEffect(() => {
    if (!originalUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { originalImageRef.current = img; };
    img.src = originalUrl;
  }, [originalUrl]);

  // Initialize touch-up canvas when tool is activated
  useEffect(() => {
    if (activeTool === "none" || !resultImageRef.current || !touchUpCanvasRef.current) return;
    const canvas = touchUpCanvasRef.current;
    const img = resultImageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // If we already have touch-up data, draw it
    if (touchedUpUrl) {
      const touchedImg = new Image();
      touchedImg.crossOrigin = "anonymous";
      touchedImg.onload = () => {
        ctx.drawImage(touchedImg, 0, 0);
        originalImageData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      };
      touchedImg.src = touchedUpUrl;
    } else {
      ctx.drawImage(img, 0, 0);
      originalImageData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  }, [activeTool, resultUrl, touchedUpUrl]);

  // Touch-up drawing
  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = touchUpCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, []);

  const drawBrush = useCallback((x: number, y: number) => {
    const canvas = touchUpCanvasRef.current;
    if (!canvas || !originalImageRef.current) return;
    const ctx = canvas.getContext("2d")!;
    const scaledBrush = brushSize * (canvas.width / canvas.getBoundingClientRect().width);

    if (activeTool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, scaledBrush / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (activeTool === "restore") {
      ctx.globalCompositeOperation = "source-over";
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, scaledBrush / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(originalImageRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, [activeTool, brushSize]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool === "none") return;
    e.preventDefault();
    isDrawing.current = true;
    const coords = getCanvasCoords(e);
    if (coords) {
      lastPoint.current = coords;
      drawBrush(coords.x, coords.y);
    }
  }, [activeTool, getCanvasCoords, drawBrush]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || activeTool === "none") return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (coords) {
      if (lastPoint.current) {
        const dx = coords.x - lastPoint.current.x;
        const dy = coords.y - lastPoint.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, Math.floor(dist / 2));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          drawBrush(lastPoint.current.x + dx * t, lastPoint.current.y + dy * t);
        }
      }
      lastPoint.current = coords;
    }
  }, [activeTool, getCanvasCoords, drawBrush]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPoint.current = null;
    // Save canvas state
    const canvas = touchUpCanvasRef.current;
    if (canvas) {
      setTouchedUpUrl(canvas.toDataURL("image/png"));
    }
  }, []);

  // Generate final composite
  const generateComposite = useCallback(async (): Promise<string> => {
    const img = touchedUpUrl
      ? await loadImage(touchedUpUrl)
      : resultImageRef.current || (await loadImage(resultUrl));

    const template = PRESET_TEMPLATES[selectedTemplate];
    const outW = template.width || img.naturalWidth;
    const outH = template.height || img.naturalHeight;

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d")!;

    // Background
    if (blurBg > 0 && originalImageRef.current) {
      ctx.filter = `blur(${blurBg}px)`;
      ctx.drawImage(originalImageRef.current, 0, 0, outW, outH);
      ctx.filter = "none";
    } else if (bgImageUrl) {
      const bgImg = await loadImage(bgImageUrl);
      ctx.drawImage(bgImg, 0, 0, outW, outH);
    } else if (bgColor !== "transparent") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, outW, outH);
    }

    // Shadow
    if (shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 10;
    }

    // Subject (fit within canvas)
    const scale = Math.min(outW / img.naturalWidth, outH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (outW - w) / 2;
    const y = (outH - h) / 2;
    ctx.drawImage(img, x, y, w, h);

    // Reset shadow for text
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Text overlay
    if (textOverlay) {
      ctx.font = `bold ${textSize}px sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 2;
      let textY = outH - 40;
      if (textPosition === "top") textY = textSize + 20;
      else if (textPosition === "center") textY = outH / 2 + textSize / 3;
      ctx.strokeText(textOverlay, outW / 2, textY);
      ctx.fillText(textOverlay, outW / 2, textY);
    }

    const mimeType = downloadFormat === "jpg" ? "image/jpeg" : downloadFormat === "webp" ? "image/webp" : "image/png";
    return canvas.toDataURL(mimeType, downloadQuality / 100);
  }, [touchedUpUrl, resultUrl, selectedTemplate, blurBg, bgImageUrl, bgColor, shadow, textOverlay, textColor, textSize, textPosition, downloadFormat, downloadQuality]);

  const [previewUrl, setPreviewUrl] = useState("");

  // Update preview when settings change
  useEffect(() => {
    if (status !== "done") return;
    const timeout = setTimeout(() => {
      generateComposite().then(setPreviewUrl);
    }, 100);
    return () => clearTimeout(timeout);
  }, [status, generateComposite]);

  const handleDownload = useCallback(async () => {
    const dataUrl = await generateComposite();
    const a = document.createElement("a");
    a.href = dataUrl;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    a.download = `${baseName}-edited.${downloadFormat}`;
    a.click();
    showToast("Image downloaded!");
  }, [generateComposite, file.name, downloadFormat]);

  const handleShare = useCallback(async () => {
    const dataUrl = await generateComposite();
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const shareFile = new File([blob], `edited.${downloadFormat}`, { type: blob.type });
    if (navigator.share && navigator.canShare({ files: [shareFile] })) {
      await navigator.share({ files: [shareFile], title: "BG Remover Result" });
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
        showToast("Copied to clipboard!");
      } catch {
        showToast("Share not supported on this browser");
      }
    }
  }, [generateComposite, downloadFormat]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Background image upload
  const handleBgImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (bgImageUrl) URL.revokeObjectURL(bgImageUrl);
      const url = URL.createObjectURL(f);
      setBgImageUrl(url);
      setBgColor("transparent");
    }
  }, []);

  // Compare slider handlers
  const handleSliderMove = useCallback((clientX: number) => {
    if (!compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleMouseDown = useCallback(() => { isDragging.current = true; }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => { if (isDragging.current) handleSliderMove(e.clientX); };
    const up = () => { isDragging.current = false; };
    const touchMove = (e: TouchEvent) => { if (isDragging.current) handleSliderMove(e.touches[0].clientX); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", touchMove);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", up);
    };
  }, [handleSliderMove]);

  // ── Processing / Error states ──
  if (status === "loading-model" || status === "processing") {
    return (
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {status === "loading-model" ? "Loading AI Model..." : "Removing Background..."}
        </h2>
        <div className="max-w-lg mx-auto mb-8">
          <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="progress-bar absolute left-0 top-0 h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {status === "loading-model" ? "Downloading AI model (first time may take a moment)..." : `Processing... ${Math.round(progress)}%`}
          </p>
        </div>
        {originalUrl && (
          <div className="max-w-md mx-auto rounded-xl overflow-hidden shadow-lg">
            <img src={originalUrl} alt="Original" className="w-full h-auto opacity-50" />
          </div>
        )}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Something went wrong</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMsg}</p>
        <button onClick={onReset} className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">Try Again</button>
      </div>
    );
  }

  // ── Done state ──
  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Background Removed!</h2>
        <p className="text-gray-600 dark:text-gray-400">Customize your result using the tools below.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left: Toolbar ── */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <ToolbarSection
              title="View"
              icon={<EyeIcon />}
              open={activePanel === "view"}
              onToggle={() => setActivePanel(activePanel === "view" ? null : "view")}
            >
              <div className="flex gap-2">
                <button onClick={() => setViewMode("result")} className={tabClass(viewMode === "result")}>Result</button>
                <button onClick={() => setViewMode("compare")} className={tabClass(viewMode === "compare")}>Compare</button>
              </div>
            </ToolbarSection>

            <ToolbarSection
              title="Background"
              icon={<PaletteIcon />}
              open={activePanel === "bg"}
              onToggle={() => setActivePanel(activePanel === "bg" ? null : "bg")}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => { setBgColor(c.value); setBgImageUrl(""); setBlurBg(0); }}
                      title={c.label}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${bgColor === c.value && !bgImageUrl && !blurBg ? "border-blue-600 scale-110" : "border-gray-200 dark:border-gray-600 hover:border-gray-400"} ${c.value === "transparent" ? "checkerboard" : ""}`}
                      style={c.value !== "transparent" ? { backgroundColor: c.value } : undefined}
                    />
                  ))}
                  <div className="relative">
                    <input type="color" value={bgColor === "transparent" ? "#ffffff" : bgColor} onChange={(e) => { setBgColor(e.target.value); setBgImageUrl(""); setBlurBg(0); }} className="absolute inset-0 w-7 h-7 opacity-0 cursor-pointer" />
                    <div className="w-7 h-7 rounded-full border-2 border-gray-200 dark:border-gray-600" style={{ background: "conic-gradient(red,yellow,lime,aqua,blue,magenta,red)" }} />
                  </div>
                </div>
                <div>
                  <input ref={bgImageRef} type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />
                  <button onClick={() => bgImageRef.current?.click()} className="w-full text-xs px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                    Upload Background Image
                  </button>
                  {bgImageUrl && (
                    <button onClick={() => setBgImageUrl("")} className="mt-1 text-xs text-red-500 hover:underline">Remove image</button>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Blur Original BG: {blurBg}px</label>
                  <input type="range" min={0} max={30} value={blurBg} onChange={(e) => { setBlurBg(+e.target.value); setBgImageUrl(""); if (+e.target.value > 0) setBgColor("transparent"); }} className="w-full" />
                </div>
              </div>
            </ToolbarSection>

            <ToolbarSection
              title="Touch Up"
              icon={<BrushIcon />}
              open={activePanel === "touchup"}
              onToggle={() => setActivePanel(activePanel === "touchup" ? null : "touchup")}
            >
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button onClick={() => setActiveTool(activeTool === "erase" ? "none" : "erase")} className={tabClass(activeTool === "erase")}>Erase</button>
                  <button onClick={() => setActiveTool(activeTool === "restore" ? "none" : "restore")} className={tabClass(activeTool === "restore")}>Restore</button>
                </div>
                {activeTool !== "none" && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Brush: {brushSize}px</label>
                    <input type="range" min={5} max={80} value={brushSize} onChange={(e) => setBrushSize(+e.target.value)} className="w-full" />
                  </div>
                )}
                {touchedUpUrl && (
                  <button onClick={() => { setTouchedUpUrl(""); setActiveTool("none"); }} className="text-xs text-red-500 hover:underline">Reset touch-up</button>
                )}
              </div>
            </ToolbarSection>

            <ToolbarSection
              title="Effects"
              icon={<SparkleIcon />}
              open={activePanel === "effects"}
              onToggle={() => setActivePanel(activePanel === "effects" ? null : "effects")}
            >
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} className="rounded" />
                  Drop Shadow
                </label>
              </div>
            </ToolbarSection>

            <ToolbarSection
              title="Text Overlay"
              icon={<TypeIcon />}
              open={activePanel === "text"}
              onToggle={() => setActivePanel(activePanel === "text" ? null : "text")}
            >
              <div className="space-y-3">
                <input type="text" value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)} placeholder="Enter text..." className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                {textOverlay && (
                  <>
                    <div className="flex gap-2 items-center">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Color</label>
                      <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                      <label className="text-xs text-gray-500 dark:text-gray-400 ml-2">Size</label>
                      <input type="number" value={textSize} onChange={(e) => setTextSize(+e.target.value)} min={12} max={120} className="w-16 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>
                    <div className="flex gap-1">
                      {(["top", "center", "bottom"] as const).map((pos) => (
                        <button key={pos} onClick={() => setTextPosition(pos)} className={tabClass(textPosition === pos) + " capitalize"}>{pos}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </ToolbarSection>

            <ToolbarSection
              title="Resize / Template"
              icon={<CropIcon />}
              open={activePanel === "resize"}
              onToggle={() => setActivePanel(activePanel === "resize" ? null : "resize")}
            >
              <div className="space-y-1">
                {PRESET_TEMPLATES.map((t, i) => (
                  <button
                    key={t.label}
                    onClick={() => setSelectedTemplate(i)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${selectedTemplate === i ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </ToolbarSection>

            <ToolbarSection
              title="Download Options"
              icon={<DownloadIcon />}
              open={activePanel === "download"}
              onToggle={() => setActivePanel(activePanel === "download" ? null : "download")}
            >
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Format</label>
                  <div className="flex gap-1 mt-1">
                    {(["png", "jpg", "webp"] as const).map((fmt) => (
                      <button key={fmt} onClick={() => setDownloadFormat(fmt)} className={tabClass(downloadFormat === fmt) + " uppercase"}>{fmt}</button>
                    ))}
                  </div>
                </div>
                {downloadFormat !== "png" && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Quality: {downloadQuality}%</label>
                    <input type="range" min={10} max={100} value={downloadQuality} onChange={(e) => setDownloadQuality(+e.target.value)} className="w-full" />
                  </div>
                )}
              </div>
            </ToolbarSection>
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div className="flex-1 min-w-0">
          {activeTool !== "none" ? (
            /* Touch-up canvas */
            <div className="max-w-2xl mx-auto">
              <div className="mb-3 text-center text-sm text-gray-500 dark:text-gray-400">
                {activeTool === "erase" ? "Paint to erase parts of the subject" : "Paint to restore erased areas"}
              </div>
              <div className="relative rounded-xl overflow-hidden shadow-lg checkerboard">
                <canvas
                  ref={touchUpCanvasRef}
                  className="w-full h-auto cursor-brush"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onTouchStart={handleCanvasMouseDown}
                  onTouchMove={handleCanvasMouseMove}
                  onTouchEnd={handleCanvasMouseUp}
                />
              </div>
            </div>
          ) : viewMode === "result" ? (
            <div className="max-w-2xl mx-auto">
              <div className={`relative rounded-xl overflow-hidden shadow-lg ${!showOriginal && bgColor === "transparent" && !bgImageUrl && !blurBg ? "checkerboard" : ""}`}>
                <img
                  src={showOriginal ? originalUrl : (previewUrl || resultUrl)}
                  alt={showOriginal ? "Original" : "Result"}
                  className="w-full h-auto"
                />
                <button
                  onMouseDown={() => setShowOriginal(true)}
                  onMouseUp={() => setShowOriginal(false)}
                  onMouseLeave={() => setShowOriginal(false)}
                  onTouchStart={() => setShowOriginal(true)}
                  onTouchEnd={() => setShowOriginal(false)}
                  className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/70 text-white text-xs font-medium rounded-lg backdrop-blur-sm hover:bg-black/80 transition-colors select-none"
                >
                  Hold to see original
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div ref={compareRef} className="compare-slider relative rounded-xl overflow-hidden shadow-lg select-none" onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
                <div className="checkerboard">
                  <img src={previewUrl || resultUrl} alt="Result" className="w-full h-auto block" draggable={false} />
                </div>
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                  <img src={originalUrl} alt="Original" className="w-full h-auto block" style={{ width: compareRef.current ? `${compareRef.current.offsetWidth}px` : "100%", maxWidth: "none" }} draggable={false} />
                </div>
                <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg" style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                  </div>
                </div>
                <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded backdrop-blur-sm">Original</div>
                <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded backdrop-blur-sm">Edited</div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button onClick={handleDownload} className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </button>
            <button onClick={handleShare} className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Share
            </button>
            <button onClick={onReset} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Image
            </button>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg shadow-lg toast-enter z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Helper Components ──

function ToolbarSection({ title, icon, open, onToggle, children }: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <span className="text-gray-400">{icon}</span>
        {title}
        <svg className={`w-4 h-4 ml-auto text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function tabClass(active: boolean) {
  return `flex-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${active ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function saveToHistory(file: File, resultUrl: string) {
  try {
    const history = JSON.parse(localStorage.getItem("bgr-history") || "[]");
    history.unshift({
      name: file.name,
      date: new Date().toISOString(),
      size: file.size,
    });
    if (history.length > 20) history.length = 20;
    localStorage.setItem("bgr-history", JSON.stringify(history));
  } catch { /* ignore quota errors */ }
}

// ── Icons ──
function EyeIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
}
function PaletteIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
}
function BrushIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
}
function SparkleIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
}
function TypeIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" /></svg>;
}
function CropIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function DownloadIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
}
