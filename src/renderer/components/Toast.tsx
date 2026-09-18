import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle, RefreshCw } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'progress';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || (toast.type === 'progress' ? 3000 : 3500));

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, toast.type, onDismiss]);

  const typeConfig = {
    success: { icon: CheckCircle2, color: '#10B981', border: 'rgba(16, 185, 129, 0.35)', spin: false },
    error: { icon: AlertCircle, color: '#F43F5E', border: 'rgba(244, 63, 94, 0.35)', spin: false },
    info: { icon: Info, color: '#FFFFFF', border: 'rgba(255, 255, 255, 0.25)', spin: false },
    warning: { icon: AlertTriangle, color: '#F59E0B', border: 'rgba(245, 158, 11, 0.35)', spin: false },
    progress: { icon: RefreshCw, color: '#FFFFFF', border: 'rgba(255, 255, 255, 0.3)', spin: true }
  };
  const config = typeConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className="fade-in glass-modal"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '380px',
        padding: '12px 16px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-glass)',
        border: `1px solid ${config.border}`,
        borderRadius: '12px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Icon size={18} className={config.spin ? 'spin' : ''} style={{ color: config.color, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{toast.title}</div>
          {toast.message && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {toast.message}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '4px',
          transition: 'color 150ms ease'
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        title="Dismiss"
      >
        <X size={14} />
      </button>

      {toast.type === 'progress' ? (
        <div
          className="glass-progress-bar"
          style={{
            animation: `progressBarFill ${toast.duration || 3000}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '2px',
            background: config.color,
            boxShadow: `0 0 8px ${config.color}`,
            opacity: 0.8,
            animation: `shrinkLine ${toast.duration || 3500}ms linear forwards`
          }}
        />
      )}
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 3000
      }}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
