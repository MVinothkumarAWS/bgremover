"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSharedImage } from "@/context/SharedImageContext";

interface ImageItem {
  id: string;
  file: File;
  originalSize: number;
  originalUrl: string;
  compressedBlob: Blob | null;
  compressedUrl: string | null;
  compressedSize: number | null;
  status: "pending" | "compressing" | "done" | "error";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function percentSaved(original: number, compressed: number): string {
  const pct = ((1 - compressed / original) * 100).toFixed(1);
  return `${pct}%`;
}

export default function CompressPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sharedFile, setSharedImage } = useSharedImage();

  const formatLabel: Record<string, string> = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WebP",
  };

  const formatExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };

  const addFiles = useCallback((fileList: File[]) => {
    const imageFiles = fileList.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length > 0) setSharedImage(imageFiles[0]);
    const newItems: ImageItem[] = imageFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      originalSize: file.size,
      originalUrl: URL.createObjectURL(file),
      compressedBlob: null,
      compressedUrl: null,
      compressedSize: null,
      status: "pending" as const,
    }));
    setImages((prev) => [...prev, ...newItems]);
  }, [setSharedImage]);

  // Load shared image on mount
  useEffect(() => {
    if (sharedFile && images.length === 0) addFiles([sharedFile]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(e.target.files || []));
      if (inputRef.current) inputRef.current.value = "";
    },
    [addFiles]
  );

  const compressImage = useCallback(
    (item: ImageItem): Promise<ImageItem> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ ...item, status: "error" });
            return;
          }
          ctx.drawImage(img, 0, 0);

          if (format === "image/png") {
            // PNG is lossless; quality param is not used by toBlob for PNG
            const dataUrl = canvas.toDataURL("image/png");
            fetch(dataUrl)
              .then((res) => res.blob())
              .then((blob) => {
                const url = URL.createObjectURL(blob);
                resolve({
                  ...item,
                  compressedBlob: blob,
                  compressedUrl: url,
                  compressedSize: blob.size,
                  status: "done",
                });
              })
              .catch(() => resolve({ ...item, status: "error" }));
          } else {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve({ ...item, status: "error" });
                  return;
                }
                const url = URL.createObjectURL(blob);
                resolve({
                  ...item,
                  compressedBlob: blob,
                  compressedUrl: url,
                  compressedSize: blob.size,
                  status: "done",
                });
              },
              format,
              quality / 100
            );
          }
        };
        img.onerror = () => resolve({ ...item, status: "error" });
        img.src = item.originalUrl;
      });
    },
    [format, quality]
  );

  const compressAll = useCallback(async () => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        status: "compressing" as const,
        compressedBlob: null,
        compressedUrl: img.compressedUrl
          ? (URL.revokeObjectURL(img.compressedUrl), null)
          : null,
        compressedSize: null,
      }))
    );

    // Process sequentially to avoid overwhelming the browser
    const results: ImageItem[] = [];
    for (const item of images) {
      const result = await compressImage({ ...item, status: "compressing" });
      results.push(result);
      // Update state progressively
      setImages((prev) =>
        prev.map((img) => (img.id === result.id ? result : img))
      );
    }
  }, [images, compressImage]);

  const downloadOne = useCallback((item: ImageItem) => {
    if (!item.compressedUrl || !item.compressedBlob) return;
    const a = document.createElement("a");
    a.href = item.compressedUrl;
    const baseName = item.file.name.replace(/\.[^.]+$/, "");
    a.download = `${baseName}-compressed${formatExt[format] || ".jpg"}`;
    a.click();
  }, [format]);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.originalUrl);
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((item) => {
      URL.revokeObjectURL(item.originalUrl);
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    });
    setImages([]);
  }, [images]);

  const allDone = images.length > 0 && images.every((i) => i.status === "done");
  const anyCompressing = images.some((i) => i.status === "compressing");

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero / Upload Section */}
        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950" />
          <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-violet-300/15 dark:bg-violet-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-indigo-300/15 dark:bg-indigo-600/5 rounded-full blur-3xl" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            {/* Title */}
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Compress IMAGE
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Reduce image file size without losing quality. 100% client-side
                &mdash; your images never leave your device.
              </p>
            </div>

            {images.length === 0 ? (
              /* ── Upload Zone ── */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 sm:p-16 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 scale-[1.01]"
                    : "border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleInputChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      Drop images here or{" "}
                      <span className="text-violet-600 dark:text-violet-400">
                        click to upload
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Supports JPG, PNG, WebP &mdash; multiple files allowed
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Compression Interface ── */
              <div className="space-y-6">
                {/* Controls Card */}
                <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
                    {/* Quality Slider */}
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quality:{" "}
                        <span className="text-violet-600 dark:text-violet-400 font-bold">
                          {quality}%
                        </span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-violet-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Smallest file</span>
                        <span>Best quality</span>
                      </div>
                    </div>

                    {/* Format Selector */}
                    <div className="w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Output Format
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        {(
                          [
                            "image/jpeg",
                            "image/png",
                            "image/webp",
                          ] as const
                        ).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => setFormat(fmt)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                              format === fmt
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            {formatLabel[fmt]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button
                        onClick={compressAll}
                        disabled={anyCompressing}
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {anyCompressing ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Compressing...
                          </span>
                        ) : (
                          "Compress All"
                        )}
                      </button>
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        + Add
                      </button>
                      <button
                        onClick={clearAll}
                        className="px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </div>

                {/* Summary Bar */}
                {allDone && (
                  <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white text-center shadow-lg">
                    <p className="font-semibold">
                      Total saved:{" "}
                      {formatBytes(
                        images.reduce(
                          (acc, i) =>
                            acc +
                            (i.originalSize - (i.compressedSize ?? i.originalSize)),
                          0
                        )
                      )}{" "}
                      &mdash;{" "}
                      {percentSaved(
                        images.reduce((a, i) => a + i.originalSize, 0),
                        images.reduce(
                          (a, i) => a + (i.compressedSize ?? i.originalSize),
                          0
                        )
                      )}{" "}
                      reduction across {images.length} image
                      {images.length > 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* Image Cards */}
                <div className="grid gap-4">
                  {images.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-4 shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {/* Thumbnail */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                          <img
                            src={item.originalUrl}
                            alt={item.file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.file.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1 justify-center sm:justify-start">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Original: {formatBytes(item.originalSize)}
                            </span>
                            {item.status === "done" &&
                              item.compressedSize !== null && (
                                <>
                                  <svg
                                    className="w-4 h-4 text-violet-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                  </svg>
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    {formatBytes(item.compressedSize)}
                                  </span>
                                  <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                      item.compressedSize < item.originalSize
                                        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                                        : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
                                    }`}
                                  >
                                    {item.compressedSize < item.originalSize
                                      ? `-${percentSaved(item.originalSize, item.compressedSize)} saved`
                                      : "Size increased"}
                                  </span>
                                </>
                              )}
                          </div>
                          {item.status === "compressing" && (
                            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 animate-pulse w-2/3" />
                            </div>
                          )}
                          {item.status === "error" && (
                            <p className="text-xs text-red-500 mt-1">
                              Failed to compress this image.
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          {item.status === "done" && item.compressedUrl && (
                            <button
                              onClick={() => downloadOne(item)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              Download
                            </button>
                          )}
                          <button
                            onClick={() => removeImage(item.id)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Remove"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
