import React from 'react';
import { Zap, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import type { ScannerProgress } from '../../shared/types';

interface OnboardingModalProps {
  progress?: ScannerProgress;
  onEnter: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  progress,
  onEnter
}) => {
  const isReady = progress?.stage === 'ready';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 4, 6, 0.95)',
        backdropFilter: 'blur(30px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div
        className="fade-in"
        style={{
          width: '500px',
          maxWidth: '92vw',
          background: 'rgba(14, 14, 18, 0.95)',
          backdropFilter: 'blur(30px)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '16px',
          padding: '36px',
          textAlign: 'center',
          boxShadow: '0 24px 70px rgba(0,0,0,0.85)'
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 8px 30px rgba(255,255,255,0.2)'
          }}
        >
          <Zap size={28} style={{ color: '#000000', fill: '#000000' }} />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Welcome to Storm Launcher
        </h1>
        <p style={{ margin: '0 0 28px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Your personal local-first game hub. Scanning your Windows Steam libraries...
        </p>

        {/* Progress Card */}
        <div
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '28px',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            {isReady ? (
              <CheckCircle2 size={18} style={{ color: '#10B981' }} />
            ) : (
              <RefreshCw size={18} className="spin" style={{ color: 'var(--accent-primary)' }} />
            )}
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              {progress?.message || 'Scanning for Steam libraries...'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
            <span>Libraries detected: <strong>{progress?.librariesFound || 0}</strong></span>
            <span>Games found: <strong>{progress?.gamesDetected || 0}</strong> ({progress?.gamesInstalled || 0} installed)</span>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={onEnter}
          disabled={!isReady}
          style={{
            width: '100%',
            padding: '12px 0',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>Enter Storm Launcher</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
