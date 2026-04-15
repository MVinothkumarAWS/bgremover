"use client";

import { useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FileItem {
  id: string;
  file: File;
  originalFormat: string;
  originalSize: number;
  convertedBlob: Blob | null;
  convertedSize: number;
  status: "pending" | "converting" | "done" | "error";
  previewUrl: string;
  error?: string;
}

export default function ConvertToJpgPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(90);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ["image/png", "image/gif", "image/webp", "image/svg+xml"];

  const formatLabel = (mime: string) => {
    const map: Record<string, string> = {
      "image/png": "PNG",
      "image/gif": "GIF",
      "image/webp": "WebP",
      "image/svg+xml": "SVG",
    };
    return map[mime] || mime;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const newItems: FileItem[] = [];
    for (const file of Array.from(incoming)) {
      if (!acceptedTypes.includes(file.type)) continue;
      newItems.push({
        id: crypto.randomUUID(),
        file,
        originalFormat: file.type,
        originalSize: file.size,
        convertedBlob: null,
        convertedSize: 0,
        status: "pending",
        previewUrl: URL.createObjectURL(file),
      });
    }
    setFiles((prev) => [...prev, ...newItems]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const convertOne = useCallback(
    (item: FileItem, q: number, bg: string): Promise<FileItem> => {
      return new Promise((resolve) => {
        // Read the original file as a data URL to preserve transparency info
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d")!;
            // Fill with chosen background color FIRST (for transparent areas)
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Then draw the image on top
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({
                    ...item,
                    convertedBlob: blob,
                    convertedSize: blob.size,
                    status: "done",
                  });
                } else {
                  resolve({ ...item, status: "error", error: "Conversion failed" });
                }
              },
              "image/jpeg",
              q / 100
            );
          };
          img.onerror = () => resolve({ ...item, status: "error", error: "Could not load image" });
          img.src = reader.result as string;
        };
        reader.onerror = () => resolve({ ...item, status: "error", error: "Could not read file" });
        reader.readAsDataURL(item.file);
      });
    },
    []
  );

  // Use a ref to always have the latest files for the convert loop
  const filesRef = useRef<FileItem[]>([]);
  filesRef.current = files;

  const convertAll = useCallback(async () => {
    const currentFiles = filesRef.current;
    setFiles((prev) => prev.map((f) => (f.status !== "done" ? { ...f, status: "converting" as const } : f)));

    for (let i = 0; i < currentFiles.length; i++) {
      if (currentFiles[i].status === "done") continue;
      const result = await convertOne(currentFiles[i], quality, bgColor);
      setFiles((prev) => prev.map((f) => (f.id === result.id ? result : f)));
    }
  }, [quality, bgColor, convertOne]);

  const downloadOne = (item: FileItem) => {
    if (!item.convertedBlob) return;
    const url = URL.createObjectURL(item.convertedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.file.name.replace(/\.[^.]+$/, ".jpg");
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    files.filter((f) => f.status === "done").forEach(downloadOne);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-600 py-16 sm:py-24">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              Convert to JPG
            </h1>
            <p className="text-lg text-violet-100 mb-10 max-w-2xl mx-auto">
              Batch convert PNG, GIF, WebP, and SVG images to high-quality JPG. All processing
              happens in your browser — your files never leave your device.
            </p>

            {/* Upload zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={`mx-auto max-w-xl border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all ${
                dragOver
                  ? "border-white bg-white/20 scale-[1.02]"
                  : "border-violet-300 bg-white/10 hover:bg-white/15"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".png,.gif,.webp,.svg"
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
              <svg
                className="mx-auto w-12 h-12 text-white/80 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
                />
              </svg>
              <p className="text-white font-semibold text-lg">
                Drop images here or click to browse
              </p>
              <p className="text-violet-200 text-sm mt-1">PNG, GIF, WebP, SVG accepted</p>
            </div>
          </div>
        </section>

        {/* Controls & File List */}
        {files.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 py-12">
            {/* Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 — Smallest</span>
                  <span>100 — Best</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Color (for transparent images)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {bgColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={convertAll}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02]"
              >
                Convert All to JPG
              </button>
              {doneCount > 1 && (
                <button
                  onClick={downloadAll}
                  className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Download All ({doneCount})
                </button>
              )}
              <button
                onClick={() => {
                  files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
                  setFiles([]);
                }}
                className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Clear All
              </button>
            </div>

            {/* File List */}
            <div className="space-y-3">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow p-4"
                >
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="w-14 h-14 object-cover rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatLabel(item.originalFormat)} &middot; {formatSize(item.originalSize)}
                      {item.status === "done" && (
                        <span className="text-green-600 dark:text-green-400">
                          {" "}
                          &rarr; JPG &middot; {formatSize(item.convertedSize)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === "converting" && (
                      <span className="text-xs text-violet-600 dark:text-violet-400 animate-pulse font-medium">
                        Converting...
                      </span>
                    )}
                    {item.status === "error" && (
                      <span className="text-xs text-red-500 font-medium">{item.error}</span>
                    )}
                    {item.status === "done" && (
                      <button
                        onClick={() => downloadOne(item)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
