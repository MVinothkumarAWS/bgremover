"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSharedImage } from "@/context/SharedImageContext";
import { jsPDF } from "jspdf";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  dataUrl: string | null;
  width: number;
  height: number;
}

type PageSize = "a4" | "letter" | "a3" | "a5";
type Orientation = "portrait" | "landscape";
type FitMode = "fit" | "original";

const PAGE_LABELS: Record<PageSize, string> = {
  a4: "A4",
  letter: "Letter",
  a3: "A3",
  a5: "A5",
};

export default function ImageToPdfPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [margin, setMargin] = useState(10);
  const [fitMode, setFitMode] = useState<FitMode>("fit");
  const [generating, setGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);
  const sharedLoaded = useRef(false);

  const { sharedFile, setSharedImage } = useSharedImage();

  const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const getImageDimensions = (
    url: string
  ): Promise<{ width: number; height: number }> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = url;
    });

  const addFiles = useCallback(async (incoming: FileList | File[]) => {
    const newItems: ImageItem[] = [];
    for (const file of Array.from(incoming)) {
      if (!file.type.startsWith("image/")) continue;
      if (newItems.length === 0) setSharedImage(file);
      const previewUrl = URL.createObjectURL(file);
      const dataUrl = await readAsDataUrl(file);
      const { width, height } = await getImageDimensions(previewUrl);
      newItems.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
        dataUrl,
        width,
        height,
      });
    }
    setImages((prev) => [...prev, ...newItems]);
    setPdfBlob(null);
  }, [setSharedImage]);

  useEffect(() => {
    if (sharedFile && !sharedLoaded.current && images.length === 0) {
      sharedLoaded.current = true;
      addFiles([sharedFile]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    setPdfBlob(null);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setPdfBlob(null);
  };

  const clearAll = () => {
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
    setPdfBlob(null);
  };

  const generatePdf = useCallback(async () => {
    if (images.length === 0) return;
    setGenerating(true);
    setPdfBlob(null);

    try {
      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: pageSize,
      });

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (i > 0) pdf.addPage();

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;

        if (!img.dataUrl || img.width === 0 || img.height === 0) continue;

        let drawW: number;
        let drawH: number;

        if (fitMode === "fit") {
          const imgRatio = img.width / img.height;
          const areaRatio = availW / availH;
          if (imgRatio > areaRatio) {
            drawW = availW;
            drawH = availW / imgRatio;
          } else {
            drawH = availH;
            drawW = availH * imgRatio;
          }
        } else {
          // original size: 1px = ~0.264583mm at 96dpi
          const pxToMm = 25.4 / 96;
          drawW = Math.min(img.width * pxToMm, availW);
          drawH = Math.min(img.height * pxToMm, availH);
        }

        const x = margin + (availW - drawW) / 2;
        const y = margin + (availH - drawH) / 2;

        const format = img.file.type === "image/png" ? "PNG" : "JPEG";
        pdf.addImage(img.dataUrl, format, x, y, drawW, drawH);
      }

      const blob = pdf.output("blob");
      setPdfBlob(blob);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [images, pageSize, orientation, margin, fitMode]);

  const downloadPdf = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "images.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

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
              Image to PDF
            </h1>
            <p className="text-lg text-violet-100 mb-10 max-w-2xl mx-auto">
              Combine multiple images into a single PDF document. Reorder pages,
              choose page sizes, and customize layout — all in your browser.
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
                accept="image/*"
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
              <p className="text-violet-200 text-sm mt-1">
                JPG, PNG, WebP, GIF and more
              </p>
            </div>
          </div>
        </section>

        {/* PDF Builder */}
        {images.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 py-12">
            {/* Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 grid gap-6 sm:grid-cols-2">
              {/* Page Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PAGE_LABELS) as PageSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setPageSize(size);
                        setPdfBlob(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        pageSize === size
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {PAGE_LABELS[size]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orientation
                </label>
                <div className="flex gap-2">
                  {(["portrait", "landscape"] as Orientation[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => {
                        setOrientation(o);
                        setPdfBlob(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                        orientation === o
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Margin: {margin}mm
                </label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={margin}
                  onChange={(e) => {
                    setMargin(Number(e.target.value));
                    setPdfBlob(null);
                  }}
                  className="w-full accent-violet-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0mm</span>
                  <span>50mm</span>
                </div>
              </div>

              {/* Fit Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Sizing
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      { value: "fit", label: "Fit to Page" },
                      { value: "original", label: "Original Size" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFitMode(opt.value);
                        setPdfBlob(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        fitMode === opt.value
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={generatePdf}
                disabled={generating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
              >
                {generating ? "Generating..." : "Generate PDF"}
              </button>
              {pdfBlob && (
                <button
                  onClick={downloadPdf}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all hover:scale-[1.02]"
                >
                  Download PDF
                </button>
              )}
              <button
                onClick={() => addMoreRef.current?.click()}
                className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                + Add More Images
              </button>
              <input
                ref={addMoreRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
              <button
                onClick={clearAll}
                className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Clear All
              </button>
            </div>

            {/* Image List */}
            <div className="space-y-3">
              {images.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow p-4"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      className="p-1 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                      title="Move up"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveImage(index, 1)}
                      disabled={index === images.length - 1}
                      className="p-1 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                      title="Move down"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="w-14 h-14 object-cover rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.width} x {item.height}px &middot; Page{" "}
                      {index + 1} of {images.length}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeImage(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex-shrink-0"
                    title="Remove"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
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
