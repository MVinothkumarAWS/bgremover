import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 pt-16 pb-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 w-[800px] h-[200px] bg-violet-600/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">BG<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Remover</span></span>
            </div>
            <p className="text-sm max-w-md leading-relaxed">
              Professional AI background removal that runs 100% in your browser. No uploads, no servers, no compromises.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/#upload" className="hover:text-violet-400 transition-colors">Background Removal</Link></li>
              <li><Link href="/#features" className="hover:text-violet-400 transition-colors">All Features</Link></li>
              <li><Link href="/pricing" className="hover:text-violet-400 transition-colors">Pricing</Link></li>
              <li><Link href="/api-docs" className="hover:text-violet-400 transition-colors">API Docs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/#how-it-works" className="hover:text-violet-400 transition-colors">How It Works</Link></li>
              <li><Link href="/#gallery" className="hover:text-violet-400 transition-colors">Gallery</Link></li>
              <li><Link href="/#upload" className="hover:text-violet-400 transition-colors">Get Started</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} BG Remover. All rights reserved.</p>
          <p className="text-sm">
            Powered by{" "}
            <a href="https://k2techinfo.com" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent font-semibold hover:from-violet-300 hover:to-indigo-300 transition-all">
              K2 TechInfo
            </a>
          </p>
          <p className="text-xs text-gray-600">All processing is done locally in your browser.</p>
        </div>
      </div>
    </footer>
  );
}
