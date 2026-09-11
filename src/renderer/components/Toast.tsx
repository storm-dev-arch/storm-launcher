import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
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
    }, toast.duration || 3500);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '380px',
        background: 'rgba(12, 12, 16, 0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--border-highlight)',
        borderRadius: '10px',
        padding: '12px 16px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.65)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {toast.type === 'success' && <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />}
        {toast.type === 'error' && <AlertCircle size={16} style={{ color: '#F43F5E', flexShrink: 0 }} />}
        {toast.type === 'info' && <Info size={16} style={{ color: '#38BDF8', flexShrink: 0 }} />}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{toast.title}</div>
          {toast.message && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
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

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          background: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#F43F5E' : 'var(--accent-primary)',
          opacity: 0.8,
          animation: `shrinkLine ${toast.duration || 3500}ms linear forwards`
        }}
      />
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
