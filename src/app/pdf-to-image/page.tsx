"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type OutputFormat = "jpg" | "png" | "webp";
type ScaleOption = { label: string; value: number; dpi: number };

const SCALE_OPTIONS: ScaleOption[] = [
  { label: "1x (72 dpi)", value: 1, dpi: 72 },
  { label: "2x (144 dpi)", value: 2, dpi: 144 },
  { label: "3x (216 dpi)", value: 3, dpi: 216 },
];

const FORMAT_MIME: Record<OutputFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

interface PageItem {
  pageNumber: number;
  thumbnailUrl: string;
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  status: "idle" | "converting" | "done" | "error";
  error?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfToImagePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);
  const [scale, setScale] = useState(2);
  const [dragOver, setDragOver] = useState(false);
  const [convertingAll, setConvertingAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set up pdf.js worker
  useEffect(() => {
    import("pdfjs-dist").then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${lib.version}/pdf.worker.min.js`;
    });
  }, []);

  const loadPdf = useCallback(async (file: File) => {
    setLoading(true);
    setPdfFile(file);
    setPages([]);
    setPdfDoc(null);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      const arrayBuffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
      setPdfDoc(doc);

      const pageItems: PageItem[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;
        const thumbnailUrl = canvas.toDataURL("image/png");
        pageItems.push({
          pageNumber: i,
          thumbnailUrl,
          convertedBlob: null,
          convertedUrl: null,
          status: "idle",
        });
      }
      setPages(pageItems);
    } catch {
      alert("Failed to load PDF. Please make sure the file is a valid PDF.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const file = Array.from(fileList).find(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );
      if (file) loadPdf(file);
    },
    [loadPdf]
  );

  const convertPage = useCallback(
    async (pageNumber: number): Promise<PageItem | null> => {
      if (!pdfDoc) return null;

      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber === pageNumber ? { ...p, status: "converting" as const } : p
        )
      );

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        // White background for JPG (no alpha)
        if (format === "jpg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;

        const blob = await new Promise<Blob | null>((resolve) => {
          const mime = FORMAT_MIME[format];
          const q = format === "png" ? undefined : quality / 100;
          canvas.toBlob((b) => resolve(b), mime, q);
        });

        if (!blob) throw new Error("Canvas export failed");

        const convertedUrl = URL.createObjectURL(blob);
        const result: PageItem = {
          pageNumber,
          thumbnailUrl: "",
          convertedBlob: blob,
          convertedUrl,
          status: "done",
        };

        setPages((prev) =>
          prev.map((p) =>
            p.pageNumber === pageNumber
              ? { ...p, convertedBlob: blob, convertedUrl, status: "done" }
              : p
          )
        );

        return result;
      } catch {
        setPages((prev) =>
          prev.map((p) =>
            p.pageNumber === pageNumber
              ? { ...p, status: "error", error: "Conversion failed" }
              : p
          )
        );
        return null;
      }
    },
    [pdfDoc, format, quality, scale]
  );

  const convertAllPages = useCallback(async () => {
    if (!pdfDoc) return;
    setConvertingAll(true);

    // Reset all pages to idle
    setPages((prev) => prev.map((p) => ({ ...p, status: "idle" as const, convertedBlob: null, convertedUrl: null })));

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      await convertPage(i);
    }
    setConvertingAll(false);
  }, [pdfDoc, convertPage]);

  const downloadPage = (item: PageItem) => {
    if (!item.convertedBlob || !pdfFile) return;
    const url = URL.createObjectURL(item.convertedBlob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = pdfFile.name.replace(/\.pdf$/i, "");
    a.download = `${baseName}_page${item.pageNumber}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    pages.filter((p) => p.status === "done").forEach(downloadPage);
  };

  const reset = () => {
    pages.forEach((p) => {
      if (p.convertedUrl) URL.revokeObjectURL(p.convertedUrl);
    });
    setPdfFile(null);
    setPdfDoc(null);
    setPages([]);
  };

  const doneCount = pages.filter((p) => p.status === "done").length;
  const showQuality = format === "jpg" || format === "webp";

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
              PDF to Image
            </h1>
            <p className="text-lg text-violet-100 mb-10 max-w-2xl mx-auto">
              Convert every page of your PDF into high-quality images. Choose JPG, PNG, or WebP
              output. All processing happens in your browser — your files never leave your device.
            </p>

            {/* Upload zone */}
            {!pdfFile && !loading && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
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
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
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
                  Drop a PDF here or click to browse
                </p>
                <p className="text-violet-200 text-sm mt-1">PDF files only</p>
              </div>
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-white font-medium">Loading PDF pages...</p>
              </div>
            )}

            {/* File info */}
            {pdfFile && !loading && (
              <div className="inline-flex items-center gap-3 bg-white/15 rounded-xl px-5 py-3 text-white">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="text-left">
                  <p className="font-semibold text-sm truncate max-w-xs">{pdfFile.name}</p>
                  <p className="text-violet-200 text-xs">
                    {formatSize(pdfFile.size)} &middot; {pages.length} page{pages.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="ml-2 p-1.5 rounded-lg hover:bg-white/20 transition"
                  title="Remove PDF"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Controls & Page Grid */}
        {pages.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            {/* Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 grid gap-6 sm:grid-cols-3">
              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Format
                </label>
                <div className="flex gap-2">
                  {(["jpg", "png", "webp"] as OutputFormat[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                        format === f
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quality: {showQuality ? `${quality}%` : "N/A (lossless)"}
                </label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={!showQuality}
                  className={`w-full accent-violet-600 ${!showQuality ? "opacity-40 cursor-not-allowed" : ""}`}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 — Smallest</span>
                  <span>100 — Best</span>
                </div>
              </div>

              {/* Scale / DPI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scale / DPI
                </label>
                <div className="flex gap-2">
                  {SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setScale(opt.value)}
                      className={`flex-1 px-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                        scale === opt.value
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={convertAllPages}
                disabled={convertingAll}
                className={`px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] ${
                  convertingAll ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {convertingAll ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Converting...
                  </span>
                ) : (
                  "Convert All Pages"
                )}
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
                onClick={reset}
                className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Clear
              </button>
            </div>

            {/* Page Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((item) => (
                <div
                  key={item.pageNumber}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow p-3 flex flex-col items-center"
                >
                  {/* Thumbnail */}
                  <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-3">
                    <img
                      src={item.convertedUrl || item.thumbnailUrl}
                      alt={`Page ${item.pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                    {item.status === "converting" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                        <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                    {item.status === "done" && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Page label */}
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Page {item.pageNumber}
                    {item.convertedBlob && (
                      <span className="text-gray-400 dark:text-gray-500 ml-1">
                        ({formatSize(item.convertedBlob.size)})
                      </span>
                    )}
                  </p>

                  {/* Page actions */}
                  <div className="flex gap-1.5 w-full">
                    {item.status === "done" ? (
                      <button
                        onClick={() => downloadPage(item)}
                        className="flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition"
                      >
                        Download
                      </button>
                    ) : (
                      <button
                        onClick={() => convertPage(item.pageNumber)}
                        disabled={item.status === "converting"}
                        className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition ${
                          item.status === "converting" ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {item.status === "converting" ? "Converting..." : "Convert"}
                      </button>
                    )}
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
