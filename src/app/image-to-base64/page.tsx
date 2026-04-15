"use client";

import { useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ConvertedImage {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string;     // data:image/...;base64,...
  rawBase64: string;   // just the base64 part
  previewUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ImageToBase64Page() {
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [outputMode, setOutputMode] = useState<"dataurl" | "raw">("dataurl");
  const [copied, setCopied] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const handleFiles = useCallback((fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const rawBase64 = dataUrl.split(",")[1] || "";
        const converted: ConvertedImage = {
          id: generateId(),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          dataUrl,
          rawBase64,
          previewUrl: dataUrl,
        };
        setImages((prev) => [...prev, converted]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const getOutput = (img: ConvertedImage) =>
    outputMode === "dataurl" ? img.dataUrl : img.rawBase64;

  const getHtmlTag = (img: ConvertedImage) =>
    `<img src="${img.dataUrl}" alt="${img.fileName}" />`;

  const getCssBackground = (img: ConvertedImage) =>
    `background-image: url('${img.dataUrl}');`;

  // Drag and drop
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-24 pb-16 px-4">
        {/* Hero */}
        <section className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            Base64 Converter
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Image to Base64 Converter
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Convert images to Base64 strings. Copy as Data URL, HTML img tag, or CSS background.
          </p>
        </section>

        {/* Upload area */}
        <section className="max-w-4xl mx-auto mb-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all bg-white dark:bg-gray-900 shadow-xl shadow-violet-500/5 ${
              isDragOver
                ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                : "border-gray-300 dark:border-gray-700 hover:border-violet-400"
            }`}
          >
            <svg className="w-12 h-12 mx-auto mb-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Drop image(s) here or <span className="text-violet-600 dark:text-violet-400 underline">browse</span>
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">PNG, JPG, WEBP, SVG, GIF</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>
        </section>

        {/* Output mode toggle */}
        {images.length > 0 && (
          <section className="max-w-4xl mx-auto mb-6">
            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-2">Output:</span>
              <button
                onClick={() => setOutputMode("dataurl")}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  outputMode === "dataurl"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Data URL
              </button>
              <button
                onClick={() => setOutputMode("raw")}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  outputMode === "raw"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Raw Base64
              </button>
            </div>
          </section>
        )}

        {/* Image cards */}
        <section className="max-w-4xl mx-auto space-y-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-violet-500/5 border border-gray-200 dark:border-gray-800 p-5"
            >
              <div className="flex flex-col md:flex-row gap-5">
                {/* Preview */}
                <div className="flex-shrink-0">
                  <img
                    src={img.previewUrl}
                    alt={img.fileName}
                    className="w-32 h-32 object-contain rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  />
                </div>

                {/* Info + actions */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {img.fileName}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Size: {formatBytes(img.fileSize)}</span>
                        <span>Type: {img.mimeType}</span>
                        <span>Base64 length: {img.rawBase64.length.toLocaleString()} chars</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Base64 output */}
                  <textarea
                    readOnly
                    value={getOutput(img)}
                    rows={4}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-700 dark:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copyToClipboard(getOutput(img), `copy-${img.id}`)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
                    >
                      {copied === `copy-${img.id}` ? "Copied!" : "Copy to Clipboard"}
                    </button>
                    <button
                      onClick={() => copyToClipboard(getHtmlTag(img), `html-${img.id}`)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all"
                    >
                      {copied === `html-${img.id}` ? "Copied!" : "Copy as HTML <img>"}
                    </button>
                    <button
                      onClick={() => copyToClipboard(getCssBackground(img), `css-${img.id}`)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all"
                    >
                      {copied === `css-${img.id}` ? "Copied!" : "Copy as CSS Background"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
