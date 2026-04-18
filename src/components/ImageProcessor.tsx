"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthSafe } from "@/hooks/useAuthSafe";
import { hasClerkKey } from "./AuthProvider";
import { usePremium } from "@/context/PremiumContext";
import AdBanner from "./AdBanner";

const FREE_SCALE = 0.5;

interface ImageProcessorProps {
  file: File;
  onReset: () => void;
}

type Status = "loading-model" | "processing" | "done" | "error";
type Tool = "none" | "erase" | "restore";
type Tab = "edit" | "background" | "effects" | "text" | "export";

const COLORS = [
  "transparent", "#ffffff", "#000000", "#ef4444", "#22c55e", "#3b82f6",
  "#eab308", "#a855f7", "#ec4899", "#6b7280", "#0ea5e9", "#f97316",
];

const TEMPLATES = [
  { label: "Original", width: 0, height: 0 },
  { label: "Square 1:1", width: 1000, height: 1000 },
  { label: "Passport", width: 600, height: 600 },
  { label: "IG Post", width: 1080, height: 1080 },
  { label: "IG Story", width: 1080, height: 1920 },
  { label: "LinkedIn", width: 1584, height: 396 },
  { label: "YT Thumb", width: 1280, height: 720 },
  { label: "FB Cover", width: 820, height: 312 },
];

const GRADIENTS = [
  { label: "Sunset", bg: "#ff6b35, #f7c948" },
  { label: "Ocean", bg: "#667eea, #764ba2" },
  { label: "Forest", bg: "#11998e, #38ef7d" },
  { label: "Night", bg: "#0f0c29, #302b63" },
  { label: "Rose", bg: "#f093fb, #f5576c" },
  { label: "Arctic", bg: "#e0eafc, #cfdef3" },
  { label: "Warm", bg: "#fa709a, #fee140" },
  { label: "Pastel", bg: "#a18cd1, #fbc2eb" },
  { label: "Emerald", bg: "#43e97b, #38f9d7" },
  { label: "Coral", bg: "#ff9a9e, #fad0c4" },
];

