"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ImageProcessor from "./ImageProcessor";

export default function Hero() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setUrlError("Could not load image. The server may block cross-origin requests. Try downloading first.");
    } finally { setUrlLoading(false); }
  }, [urlInput]);

  const handleReset = useCallback(() => {
    setFiles([]); if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <section id="upload" className="relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-400/10 dark:bg-violet-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {files.length === 0 ? (
          <div className="text-center">
            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-medium rounded-full mb-8 border border-violet-200 dark:border-violet-800">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              AI-Powered &middot; 100% Free &middot; No Signup
            </div>

            <h1 className="animate-fade-up delay-100 text-4xl sm:text-5xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
              Remove Any
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Background</span>
              {" "}Instantly
            </h1>

            <p className="animate-fade-up delay-200 text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Professional background removal in seconds. Your images never leave your browser.
              100% private, powered by cutting-edge AI.
            </p>

            {/* Upload zone */}
            <div
              className={`animate-scale-in delay-300 upload-zone relative max-w-2xl mx-auto border-2 border-dashed rounded-2xl p-10 sm:p-14 cursor-pointer backdrop-blur-sm ${
                dragActive
                  ? "dragging border-violet-500 bg-violet-50/80 dark:bg-violet-950/50"
                  : "border-gray-300/80 dark:border-gray-600/80 bg-white/60 dark:bg-gray-900/60 hover:border-violet-400"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={handleInputChange} />

              <div className="flex flex-col items-center gap-5">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50 rounded-2xl flex items-center justify-center float">
                  <svg className="w-10 h-10 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">Drop your image here</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">or click to browse &middot; batch upload supported</p>
                </div>
                <button type="button" className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5">
                  Choose File(s)
                </button>
                <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG, WebP &middot; Up to 20MB</p>
              </div>
            </div>

            {/* URL Input */}
            <div className="max-w-2xl mx-auto mt-6 animate-fade-up delay-400">
              {!showUrlInput ? (
                <button onClick={(e) => { e.stopPropagation(); setShowUrlInput(true); }} className="text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium">
                  Or paste an image URL
                </button>
              ) : (
                <div className="flex gap-2 items-center">
                  <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()} placeholder="https://example.com/image.jpg" className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" autoFocus />
                  <button onClick={handleUrlSubmit} disabled={urlLoading} className="px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors">{urlLoading ? "Loading..." : "Go"}</button>
                  <button onClick={() => { setShowUrlInput(false); setUrlError(""); }} className="px-3 py-2.5 text-gray-500 text-sm">Cancel</button>
                </div>
              )}
              {urlError && <p className="text-sm text-red-500 mt-2">{urlError}</p>}
            </div>

            {/* Stats */}
            <div className="animate-fade-up delay-500 grid grid-cols-3 gap-6 max-w-lg mx-auto mt-14">
              {[
                { value: "100%", label: "Free Forever" },
                { value: "5s", label: "Avg Processing" },
                { value: "100%", label: "Private & Secure" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
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
    const { removeBackground } = await import("@imgly/background-removal");
    for (let i = 0; i < files.length; i++) {
      setCurrent(i + 1);
      try {
        const blob = await removeBackground(files[i]);
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
          <button onClick={handleDownloadAll} className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download All
          </button>
        )}
        <button onClick={onReset} className="w-full sm:w-auto px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Start Over</button>
      </div>
    </div>
  );
}
