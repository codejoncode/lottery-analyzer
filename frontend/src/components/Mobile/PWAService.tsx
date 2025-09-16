import React, { useEffect, useState } from 'react';

interface PWAServiceProps {
  onUpdateAvailable?: () => void;
  onOfflineReady?: () => void;
}

export const PWAService: React.FC<PWAServiceProps> = ({
  onUpdateAvailable,
  onOfflineReady
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Register service worker
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  onUpdateAvailable?.();
                }
              });
            }
          });

          // Handle controller change (new SW activated)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });

        } catch (error) {
          console.error('Service worker registration failed:', error);
        }
      }
    };

    registerSW();

    // Handle online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onUpdateAvailable]);

  const updateApp = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const goOffline = () => {
    // Trigger offline mode
    onOfflineReady?.();
  };

  return (
    <div className="pwa-service" style={{ display: 'none' }}>
      {/* PWA Update Prompt */}
      {updateAvailable && (
        <div className="pwa-update-prompt">
          <div className="update-content">
            <h3>Update Available</h3>
            <p>A new version of Super Predictor is available!</p>
            <div className="update-actions">
              <button onClick={updateApp} className="update-btn">
                Update Now
              </button>
              <button onClick={() => setUpdateAvailable(false)} className="dismiss-btn">
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="offline-indicator">
          <div className="offline-content">
            <span className="offline-icon">📱</span>
            <span>You're offline. Some features may be limited.</span>
            <button onClick={goOffline} className="offline-btn">
              Continue Offline
            </button>
          </div>
        </div>
      )}

      <style>{`
        .pwa-update-prompt {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          max-width: 300px;
        }

        .update-content h3 {
          margin: 0 0 8px 0;
          color: #ffffff;
          font-size: 16px;
        }

        .update-content p {
          margin: 0 0 16px 0;
          color: #cccccc;
          font-size: 14px;
        }

        .update-actions {
          display: flex;
          gap: 8px;
        }

        .update-btn, .dismiss-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .update-btn {
          background: #2563eb;
          color: white;
        }

        .update-btn:hover {
          background: #1d4ed8;
        }

        .dismiss-btn {
          background: #374151;
          color: white;
        }

        .dismiss-btn:hover {
          background: #4b5563;
        }

        .offline-indicator {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          z-index: 10000;
          background: #1a1a1a;
          border: 1px solid #ef4444;
          border-radius: 8px;
          padding: 12px 16px;
        }

        .offline-content {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ffffff;
          font-size: 14px;
        }

        .offline-btn {
          margin-left: auto;
          padding: 6px 12px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .offline-btn:hover {
          background: #dc2626;
        }

        @media (max-width: 768px) {
          .pwa-update-prompt {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
          }

          .offline-indicator {
            bottom: 10px;
            left: 10px;
            right: 10px;
          }

          .offline-content {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }

          .offline-btn {
            margin-left: 0;
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
};