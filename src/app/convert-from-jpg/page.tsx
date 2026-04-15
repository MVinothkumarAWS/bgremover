"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSharedImage } from "@/context/SharedImageContext";

type TargetFormat = "image/png" | "image/webp" | "image/gif";

interface FileItem {
  id: string;
  file: File;
  originalSize: number;
  targetFormat: TargetFormat;
  convertedBlob: Blob | null;
  convertedSize: number;
  status: "pending" | "converting" | "done" | "error";
  previewUrl: string;
  error?: string;
}

const FORMAT_OPTIONS: { value: TargetFormat; label: string; ext: string }[] = [
  { value: "image/png", label: "PNG", ext: ".png" },
  { value: "image/webp", label: "WebP", ext: ".webp" },
  { value: "image/gif", label: "GIF", ext: ".gif" },
];

export default function ConvertFromJpgPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("image/png");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { sharedFile, setSharedImage } = useSharedImage();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatExt = (mime: TargetFormat) =>
    FORMAT_OPTIONS.find((f) => f.value === mime)?.ext || ".png";

  const formatLabel = (mime: TargetFormat) =>
    FORMAT_OPTIONS.find((f) => f.value === mime)?.label || "PNG";

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const newItems: FileItem[] = [];
      for (const file of Array.from(incoming)) {
        if (!file.type.match(/^image\/jpe?g$/)) continue;
        if (newItems.length === 0) setSharedImage(file);
        newItems.push({
          id: crypto.randomUUID(),
          file,
          originalSize: file.size,
          targetFormat,
          convertedBlob: null,
          convertedSize: 0,
          status: "pending",
          previewUrl: URL.createObjectURL(file),
        });
      }
      setFiles((prev) => [...prev, ...newItems]);
    },
    [targetFormat, setSharedImage]
  );

  useEffect(() => {
    if (sharedFile && files.length === 0 && sharedFile.type.match(/^image\/jpe?g$/)) addFiles([sharedFile]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const convertOne = useCallback(
    (item: FileItem, fmt: TargetFormat): Promise<FileItem> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  ...item,
                  targetFormat: fmt,
                  convertedBlob: blob,
                  convertedSize: blob.size,
                  status: "done",
                });
              } else {
                resolve({ ...item, status: "error", error: "Conversion failed" });
              }
            },
            fmt
          );
        };
        img.onerror = () => resolve({ ...item, status: "error", error: "Could not load image" });
        img.src = item.previewUrl;
      });
    },
    []
  );

  const convertAll = useCallback(async () => {
    setFiles((prev) =>
      prev.map((f) => (f.status !== "done" ? { ...f, status: "converting" as const } : f))
    );

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "done") continue;
      const result = await convertOne(files[i], targetFormat);
      setFiles((prev) => prev.map((f) => (f.id === result.id ? result : f)));
    }
  }, [files, targetFormat, convertOne]);

  const downloadOne = (item: FileItem) => {
    if (!item.convertedBlob) return;
    const url = URL.createObjectURL(item.convertedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.file.name.replace(/\.[^.]+$/, formatExt(item.targetFormat));
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
              Convert from JPG
            </h1>
            <p className="text-lg text-violet-100 mb-10 max-w-2xl mx-auto">
              Batch convert JPG images to PNG, WebP, or GIF. Everything runs client-side — your
              files stay on your device.
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
                accept=".jpg,.jpeg"
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
                Drop JPG images here or click to browse
              </p>
              <p className="text-violet-200 text-sm mt-1">Only JPG / JPEG files accepted</p>
            </div>
          </div>
        </section>

        {/* Controls & File List */}
        {files.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 py-12">
            {/* Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Target Format
              </label>
              <div className="flex flex-wrap gap-3">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTargetFormat(opt.value)}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      targetFormat === opt.value
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={convertAll}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02]"
              >
                Convert All to {formatLabel(targetFormat)}
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
                      JPG &middot; {formatSize(item.originalSize)}
                      {item.status === "done" && (
                        <span className="text-green-600 dark:text-green-400">
                          {" "}
                          &rarr; {formatLabel(item.targetFormat)} &middot;{" "}
                          {formatSize(item.convertedSize)}
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
