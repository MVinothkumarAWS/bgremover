export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">BG<span className="text-blue-400">Remover</span></span>
            </div>
            <p className="text-sm max-w-md">
              Free AI-powered background removal that runs 100% in your browser. No uploads, no servers, no compromises on privacy.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Features</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#upload" className="hover:text-white transition-colors">Background Removal</a></li>
              <li><a href="#upload" className="hover:text-white transition-colors">Batch Processing</a></li>
              <li><a href="#upload" className="hover:text-white transition-colors">Touch-Up Editor</a></li>
              <li><a href="#upload" className="hover:text-white transition-colors">Custom Backgrounds</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">All Features</a></li>
              <li><a href="#gallery" className="hover:text-white transition-colors">Gallery</a></li>
              <li><a href="#upload" className="hover:text-white transition-colors">Get Started</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} BG Remover. All rights reserved.</p>
          <p className="text-xs text-gray-500">All processing is done locally. No images are uploaded to any server.</p>
        </div>
      </div>
    </footer>
  );
}
