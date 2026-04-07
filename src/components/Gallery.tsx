"use client";

import { useState } from "react";

const SAMPLES = [
  {
    before: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    label: "Portrait",
  },
  {
    before: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop",
    label: "Pet",
  },
  {
    before: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop",
    label: "Car",
  },
  {
    before: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    label: "Product",
  },
  {
    before: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
    label: "Animal",
  },
  {
    before: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=400&h=400&fit=crop",
    label: "Food",
  },
];

export default function Gallery() {
  return (
    <section id="gallery" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Works With Any Image
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            People, pets, products, cars and more. Our AI handles them all with precision.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SAMPLES.map((sample) => (
            <div key={sample.label} className="group relative">
              <div className="aspect-square rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-800">
                <img
                  src={sample.before}
                  alt={sample.label}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                {sample.label}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="#upload"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
          >
            Try It Yourself
          </a>
        </div>
      </div>
    </section>
  );
}
