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
    if (imageFiles.length > 0) {
      setFiles(imageFiles);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      handleFiles(selected);
    },
    [handleFiles]
  );

  const handleUrlSubmit = useCallback(async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    setUrlError("");
    try {
      const res = await fetch(urlInput.trim());
      if (!res.ok) throw new Error("Failed to fetch image");
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) throw new Error("URL is not an image");
      const fileName = urlInput.split("/").pop()?.split("?")[0] || "image.png";
      const file = new File([blob], fileName, { type: blob.type });
      setFiles([file]);
      setShowUrlInput(false);
      setUrlInput("");
    } catch {
      setUrlError("Could not load image from URL. Check the link and try again.");
    } finally {
      setUrlLoading(false);
    }
  }, [urlInput]);

  const handleReset = useCallback(() => {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <section id="upload" className="py-16 sm:py-24 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {files.length === 0 ? (
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Remove Image Background
              <br />
              <span className="text-blue-600">In Seconds</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              100% automatic, free, and private. AI-powered background removal
              that runs entirely in your browser.
            </p>

            <div
              className={`upload-zone relative max-w-2xl mx-auto border-2 border-dashed rounded-2xl p-12 sm:p-16 cursor-pointer ${
                dragActive
                  ? "dragging border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={handleInputChange}
              />

              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Upload Image(s)</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Drag & drop or click to browse. Select multiple for batch processing.</p>
                </div>

                <button
                  type="button"
                  className="mt-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
                >
                  Choose File(s)
                </button>

                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Supports PNG, JPG, WebP &middot; Max 20MB
                </p>
              </div>
            </div>

            {/* URL Upload */}
            <div className="max-w-2xl mx-auto mt-6">
              {!showUrlInput ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowUrlInput(true); }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Or paste an image URL
                </button>
              ) : (
                <div className="flex gap-2 items-center">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleUrlSubmit}
                    disabled={urlLoading}
                    className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {urlLoading ? "Loading..." : "Go"}
                  </button>
                  <button
                    onClick={() => { setShowUrlInput(false); setUrlError(""); }}
                    className="px-3 py-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {urlError && <p className="text-sm text-red-500 mt-2">{urlError}</p>}
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

  const processAll = useCallback(async () => {
    const { removeBackground } = await import("@imgly/background-removal");
    for (let i = 0; i < files.length; i++) {
      setCurrent(i + 1);
      try {
        const blob = await removeBackground(files[i]);
        const url = URL.createObjectURL(blob);
        setResults((prev) => new Map(prev).set(files[i].name, url));
      } catch {
        setResults((prev) => new Map(prev).set(files[i].name, "error"));
      }
    }
    setProcessing(false);
  }, [files]);

  useEffect(() => { processAll(); }, [processAll]);

  const handleDownloadAll = useCallback(() => {
    results.forEach((url, name) => {
      if (url === "error") return;
      const a = document.createElement("a");
      a.href = url;
      a.download = name.replace(/\.[^.]+$/, "") + "-no-bg.png";
      a.click();
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
              <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${(results.size / files.length) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {files.map((file) => {
          const result = results.get(file.name);
          return (
            <div key={file.name} className="relative rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="checkerboard aspect-square flex items-center justify-center">
                {result && result !== "error" ? (
                  <img src={result} alt={file.name} className="w-full h-full object-contain" />
                ) : result === "error" ? (
                  <div className="text-red-500 text-xs text-center p-2">Failed</div>
                ) : (
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="p-2 text-xs text-gray-600 dark:text-gray-400 truncate">{file.name}</div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {!processing && (
          <button onClick={handleDownloadAll} className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download All
          </button>
        )}
        <button onClick={onReset} className="w-full sm:w-auto px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          Start Over
        </button>
      </div>
    </div>
  );
}
