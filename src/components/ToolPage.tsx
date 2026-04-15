"use client";

import { useState, useCallback, useRef } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface ToolPageProps {
  title: string;
  description: string;
  color: string;
  icon: string;
  accept?: string;
  multiple?: boolean;
  children: (props: {
    files: File[];
    resetFiles: () => void;
  }) => React.ReactNode;
}

export default function ToolPage({ title, description, color, icon, accept = "image/*", multiple = true, children }: ToolPageProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.type.startsWith("image/") || accept !== "image/*");
    if (valid.length > 0) setFiles(multiple ? valid : [valid[0]]);
  }, [accept, multiple]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  const resetFiles = useCallback(() => {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  if (files.length > 0) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <button onClick={resetFiles} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Upload new images
            </button>
            {children({ files, resetFiles })}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950" />
          <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-violet-300/15 dark:bg-violet-600/5 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
            <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">{title}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">{description}</p>

            <div
              className={`upload-zone max-w-2xl mx-auto border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${dragActive ? "dragging border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-gray-300 dark:border-gray-600 hover:border-violet-400"}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => handleFiles(Array.from(e.target.files || []))} />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">Drop images here or click to upload</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Supports JPG, PNG, WebP, SVG, GIF</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
