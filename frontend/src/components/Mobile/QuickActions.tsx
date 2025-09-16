import React, { useState } from 'react';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  color?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  isVisible?: boolean;
  onToggle?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  isVisible = false,
  onToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(isVisible);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.();
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="quick-actions-fab"
        onClick={handleToggle}
        aria-label="Quick Actions"
      >
        <span className="fab-icon">
          {isExpanded ? '✕' : '⚡'}
        </span>
      </button>

      {/* Quick Actions Menu */}
      {isExpanded && (
        <div className="quick-actions-menu">
          <div className="actions-grid">
            {actions.map((action) => (
              <button
                key={action.id}
                className="action-button"
                onClick={() => {
                  action.action();
                  setIsExpanded(false);
                }}
                style={{ backgroundColor: action.color }}
                aria-label={action.label}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isExpanded && (
        <div
          className="quick-actions-overlay"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <style>{`
        .quick-actions-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: none;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          cursor: pointer;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .quick-actions-fab:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }

        .quick-actions-fab:active {
          transform: scale(0.95);
        }

        .fab-icon {
          font-size: 24px;
          color: white;
          transition: transform 0.3s ease;
        }

        .quick-actions-menu {
          position: fixed;
          bottom: 88px;
          right: 24px;
          z-index: 999;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          background: #1a1a1a;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          border: 1px solid #333;
          min-width: 200px;
        }

        .action-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 70px;
          text-align: center;
        }

        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .action-button:active {
          transform: scale(0.95);
        }

        .action-icon {
          font-size: 20px;
        }

        .action-label {
          font-size: 12px;
          font-weight: 500;
          line-height: 1.2;
        }

        .quick-actions-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 998;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 480px) {
          .quick-actions-fab {
            bottom: 16px;
            right: 16px;
            width: 48px;
            height: 48px;
          }

          .fab-icon {
            font-size: 20px;
          }

          .quick-actions-menu {
            bottom: 72px;
            right: 16px;
          }

          .actions-grid {
            grid-template-columns: 1fr;
            min-width: 160px;
            padding: 12px;
          }

          .action-button {
            flex-direction: row;
            justify-content: flex-start;
            padding: 12px;
            min-height: auto;
          }

          .action-label {
            font-size: 14px;
            text-align: left;
          }
        }
      `}</style>
    </>
  );
};