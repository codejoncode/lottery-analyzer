import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface MobileDashboardProps {
  children: React.ReactNode;
  title?: string;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  children,
  title = 'Super Predictor'
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <>
      {/* PWA Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <meta name="theme-color" content="#2563eb" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={title} />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      <title>{title}</title>

      <div className="mobile-dashboard">
        {/* Connection Status Bar */}
        <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
          <div className="status-indicator">
            <div className="indicator-dot"></div>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          {isInstallable && (
            <button
              className="install-button"
              onClick={handleInstallClick}
              aria-label="Install App"
            >
              Install App
            </button>
          )}
        </div>

        {/* Main Content */}
        <main className="mobile-content">
          {children}
        </main>

        {/* Mobile Navigation (if needed) */}
        <nav className="mobile-nav">
          <div className="nav-item active">
            <span className="nav-icon">🎯</span>
            <span className="nav-label">Predict</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-label">Analytics</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </div>
        </nav>
      </div>

      <style>{`
        .mobile-dashboard {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0f0f0f;
          color: #ffffff;
        }

        .connection-status {
          position: sticky;
          top: 0;
          z-index: 1000;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: #1a1a1a;
          border-bottom: 1px solid #333;
          font-size: 14px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .offline .indicator-dot {
          background: #ef4444;
        }

        .install-button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .install-button:hover {
          background: #1d4ed8;
        }

        .mobile-content {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-nav {
          position: sticky;
          bottom: 0;
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 12px 0;
          background: #1a1a1a;
          border-top: 1px solid #333;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.2s;
          min-width: 60px;
        }

        .nav-item.active {
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-icon {
          font-size: 20px;
        }

        .nav-label {
          font-size: 12px;
          font-weight: 500;
        }

        @media (min-width: 768px) {
          .mobile-nav {
            display: none;
          }

          .connection-status {
            padding: 12px 24px;
          }

          .mobile-content {
            padding: 24px;
          }
        }
      `}</style>
    </>
  );
};