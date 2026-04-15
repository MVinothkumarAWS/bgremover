export type ToolCategory = "all" | "optimize" | "create" | "edit" | "convert" | "security" | "developer";

export interface ToolConfig {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory[];
  icon: string;
  color: string;
  href: string;
}

export const tools: ToolConfig[] = [
  // ── Edit ──
  {
    slug: "remove-bg",
    name: "Remove Background",
    description: "Automatically remove image backgrounds with AI precision.",
    category: ["edit"],
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    color: "from-violet-500 to-indigo-600",
    href: "/",
  },
  {
    slug: "resize",
    name: "Resize IMAGE",
    description: "Change image dimensions by pixels or percentage.",
    category: ["edit"],
    icon: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4",
    color: "from-orange-500 to-amber-600",
    href: "/resize",
  },
  {
    slug: "crop",
    name: "Crop IMAGE",
    description: "Trim and cut images with a visual cropper and aspect presets.",
    category: ["edit"],
    icon: "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12",
    color: "from-yellow-500 to-orange-600",
    href: "/crop",
  },
  {
    slug: "rotate",
    name: "Rotate IMAGE",
    description: "Rotate or flip images with one click.",
    category: ["edit"],
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    color: "from-teal-500 to-green-600",
    href: "/rotate",
  },

  // ── Optimize ──
  {
    slug: "compress",
    name: "Compress IMAGE",
    description: "Reduce file size while keeping the best quality. JPG, PNG, WebP.",
    category: ["optimize"],
    icon: "M19 14l-7 7m0 0l-7-7m7 7V3",
    color: "from-green-500 to-emerald-600",
    href: "/compress",
  },
  {
    slug: "upscale",
    name: "Upscale Image",
    description: "Enlarge and enhance images up to 4x with smart upscaling.",
    category: ["optimize"],
    icon: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4",
    color: "from-blue-500 to-cyan-600",
    href: "/upscale",
  },

  // ── Convert ──
  {
    slug: "convert-to-jpg",
    name: "Convert to JPG",
    description: "Convert PNG, GIF, WebP, SVG and more to JPG format.",
    category: ["convert"],
    icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
    color: "from-red-500 to-pink-600",
    href: "/convert-to-jpg",
  },
  {
    slug: "convert-from-jpg",
    name: "Convert from JPG",
    description: "Convert JPG images to PNG, WebP, or GIF.",
    category: ["convert"],
    icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10",
    color: "from-purple-500 to-violet-600",
    href: "/convert-from-jpg",
  },
  {
    slug: "image-to-pdf",
    name: "Image to PDF",
    description: "Convert multiple images into a single PDF document.",
    category: ["convert"],
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "from-rose-500 to-red-600",
    href: "/image-to-pdf",
  },
  {
    slug: "pdf-to-image",
    name: "PDF to Image",
    description: "Convert PDF pages to JPG, PNG, or WebP images.",
    category: ["convert"],
    icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    color: "from-amber-500 to-orange-600",
    href: "/pdf-to-image",
  },
  {
    slug: "html-to-image",
    name: "HTML to Image",
    description: "Render HTML/CSS code as a high-quality JPG or PNG image.",
    category: ["convert"],
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    color: "from-sky-500 to-blue-600",
    href: "/html-to-image",
  },
  {
    slug: "html-to-pdf",
    name: "HTML to PDF",
    description: "Convert local HTML files or pasted HTML code to PDF.",
    category: ["convert"],
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    color: "from-cyan-500 to-teal-600",
    href: "/html-to-pdf",
  },

  // ── Create ──
  {
    slug: "photo-editor",
    name: "Photo Editor",
    description: "Adjust brightness, contrast, saturation, and apply filters.",
    category: ["create"],
    icon: "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z",
    color: "from-pink-500 to-rose-600",
    href: "/photo-editor",
  },
  {
    slug: "meme-generator",
    name: "Meme Generator",
    description: "Create hilarious memes with custom captions and text.",
    category: ["create"],
    icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "from-amber-500 to-yellow-600",
    href: "/meme-generator",
  },
  {
    slug: "collage",
    name: "Collage Maker",
    description: "Combine multiple photos into beautiful grid collages.",
    category: ["create"],
    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
    color: "from-fuchsia-500 to-pink-600",
    href: "/collage",
  },
  {
    slug: "profile-picture",
    name: "Profile Picture Maker",
    description: "Create perfect circular profile pictures for any platform.",
    category: ["create"],
    icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "from-violet-500 to-purple-600",
    href: "/profile-picture",
  },
  {
    slug: "gif-maker",
    name: "GIF / Animation Maker",
    description: "Create animated previews and frame sequences from images.",
    category: ["create"],
    icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z",
    color: "from-emerald-500 to-green-600",
    href: "/gif-maker",
  },
  {
    slug: "black-and-white",
    name: "Black & White Filters",
    description: "Convert images to grayscale, sepia, vintage, and duotone styles.",
    category: ["create"],
    icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
    color: "from-gray-500 to-zinc-600",
    href: "/black-and-white",
  },

  // ── Security ──
  {
    slug: "watermark",
    name: "Watermark IMAGE",
    description: "Protect images with text or image watermarks.",
    category: ["security"],
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "from-indigo-500 to-blue-600",
    href: "/watermark",
  },
  {
    slug: "blur-face",
    name: "Blur Face",
    description: "Blur faces, license plates, and sensitive areas in images.",
    category: ["security"],
    icon: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21",
    color: "from-gray-500 to-slate-600",
    href: "/blur-face",
  },

  // ── Developer ──
  {
    slug: "image-splitter",
    name: "Image Splitter",
    description: "Split images into grid pieces for Instagram carousels & puzzles.",
    category: ["developer"],
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    color: "from-lime-500 to-green-600",
    href: "/image-splitter",
  },
  {
    slug: "color-picker",
    name: "Color Picker",
    description: "Extract colors from images in HEX, RGB, and HSL formats.",
    category: ["developer"],
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    color: "from-red-500 to-orange-600",
    href: "/color-picker",
  },
  {
    slug: "image-to-base64",
    name: "Image to Base64",
    description: "Convert images to Base64 encoded strings for developers.",
    category: ["developer"],
    icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    color: "from-slate-500 to-gray-600",
    href: "/image-to-base64",
  },
];

export const categories: { key: ToolCategory; label: string }[] = [
  { key: "all", label: "All Tools" },
  { key: "edit", label: "Edit" },
  { key: "optimize", label: "Optimize" },
  { key: "convert", label: "Convert" },
  { key: "create", label: "Create" },
  { key: "security", label: "Security" },
  { key: "developer", label: "Developer" },
];