export default function ImageProcessor({ file, onReset }: ImageProcessorProps) {
  // Core state
  const [originalUrl, setOriginalUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<Status>("loading-model");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [toast, setToast] = useState("");
  const [originalDimensions, setOriginalDimensions] = useState({ w: 0, h: 0 });

  // Auth
  const { isSignedIn } = useAuthSafe();
  const { isPro, canTouchUp, showUpgrade, state: premiumState, useHDCredit } = usePremium();
  const [showHDPrompt, setShowHDPrompt] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>("edit");

  // View
  const [showOriginal, setShowOriginal] = useState(false);
  const [viewMode, setViewMode] = useState<"result" | "compare">("result");
  const [sliderPos, setSliderPos] = useState(50);
  const compareRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef(false);

  // Background
  const [bgColor, setBgColor] = useState("transparent");
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [blurBg, setBlurBg] = useState(0);
  const bgImageRef = useRef<HTMLInputElement>(null);

  // Touch-up
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

  // Text
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(32);
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">("bottom");

  // Export
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpg" | "webp">("png");
  const [downloadQuality, setDownloadQuality] = useState(92);
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Undo/Redo
  type EditorState = { bgColor: string; bgImageUrl: string; shadow: boolean; blurBg: number; textOverlay: string; textColor: string; textSize: number; textPosition: "top"|"center"|"bottom"; touchedUpUrl: string; selectedTemplate: number };
  const [undoStack, setUndoStack] = useState<EditorState[]>([]);
  const [redoStack, setRedoStack] = useState<EditorState[]>([]);

  const snap = useCallback((): EditorState => ({
    bgColor, bgImageUrl, shadow, blurBg, textOverlay, textColor, textSize, textPosition, touchedUpUrl, selectedTemplate,
  }), [bgColor, bgImageUrl, shadow, blurBg, textOverlay, textColor, textSize, textPosition, touchedUpUrl, selectedTemplate]);

  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), snap()]);
    setRedoStack([]);
  }, [snap]);

  const apply = useCallback((s: EditorState) => {
    setBgColor(s.bgColor); setBgImageUrl(s.bgImageUrl); setShadow(s.shadow); setBlurBg(s.blurBg);
    setTextOverlay(s.textOverlay); setTextColor(s.textColor); setTextSize(s.textSize); setTextPosition(s.textPosition);
    setTouchedUpUrl(s.touchedUpUrl); setSelectedTemplate(s.selectedTemplate);
  }, []);

  const undo = useCallback(() => {
    if (!undoStack.length) return;
    setRedoStack(prev => [...prev, snap()]);
    apply(undoStack[undoStack.length - 1]);
    setUndoStack(s => s.slice(0, -1));
  }, [undoStack, snap, apply]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    setUndoStack(prev => [...prev, snap()]);
    apply(redoStack[redoStack.length - 1]);
    setRedoStack(s => s.slice(0, -1));
  }, [redoStack, snap, apply]);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // ── Effects / Image Loading ──
  useEffect(() => { const u = URL.createObjectURL(file); setOriginalUrl(u); return () => URL.revokeObjectURL(u); }, [file]);
  useEffect(() => { return () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }; }, [resultUrl]);
  useEffect(() => { return () => { if (bgImageUrl) URL.revokeObjectURL(bgImageUrl); }; }, [bgImageUrl]);

  useEffect(() => {
    let cancelled = false;
    const REMBG_API = process.env.NEXT_PUBLIC_REMBG_API_URL;

    async function tryRembgApi(): Promise<Blob | null> {
      if (!REMBG_API) { console.log("[BG] No REMBG_API URL configured"); return null; }
      try {
        console.log("[BG] Trying server API:", REMBG_API);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for cold starts
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch(`${REMBG_API}/remove-bg`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) { console.log("[BG] Server API error:", res.status); return null; }
        console.log("[BG] Server API success!");
        return await res.blob();
      } catch (err) { console.log("[BG] Server API failed, falling back:", err); return null; }
    }

    async function clientSideFallback(): Promise<Blob> {
      setStatus("loading-model"); setProgress(15);
      const { removeBackground } = await import("@imgly/background-removal");
      if (cancelled) throw new Error("cancelled");
      setStatus("processing"); setProgress(30);
      return await removeBackground(file, {
        model: "isnet",
        device: "gpu",
        rescale: false,
        output: { format: "image/png", quality: 1.0 },
        progress: (key: string, cur: number, tot: number) => { if (key === "compute:inference") setProgress(30 + Math.round((cur / tot) * 60)); },
      });
    }

    async function run() {
      try {
        setStatus("processing"); setProgress(10);
        const iv = setInterval(() => setProgress(p => p >= 90 ? (clearInterval(iv), 90) : p + Math.random() * 5), 500);
        // Try rembg server API first, fallback to client-side
        let blob = await tryRembgApi();
        if (cancelled) { clearInterval(iv); return; }
        if (!blob) blob = await clientSideFallback();
        clearInterval(iv);
        if (cancelled) return;
        setResultBlob(blob);
        const u = URL.createObjectURL(blob);
        setResultUrl(u); setProgress(100); setStatus("done");
        saveToHistory(file);
      } catch (err) { if (!cancelled) { setErrorMsg(err instanceof Error ? err.message : "Failed"); setStatus("error"); } }
    }
    run();
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => {
    if (!resultUrl) return;
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => { resultImageRef.current = img; setOriginalDimensions({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.src = resultUrl;
  }, [resultUrl]);

  useEffect(() => {
    if (!originalUrl) return;
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => { originalImageRef.current = img; };
    img.src = originalUrl;
  }, [originalUrl]);

  // Touch-up canvas init
  useEffect(() => {
    if (activeTool === "none" || !resultImageRef.current || !touchUpCanvasRef.current) return;
    const canvas = touchUpCanvasRef.current; const img = resultImageRef.current;
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!; ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (touchedUpUrl) {
      const ti = new Image(); ti.crossOrigin = "anonymous";
      ti.onload = () => { ctx.drawImage(ti, 0, 0); originalImageData.current = ctx.getImageData(0, 0, canvas.width, canvas.height); };
      ti.src = touchedUpUrl;
    } else { ctx.drawImage(img, 0, 0); originalImageData.current = ctx.getImageData(0, 0, canvas.width, canvas.height); }
  }, [activeTool, resultUrl, touchedUpUrl]);

  // Touch-up drawing
  const getCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const c = touchUpCanvasRef.current; if (!c) return null;
    const r = c.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: (cx - r.left) * (c.width / r.width), y: (cy - r.top) * (c.height / r.height) };
  }, []);

  const brush = useCallback((x: number, y: number) => {
    const c = touchUpCanvasRef.current; if (!c || !originalImageRef.current) return;
    const ctx = c.getContext("2d")!;
    const s = brushSize * (c.width / c.getBoundingClientRect().width);
    if (activeTool === "erase") {
      ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc(x, y, s / 2, 0, Math.PI * 2); ctx.fill();
    } else if (activeTool === "restore") {
      ctx.globalCompositeOperation = "source-over"; ctx.save(); ctx.beginPath(); ctx.arc(x, y, s / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(originalImageRef.current, 0, 0, c.width, c.height); ctx.restore();
    }
  }, [activeTool, brushSize]);

  const onCanvasDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool === "none") return; e.preventDefault(); isDrawing.current = true;
    const p = getCoords(e); if (p) { lastPoint.current = p; brush(p.x, p.y); }
  }, [activeTool, getCoords, brush]);

  const onCanvasMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || activeTool === "none") return; e.preventDefault();
    const p = getCoords(e);
    if (p && lastPoint.current) {
      const dx = p.x - lastPoint.current.x, dy = p.y - lastPoint.current.y;
      const d = Math.sqrt(dx * dx + dy * dy), steps = Math.max(1, Math.floor(d / 2));
      for (let i = 0; i <= steps; i++) { const t = i / steps; brush(lastPoint.current.x + dx * t, lastPoint.current.y + dy * t); }
      lastPoint.current = p;
    }
  }, [activeTool, getCoords, brush]);

  const onCanvasUp = useCallback(() => {
    if (!isDrawing.current) return; isDrawing.current = false; lastPoint.current = null;
    if (touchUpCanvasRef.current) setTouchedUpUrl(touchUpCanvasRef.current.toDataURL("image/png"));
  }, []);

  // Composite generator
  const composite = useCallback(async (maxPx?: number): Promise<string> => {
    const img = touchedUpUrl ? await loadImg(touchedUpUrl) : resultImageRef.current || await loadImg(resultUrl);
    const t = TEMPLATES[selectedTemplate];
    let W = t.width || img.naturalWidth, H = t.height || img.naturalHeight;
    if (maxPx && (W > maxPx || H > maxPx)) { const r = Math.min(maxPx / W, maxPx / H); W = Math.round(W * r); H = Math.round(H * r); }
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d")!;
    if (blurBg > 0 && originalImageRef.current) { ctx.filter = `blur(${blurBg}px)`; ctx.drawImage(originalImageRef.current, 0, 0, W, H); ctx.filter = "none"; }
    else if (bgImageUrl) { const bi = await loadImg(bgImageUrl); ctx.drawImage(bi, 0, 0, W, H); }
    else if (bgColor !== "transparent") { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H); }
    if (shadow) { ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 30; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 10; }
    const sc = Math.min(W / img.naturalWidth, H / img.naturalHeight);
    ctx.drawImage(img, (W - img.naturalWidth * sc) / 2, (H - img.naturalHeight * sc) / 2, img.naturalWidth * sc, img.naturalHeight * sc);
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    if (textOverlay) {
      ctx.font = `bold ${textSize}px sans-serif`; ctx.fillStyle = textColor; ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2;
      const y = textPosition === "top" ? textSize + 20 : textPosition === "center" ? H / 2 + textSize / 3 : H - 40;
      ctx.strokeText(textOverlay, W / 2, y); ctx.fillText(textOverlay, W / 2, y);
    }
    const mime = downloadFormat === "jpg" ? "image/jpeg" : downloadFormat === "webp" ? "image/webp" : "image/png";
    return cv.toDataURL(mime, downloadQuality / 100);
  }, [touchedUpUrl, resultUrl, selectedTemplate, blurBg, bgImageUrl, bgColor, shadow, textOverlay, textColor, textSize, textPosition, downloadFormat, downloadQuality]);

  useEffect(() => {
    if (status !== "done") return;
    const t = setTimeout(() => { composite().then(setPreviewUrl); }, 100);
    return () => clearTimeout(t);
  }, [status, composite]);

  const previewW = Math.round(originalDimensions.w * FREE_SCALE);
  const previewH = Math.round(originalDimensions.h * FREE_SCALE);

  const dlFree = useCallback(async () => {
    const d = await composite(Math.max(previewW, previewH) || 500);
    const a = document.createElement("a"); a.href = d; a.download = `${file.name.replace(/\.[^.]+$/, "")}-preview.${downloadFormat}`; a.click();
    setShowDownloadDropdown(false); notify(`Downloaded (${previewW}x${previewH})`);
  }, [composite, file.name, downloadFormat, previewW, previewH]);

  const dlHD = useCallback(async () => {
    if (!isSignedIn) { setShowHDPrompt(true); return; }
    if (!isPro && !useHDCredit()) { showUpgrade("HD Downloads"); return; }
    const d = await composite();
    const a = document.createElement("a"); a.href = d; a.download = `${file.name.replace(/\.[^.]+$/, "")}-hd.${downloadFormat}`; a.click();
    setShowDownloadDropdown(false); notify("HD downloaded!");
  }, [composite, file.name, downloadFormat, isSignedIn, isPro, useHDCredit, showUpgrade]);

  const share = useCallback(async () => {
    const d = await composite(); const r = await fetch(d); const b = await r.blob();
    const f = new File([b], `edited.${downloadFormat}`, { type: b.type });
    if (navigator.share && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: "BG Remover" }); }
    else { try { await navigator.clipboard.write([new ClipboardItem({ [b.type]: b })]); notify("Copied to clipboard!"); } catch { notify("Share not supported"); } }
  }, [composite, downloadFormat]);

  const handleBgImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    pushUndo(); if (bgImageUrl) URL.revokeObjectURL(bgImageUrl);
    setBgImageUrl(URL.createObjectURL(f)); setBgColor("transparent"); setBlurBg(0);
  }, [bgImageUrl, pushUndo]);

  const applyGradient = useCallback((colors: string) => {
    pushUndo();
    const c = document.createElement("canvas"); c.width = 400; c.height = 400;
    const ctx = c.getContext("2d")!;
    const cols = colors.split(",").map(s => s.trim());
    const g = ctx.createLinearGradient(0, 0, 400, 400);
    cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 400, 400);
    setBgImageUrl(c.toDataURL()); setBgColor("transparent"); setBlurBg(0);
  }, [pushUndo]);

  // Compare slider
  useEffect(() => {
    const mv = (e: MouseEvent) => { if (isDraggingSlider.current && compareRef.current) { const r = compareRef.current.getBoundingClientRect(); setSliderPos(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))); } };
    const up = () => { isDraggingSlider.current = false; };
    const tmv = (e: TouchEvent) => { if (isDraggingSlider.current && compareRef.current) { const r = compareRef.current.getBoundingClientRect(); setSliderPos(Math.max(0, Math.min(100, ((e.touches[0].clientX - r.left) / r.width) * 100))); } };
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", tmv); window.addEventListener("touchend", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); window.removeEventListener("touchmove", tmv); window.removeEventListener("touchend", up); };
  }, []);

  // ── Loading State ──
  if (status === "loading-model" || status === "processing") {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {status === "loading-model" ? "Loading AI Model..." : "Removing Background..."}
        </h2>
        <div className="max-w-md mx-auto mb-8">
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="progress-bar h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {status === "loading-model" ? "Downloading AI model (first time only)..." : `Processing... ${Math.round(progress)}%`}
          </p>
        </div>
        {originalUrl && <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-lg opacity-50"><img src={originalUrl} alt="Original" className="w-full max-h-[65vh] object-contain" /></div>}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Something went wrong</h2>
        <p className="text-gray-500 mb-6">{errorMsg}</p>
        <button onClick={onReset} className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700">Try Again</button>
      </div>
    );
  }

  // ── Editor UI ──
  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "edit", label: "Edit", icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
    { id: "background", label: "Background", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "effects", label: "Effects", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
    { id: "text", label: "Text", icon: "M4 6h16M4 12h8m-8 6h16" },
    { id: "export", label: "Export", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" },
  ];

  return (
    <div className="animate-fade-up">
      {/* ══ Top Toolbar ══ */}
      <div className="flex items-center justify-between mb-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-2.5">
        <div className="flex items-center gap-1">
          <ToolBtn onClick={undo} disabled={!undoStack.length} title="Undo (Ctrl+Z)">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </ToolBtn>
          <ToolBtn onClick={redo} disabled={!redoStack.length} title="Redo (Ctrl+Y)">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </ToolBtn>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
          <ToolBtn onClick={() => setViewMode(viewMode === "result" ? "compare" : "result")} title="Compare">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </ToolBtn>
        </div>

        <p className="hidden sm:block text-xs text-gray-400 dark:text-gray-500">
          {originalDimensions.w} x {originalDimensions.h}px
        </p>

        <div className="flex items-center gap-2">
          <button onClick={share} className="p-2 rounded-xl text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors" title="Share">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
          {/* Download dropdown */}
          <div className="relative">
            <button onClick={() => setShowDownloadDropdown(!showDownloadDropdown)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-full text-sm hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20 transition-all">
              Download
              <svg className={`w-3.5 h-3.5 transition-transform ${showDownloadDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showDownloadDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDownloadDropdown(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-up">
                  {/* Free download */}
                  <button onClick={dlFree} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{previewW} x {previewH}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 text-[11px] font-bold rounded-full">Free</span>
                  </button>
                  {/* HD download / Unlock */}
                  {isSignedIn ? (
                    <button onClick={dlHD} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{originalDimensions.w} x {originalDimensions.h}</p>
                      </div>
                      {isPro ? <span className="px-2.5 py-1 bg-green-100 text-green-600 text-[11px] font-bold rounded-full">Pro</span>
                       : <span className="px-2.5 py-1 bg-violet-100 text-violet-600 text-[11px] font-bold rounded-full">{premiumState.credits} credits</span>}
                    </button>
                  ) : (
                    <a href="/pricing" className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{originalDimensions.w} x {originalDimensions.h}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-400 text-white text-[11px] font-bold rounded-full cursor-pointer hover:bg-amber-500 transition-colors">Unlock</span>
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* ══ Left: Tab Sidebar ══ */}
        <div className="lg:w-72 flex-shrink-0">
          {/* Tab bar */}
          <div className="flex lg:grid lg:grid-cols-5 gap-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-1.5 mb-3">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 min-h-[300px]">
            {/* ── Edit Tab ── */}
            {activeTab === "edit" && (
              <div className="space-y-5">
                <Section title="Touch Up">
                  {canTouchUp ? (
                    <>
                      <div className="flex gap-2">
                        <PillBtn active={activeTool === "erase"} onClick={() => setActiveTool(activeTool === "erase" ? "none" : "erase")}>Erase</PillBtn>
                        <PillBtn active={activeTool === "restore"} onClick={() => setActiveTool(activeTool === "restore" ? "none" : "restore")}>Restore</PillBtn>
                      </div>
                      {activeTool !== "none" && (
                        <div className="mt-3">
                          <label className="text-[11px] text-gray-400 font-medium">Brush size: {brushSize}px</label>
                          <input type="range" min={5} max={80} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-full mt-1" />
                        </div>
                      )}
                      {touchedUpUrl && <button onClick={() => { setTouchedUpUrl(""); setActiveTool("none"); }} className="text-[11px] text-red-500 hover:underline mt-1">Reset touch-up</button>}
                    </>
                  ) : (
                    <button onClick={() => showUpgrade("Touch-Up Editor")} className="w-full py-2 text-[11px] font-medium bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50">Upgrade to Pro</button>
                  )}
                </Section>
                <Section title="Resize">
                  <div className="grid grid-cols-2 gap-1.5">
                    {TEMPLATES.map((t, i) => (
                      <button key={t.label} onClick={() => { pushUndo(); setSelectedTemplate(i); }}
                        className={`text-[11px] px-2.5 py-2 rounded-lg font-medium transition-colors ${selectedTemplate === i ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {/* ── Background Tab ── */}
            {activeTab === "background" && (
              <div className="space-y-5">
                <Section title="Solid Colors">
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => { pushUndo(); setBgColor(c); setBgImageUrl(""); setBlurBg(0); }} title={c}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${bgColor === c && !bgImageUrl && !blurBg ? "border-violet-500 scale-110 shadow-md" : "border-gray-200 dark:border-gray-700 hover:border-gray-400"} ${c === "transparent" ? "checkerboard" : ""}`}
                        style={c !== "transparent" ? { backgroundColor: c } : undefined} />
                    ))}
                    <div className="relative">
                      <input type="color" value={bgColor === "transparent" ? "#ffffff" : bgColor} onChange={e => { pushUndo(); setBgColor(e.target.value); setBgImageUrl(""); setBlurBg(0); }} className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer" />
                      <div className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-700" style={{ background: "conic-gradient(red,yellow,lime,aqua,blue,magenta,red)" }} />
                    </div>
                  </div>
                </Section>
                <Section title="Gradients">
                  <div className="grid grid-cols-5 gap-1.5">
                    {GRADIENTS.map(g => (
                      <button key={g.label} onClick={() => applyGradient(g.bg)} title={g.label}
                        className="aspect-square rounded-lg border border-gray-200 dark:border-gray-700 hover:border-violet-400 hover:scale-105 transition-all"
                        style={{ background: `linear-gradient(135deg, ${g.bg})` }} />
                    ))}
                  </div>
                </Section>
                <Section title="Image">
                  <input ref={bgImageRef} type="file" accept="image/*" className="hidden" onChange={handleBgImage} />
                  <button onClick={() => bgImageRef.current?.click()} className="w-full py-2.5 text-[11px] font-medium bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">Upload Background Image</button>
                  {bgImageUrl && <button onClick={() => { pushUndo(); setBgImageUrl(""); }} className="text-[11px] text-red-500 hover:underline mt-1">Remove</button>}
                </Section>
                <Section title="Blur Original">
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={30} value={blurBg} onChange={e => { if (!blurBg && +e.target.value > 0) pushUndo(); setBlurBg(+e.target.value); if (+e.target.value > 0) { setBgImageUrl(""); setBgColor("transparent"); } }} className="flex-1" />
                    <span className="text-[11px] text-gray-400 w-8 text-right">{blurBg}px</span>
                  </div>
                </Section>
              </div>
            )}

            {/* ── Effects Tab ── */}
            {activeTab === "effects" && (
              <div className="space-y-5">
                <Section title="Shadow">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${shadow ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"}`} onClick={() => { pushUndo(); setShadow(!shadow); }}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${shadow ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Drop Shadow</span>
                  </label>
                </Section>
              </div>
            )}

            {/* ── Text Tab ── */}
            {activeTab === "text" && (
              <div className="space-y-5">
                <Section title="Text Overlay">
                  <input type="text" value={textOverlay} onChange={e => setTextOverlay(e.target.value)} placeholder="Type your text..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </Section>
                {textOverlay && (
                  <>
                    <Section title="Style">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-gray-400">Color</label>
                          <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-7 h-7 rounded-lg cursor-pointer border-0" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-gray-400">Size</label>
                          <input type="number" value={textSize} onChange={e => setTextSize(+e.target.value)} min={12} max={120}
                            className="w-16 px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                        </div>
                      </div>
                    </Section>
                    <Section title="Position">
                      <div className="flex gap-1.5">
                        {(["top", "center", "bottom"] as const).map(p => (
                          <PillBtn key={p} active={textPosition === p} onClick={() => setTextPosition(p)}>{p}</PillBtn>
                        ))}
                      </div>
                    </Section>
                  </>
                )}
              </div>
            )}

            {/* ── Export Tab ── */}
            {activeTab === "export" && (
              <div className="space-y-5">
                <Section title="Format">
                  <div className="flex gap-2">
                    {(["png", "jpg", "webp"] as const).map(f => (
                      <button key={f} onClick={() => setDownloadFormat(f)}
                        className={`flex-1 py-2.5 text-sm font-bold uppercase rounded-xl transition-all ${downloadFormat === f ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </Section>
                {downloadFormat !== "png" && (
                  <Section title={`Quality: ${downloadQuality}%`}>
                    <input type="range" min={10} max={100} value={downloadQuality} onChange={e => setDownloadQuality(+e.target.value)} className="w-full" />
                  </Section>
                )}
                <div className="pt-2 space-y-2">
                  <button onClick={dlFree} className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm">
                    Download <span className="text-gray-400 font-normal">{previewW} x {previewH}</span> <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full ml-1">Free</span>
                  </button>
                  {isSignedIn ? (
                    <button onClick={dlHD} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/20 text-sm flex items-center justify-center gap-2">
                      Download HD <span className="text-violet-200">{originalDimensions.w} x {originalDimensions.h}</span>
                      {!isPro && <span className="px-1.5 py-0.5 bg-white/20 text-[10px] font-bold rounded">{premiumState.credits} cr</span>}
                    </button>
                  ) : (
                    <a href="/pricing" className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-2">
                      Unlock HD <span className="text-amber-100">{originalDimensions.w} x {originalDimensions.h}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={onReset} className="w-full mt-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            + New Image
          </button>
        </div>

        {/* ══ Center: Canvas ══ */}
        <div className="flex-1 min-w-0">
          {activeTool !== "none" ? (
            <div>
              <p className="text-center text-xs text-gray-400 mb-2">{activeTool === "erase" ? "Paint to erase" : "Paint to restore"}</p>
              <div className="rounded-2xl overflow-hidden shadow-lg checkerboard max-h-[80vh] flex items-center justify-center">
                <canvas ref={touchUpCanvasRef} className="max-w-full max-h-[80vh] cursor-crosshair"
                  onMouseDown={onCanvasDown} onMouseMove={onCanvasMove} onMouseUp={onCanvasUp} onMouseLeave={onCanvasUp}
                  onTouchStart={onCanvasDown} onTouchMove={onCanvasMove} onTouchEnd={onCanvasUp} />
              </div>
            </div>
          ) : viewMode === "compare" ? (
            <div ref={compareRef} className="relative rounded-2xl overflow-hidden shadow-lg select-none cursor-ew-resize max-h-[80vh]" onMouseDown={() => { isDraggingSlider.current = true; }} onTouchStart={() => { isDraggingSlider.current = true; }}>
              <div className="checkerboard"><img src={previewUrl || resultUrl} alt="Result" className="max-w-full max-h-[80vh] object-contain block" draggable={false} /></div>
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                <img src={originalUrl} alt="Original" className="h-full block" style={{ width: compareRef.current ? `${compareRef.current.offsetWidth}px` : "100%", maxWidth: "none" }} draggable={false} />
              </div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${sliderPos}%` }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                </div>
              </div>
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 text-white text-[10px] font-medium rounded backdrop-blur-sm">Original</div>
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/50 text-white text-[10px] font-medium rounded backdrop-blur-sm">Edited</div>
            </div>
          ) : (
            <div className={`relative rounded-2xl overflow-hidden shadow-lg max-h-[80vh] flex items-center justify-center ${bgColor === "transparent" && !bgImageUrl && !blurBg ? "checkerboard" : ""}`}>
              <img src={showOriginal ? originalUrl : (previewUrl || resultUrl)} alt="Result" className="max-w-full max-h-[80vh] object-contain" />
              <button onMouseDown={() => setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)} onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)} onTouchEnd={() => setShowOriginal(false)}
                className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 text-white text-[11px] font-medium rounded-lg backdrop-blur-sm hover:bg-black/70 select-none">
                Hold to see original
              </button>
            </div>
          )}

          {/* HD prompt */}
          {showHDPrompt && !isSignedIn && (
            <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 rounded-xl text-center animate-fade-up">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3"><span className="font-bold">Sign up for free</span> to download HD images</p>
              <div className="flex items-center justify-center gap-3">
                <HDSignUpBtn />
                <button onClick={() => setShowHDPrompt(false)} className="text-xs text-gray-400">Later</button>
              </div>
            </div>
          )}

          {!isPro && (
            <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-3">
              Free: {premiumState.dailyProcessed}/10 today &middot; {premiumState.credits} HD credits &middot; <a href="/pricing" className="text-violet-600 dark:text-violet-400 hover:underline">Upgrade</a>
            </p>
          )}

          <div className="mt-4"><AdBanner slot="editor-bottom" format="horizontal" /></div>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl shadow-xl toast-enter z-50">{toast}</div>}
    </div>
  );
}

// ── Sub-components ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">{title}</h4>
      {children}
    </div>
  );
}

function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize ${active ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
      {children}
    </button>
  );
}

function ToolBtn({ onClick, disabled, title, children }: { onClick: () => void; disabled?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">{children}</svg>
    </button>
  );
}

function HDSignUpBtn() {
  return <a href="/signup" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-lg inline-block hover:from-violet-700 hover:to-indigo-700 transition-all">Sign Up Free</a>;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
}

function saveToHistory(file: File) {
  try {
    const h = JSON.parse(localStorage.getItem("bgr-history") || "[]");
    h.unshift({ name: file.name, date: new Date().toISOString(), size: file.size });
    if (h.length > 20) h.length = 20;
    localStorage.setItem("bgr-history", JSON.stringify(h));
  } catch { /* ignore */ }
}
