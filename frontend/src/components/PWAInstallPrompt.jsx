import { useState, useEffect } from 'react';

const INSTALL_BENEFITS = ['Faster loading', 'Home screen', 'Its own window', 'Quick shortcuts'];

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    if (daysSinceDismissed < 7) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleNotNow = () => {
    setShowPrompt(false);
  };

  useEffect(() => {
    if (!showPrompt) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowPrompt(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [showPrompt]);

  if (!showPrompt) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={handleNotNow}>
        <div
          className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 relative animate-slide-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-team-sync-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            aria-label="Dismiss install prompt"
            onClick={handleDismiss}
            className="absolute top-4 right-4 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            <h3 id="install-team-sync-title" className="text-xl font-bold text-neutral-900 mb-2">Install TeamSync</h3>
            <p className="text-neutral-600 mb-6">Get quick access with our app</p>

            <ul className="grid grid-cols-2 gap-3 mb-6 text-left list-none p-0">
              {INSTALL_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-sage-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-sm text-neutral-700">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2">
              <button onClick={handleInstall} className="btn-primary w-full py-3">
                Install App
              </button>
              <button onClick={handleNotNow} className="btn-secondary w-full py-3">
                Not Now
              </button>
            </div>

            <p className="text-xs text-neutral-500 mt-4">Works on mobile and desktop</p>
          </div>
        </div>
      </div>
    </>
  );
}
