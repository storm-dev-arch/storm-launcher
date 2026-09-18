import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'logo' | 'bar' | 'done'>('logo');
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Fade in logo
    const t1 = setTimeout(() => setOpacity(1), 80);
    // Start progress bar
    const t2 = setTimeout(() => setPhase('bar'), 600);
    // Animate progress
    const t3 = setTimeout(() => {
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 18 + 4;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setTimeout(() => {
            setPhase('done');
            setOpacity(0);
            setTimeout(onComplete, 500);
          }, 300);
        }
        setProgress(Math.min(p, 100));
      }, 120);
      return () => clearInterval(interval);
    }, 700);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#030305',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: opacity,
      transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)',
      userSelect: 'none'
    }}>
      {/* Logo */}
      <div style={{
        marginBottom: '48px',
        transform: phase === 'logo' ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
      }}>
        {/* Icon */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px'
        }}>
          ⚡
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '28px', fontWeight: 800,
            color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1
          }}>
            STORM
          </div>
          <div style={{
            fontSize: '11px', fontWeight: 500,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: '4px'
          }}>
            LAUNCHER
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '200px',
        opacity: phase === 'bar' || phase === 'done' ? 1 : 0,
        transition: 'opacity 300ms ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
      }}>
        <div style={{
          width: '100%', height: '2px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '1px', overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: '#FFFFFF',
            borderRadius: '1px',
            transition: 'width 120ms cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 8px rgba(255,255,255,0.5)'
          }} />
        </div>
        <div style={{
          fontSize: '11px', color: 'rgba(255,255,255,0.25)',
          fontWeight: 500
        }}>
          {progress < 30 ? 'Инициализация...' :
           progress < 60 ? 'Загрузка библиотеки...' :
           progress < 85 ? 'Синхронизация данных...' :
           'Готово'}
        </div>
      </div>
    </div>
  );
};
