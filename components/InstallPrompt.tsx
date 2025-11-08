import React, { useEffect, useState } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Detect Standalone (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isIOS && !isStandalone) {
        // Only show once per session to avoid annoyance
        if (!sessionStorage.getItem('iosInstallDismissed')) {
            // Delay slightly so it doesn't pop up instantly on load
             setTimeout(() => setShowIOSPrompt(true), 5000);
        }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent standard mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show our own UI
      setShowAndroidPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    // Hide our UI regardless of outcome
    setShowAndroidPrompt(false);
  };

  const dismissIOS = () => {
      setShowIOSPrompt(false);
      sessionStorage.setItem('iosInstallDismissed', 'true');
  }

  if (showAndroidPrompt) {
      return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-gray-900 text-white p-4 rounded-xl shadow-2xl z-[90] flex items-center justify-between animate-slide-up-prompt">
          <div>
            <h4 className="font-bold flex items-center gap-2"><i className="fa-solid fa-circle-down text-green-500"></i> Install App</h4>
            <p className="text-sm text-gray-300">Add to home screen for easy access.</p>
          </div>
          <div className="flex gap-3">
              <button onClick={() => setShowAndroidPrompt(false)} className="text-gray-400 hover:text-white px-2 text-sm font-medium">Later</button>
              <button onClick={handleAndroidInstall} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm">Install</button>
          </div>
           <style>{`@keyframes slide-up-prompt { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-slide-up-prompt { animation: slide-up-prompt 0.5s ease-out forwards; }`}</style>
        </div>
      );
  }

  if (showIOSPrompt) {
      return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-gray-900 text-white p-5 rounded-xl shadow-2xl z-[90] animate-slide-up-prompt border-l-4 border-orange-500">
            <button onClick={dismissIOS} className="absolute top-2 right-3 text-gray-400 hover:text-white p-2"><i className="fa-solid fa-times"></i></button>
            <h4 className="font-bold flex items-center gap-2 mb-2 text-lg"><i className="fa-brands fa-apple"></i> Install on iOS</h4>
            <p className="text-gray-300 mb-4 leading-relaxed text-sm">
                To install this app, tap the <span className="inline-block mx-1 text-blue-400"><i className="fa-solid fa-arrow-up-from-bracket"></i> Share</span> icon in your browser menu, then scroll down and select <span className="font-bold text-white"><i className="fa-regular fa-square-plus mx-1"></i> Add to Home Screen</span>.
            </p>
             <style>{`@keyframes slide-up-prompt { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-slide-up-prompt { animation: slide-up-prompt 0.5s ease-out forwards; }`}</style>
        </div>
      )
  }

  return null;
};

export default InstallPrompt;