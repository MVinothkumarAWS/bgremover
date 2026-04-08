"use client";

import { useAnimateOnScroll } from "@/hooks/useAnimateOnScroll";

const SAMPLES = [
  { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face", label: "Portraits", desc: "Perfect headshots" },
  { src: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop", label: "Pets", desc: "Fur & fine edges" },
  { src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop", label: "Cars", desc: "Clean cutouts" },
  { src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop", label: "Products", desc: "E-commerce ready" },
  { src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop", label: "Animals", desc: "Complex shapes" },
  { src: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=400&h=400&fit=crop", label: "Food", desc: "Detailed edges" },
];

export default function Gallery() {
  const { ref, isVisible } = useAnimateOnScroll<HTMLDivElement>();

  return (
    <section id="gallery" className="py-24 bg-gray-50/50 dark:bg-gray-900/50 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-200/20 dark:bg-indigo-800/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className={`text-center mb-16 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <div className="inline-flex items-center px-3 py-1 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            Gallery
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Works With Everything
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            People, pets, products, cars and more. Our AI handles them all with precision.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
          {SAMPLES.map((sample, i) => (
            <div
              key={sample.label}
              className={`group cursor-pointer ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-800 group-hover:shadow-xl group-hover:shadow-violet-500/10 transition-all duration-300 group-hover:-translate-y-2">
                <img
                  src={sample.src}
                  alt={sample.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <div>
                    <p className="text-white font-bold text-sm">{sample.label}</p>
                    <p className="text-white/70 text-xs">{sample.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center mt-12 ${isVisible ? "animate-fade-up delay-700" : "opacity-0"}`}>
          <a href="#upload" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5">
            Try It Yourself
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </a>
        </div>
      </div>
    </section>
  );
}
