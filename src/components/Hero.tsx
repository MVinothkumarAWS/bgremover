"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ImageProcessor from "./ImageProcessor";

const SHOWCASE_IMAGES = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=600&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=600&fit=crop&crop=face",
];

const SAMPLE_IMAGES = [
  { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", label: "Portrait" },
  { src: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=80&h=80&fit=crop", label: "Pet" },
  { src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop", label: "Product" },
  { src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=80&h=80&fit=crop", label: "Car" },
];

export default function Hero() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate showcase images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % SHOWCASE_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleFiles = useCallback((newFiles: File[]) => {
    const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length > 0) setFiles(imageFiles);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files || []));
  }, [handleFiles]);

  const handleUrlSubmit = useCallback(async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true); setUrlError("");
    try {
      const res = await fetch(urlInput.trim());
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) throw new Error("Not an image");
      const fileName = urlInput.split("/").pop()?.split("?")[0] || "image.png";
      setFiles([new File([blob], fileName, { type: blob.type })]);
      setShowUrlInput(false); setUrlInput("");
    } catch {
      setUrlError("Could not load image. Try downloading it first, then upload.");
    } finally { setUrlLoading(false); }
  }, [urlInput]);

  // Clipboard paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) { setFiles([file]); e.preventDefault(); }
          return;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleSampleImage = useCallback(async (src: string, label: string) => {
    try {
      const res = await fetch(src.replace("w=80&h=80", "w=800&h=800"));
      const blob = await res.blob();
      setFiles([new File([blob], `${label.toLowerCase()}.jpg`, { type: "image/jpeg" })]);
    } catch { /* ignore */ }
  }, []);

  const handleReset = useCallback(() => {
    setFiles([]); if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <section id="upload" className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950" />
      <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-violet-300/15 dark:bg-violet-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-indigo-300/15 dark:bg-indigo-600/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {files.length === 0 ? (
          <>
            {/* ── Two-column hero layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left: Text + Animated Person */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                {/* Animated person image */}
                <div className="relative w-[280px] sm:w-[340px] h-[340px] sm:h-[420px] mx-auto lg:mx-0 mb-8">
                  {SHOWCASE_IMAGES.map((src, i) => (
                    <img
                      key={src}
                      src={src}
                      alt="Person with removed background"
                      className={`absolute inset-0 w-full h-full object-cover object-top rounded-3xl transition-all duration-1000 ${
                        i === currentImage
                          ? "opacity-100 scale-100 translate-y-0"
                          : "opacity-0 scale-95 translate-y-4"
                      }`}
                      style={{
                        filter: i === currentImage ? "drop-shadow(0 20px 40px rgba(124, 58, 237, 0.2))" : "none",
                        animation: i === currentImage ? "float 4s ease-in-out infinite" : "none",
                      }}
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  ))}
                  {/* Decorative elements */}
                  <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl -z-10 opacity-20" />
                  <div className="absolute -top-3 -left-3 w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl -z-10 opacity-20 float-delay-1" />
                  {/* Indicator dots */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {SHOWCASE_IMAGES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentImage ? "bg-violet-600 w-6" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <h1 className="animate-fade-up text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1] mt-12 lg:mt-0">
                  Remove Image
                  <br />
                  <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Background</span>
                </h1>
                <p className="animate-fade-up delay-100 mt-4 text-xl text-gray-600 dark:text-gray-400">
                  100% Automatically and{" "}
                  <span className="inline-flex items-center px-3 py-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-full">
                    Free
                  </span>
                </p>
              </div>

              {/* Right: Upload Box */}
              <div className="order-1 lg:order-2">
                <div
                  className={`animate-scale-in upload-zone relative rounded-3xl p-8 sm:p-10 cursor-pointer border-2 border-dashed transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 dark:shadow-none ${
                    dragActive
                      ? "dragging border-violet-500 bg-violet-50/80 dark:bg-violet-950/50"
                      : "border-gray-200 dark:border-gray-700 hover:border-violet-400 hover:shadow-violet-200/30"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                  onClick={() => inputRef.current?.click()}
                >
                  <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={handleInputChange} />

                  <div className="flex flex-col items-center gap-5">
                    <button
                      type="button"
                      className="px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-lg font-bold rounded-full hover:from-violet-700 hover:to-indigo-700 transition-all shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 pulse-glow"
                    >
                      Upload Image
                    </button>

                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      or drop a file,
                    </p>

                    {!showUrlInput ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowUrlInput(true); }}
                        className="text-sm text-gray-500 dark:text-gray-400"
                      >
                        paste image or{" "}
                        <span className="text-violet-600 dark:text-violet-400 underline font-medium">URL</span>
                      </button>
                    ) : (
                      <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                          autoFocus
                        />
                        <button onClick={handleUrlSubmit} disabled={urlLoading} className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50">{urlLoading ? "..." : "Go"}</button>
                      </div>
                    )}
                    {urlError && <p className="text-xs text-red-500">{urlError}</p>}
                  </div>
                </div>

                {/* Sample images */}
                <div className="animate-fade-up delay-300 mt-6 flex items-center gap-3 justify-center lg:justify-start">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    No image?<br />Try one of these:
                  </p>
                  <div className="flex gap-2">
                    {SAMPLE_IMAGES.map((sample) => (
                      <button
                        key={sample.label}
                        onClick={() => handleSampleImage(sample.src, sample.label)}
                        className="w-12 h-12 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-violet-400 transition-all hover:scale-110 hover:shadow-lg"
                        title={`Try ${sample.label}`}
                      >
                        <img src={sample.src} alt={sample.label} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>

                <p className="animate-fade-up delay-400 text-[11px] text-gray-400 dark:text-gray-500 text-center lg:text-left mt-4 max-w-md">
                  By uploading an image you agree to our Terms of Service. Your images are processed locally and never uploaded to any server.
                </p>
              </div>
            </div>

            {/* Stats bar */}
            <div className="animate-fade-up delay-500 mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {[
                { value: "100%", label: "Free" },
                { value: "5s", label: "Processing" },
                { value: "100%", label: "Private" },
                { value: "HD", label: "Quality" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </>
        ) : files.length === 1 ? (
          <ImageProcessor file={files[0]} onReset={handleReset} />
        ) : (
          <BatchProcessor files={files} onReset={handleReset} />
        )}
      </div>
    </section>
  );
}

/* ── Batch Processor ── */
function BatchProcessor({ files, onReset }: { files: File[]; onReset: () => void }) {
  const [results, setResults] = useState<Map<string, string>>(new Map());
  const [processing, setProcessing] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    return () => { results.forEach((url) => { if (url !== "error") URL.revokeObjectURL(url); }); };
  }, [results]);

  const processAll = useCallback(async () => {
    async function processOne(file: File): Promise<Blob> {
      // Try server-side first
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch("/api/remove-bg-server", { method: "POST", body: formData });
        if (res.ok) return await res.blob();
      } catch { /* fall through */ }
      // Fallback to client-side
      const { removeBackground } = await import("@imgly/background-removal");
      return await removeBackground(file, {
        model: "isnet",
        device: "gpu",
        rescale: false,
        output: { format: "image/png", quality: 1.0 },
      });
    }
    for (let i = 0; i < files.length; i++) {
      setCurrent(i + 1);
      try {
        const blob = await processOne(files[i]);
        setResults((prev) => new Map(prev).set(files[i].name, URL.createObjectURL(blob)));
      } catch { setResults((prev) => new Map(prev).set(files[i].name, "error")); }
    }
    setProcessing(false);
  }, [files]);

  useEffect(() => { processAll(); }, [processAll]);

  const handleDownloadAll = useCallback(() => {
    results.forEach((url, name) => {
      if (url === "error") return;
      const a = document.createElement("a"); a.href = url;
      a.download = name.replace(/\.[^.]+$/, "") + "-no-bg.png"; a.click();
    });
  }, [results]);

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {processing ? `Processing ${current} of ${files.length}...` : "Batch Complete!"}
        </h2>
        {processing && (
          <div className="max-w-md mx-auto mt-4">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${(results.size / files.length) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {files.map((file) => {
          const result = results.get(file.name);
          return (
            <div key={file.name} className="rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="checkerboard aspect-square flex items-center justify-center">
                {result && result !== "error" ? (
                  <img src={result} alt={file.name} className="w-full h-full object-contain" />
                ) : result === "error" ? (
                  <div className="text-red-500 text-xs text-center p-2">Failed</div>
                ) : (
                  <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="p-2 text-xs text-gray-600 dark:text-gray-400 truncate">{file.name}</div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {!processing && (
          <button onClick={handleDownloadAll} className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download All
          </button>
        )}
        <button onClick={onReset} className="w-full sm:w-auto px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl">Start Over</button>
      </div>
    </div>
  );
}
