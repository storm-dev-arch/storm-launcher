import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Search, RefreshCw, Zap, Gamepad2, Minimize2, Globe } from 'lucide-react';
import type { ScannerProgress } from '../../shared/types';
import { translations, Language } from '../i18n/translations';

interface TitleBarProps {
  steamStatus: { installed: boolean; libraries: string[] };
  scanProgress?: ScannerProgress;
  onOpenCommandPalette: () => void;
  onOpenMiniMode: () => void;
  onScanSteam: () => void;
  gameCount: number;
  language: Language;
  onToggleLanguage: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  steamStatus,
  scanProgress,
  onOpenCommandPalette,
  onOpenMiniMode,
  onScanSteam,
  gameCount,
  language,
  onToggleLanguage
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [langAnim, setLangAnim] = useState(false);
  const t = translations[language].titlebar;

  useEffect(() => {
    setLangAnim(true);
    const timer = setTimeout(() => setLangAnim(false), 400);
    return () => clearTimeout(timer);
  }, [language]);

  useEffect(() => {
    window.stormPlay.system.isMaximized().then(setIsMaximized);
  }, []);

  const handleMinimize = () => window.stormPlay.system.minimize();
  const handleMaximize = async () => {
    window.stormPlay.system.maximize();
    const max = await window.stormPlay.system.isMaximized();
    setIsMaximized(max);
  };
  const handleClose = () => window.stormPlay.system.close();

  const isScanning = scanProgress && scanProgress.stage !== 'ready' && scanProgress.stage !== 'idle';

  return (
    <div 
      className="app-region-drag"
      style={{
        height: '42px',
        background: 'var(--bg-header)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        zIndex: 100,
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Brand & Steam Connection Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }} className="app-region-no-drag">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '5px',
              background: '#0B0B0E',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Zap size={11} style={{ color: '#fff', fill: '#fff' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', color: '#fff' }}>
            STORM <span style={{ color: 'var(--accent-primary)', fontWeight: 400 }}>LAUNCHER</span>
          </span>
        </div>

        {/* Steam Status Badge */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 9px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-secondary)'
          }}
          title={steamStatus.installed ? `Steam: ${steamStatus.libraries.length} libraries` : 'Steam client not found'}
        >
          <span 
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: steamStatus.installed ? '#10B981' : '#6B7280',
              boxShadow: steamStatus.installed ? '0 0 6px #10B981' : 'none'
            }} 
          />
          <span 
            key={`tb-steam-${language}`} 
            className="lang-text-anim" 
            style={{ color: '#fff', fontWeight: 500 }}
          >
            {steamStatus.installed ? t.steamConnected : t.steamNotFound}
          </span>
        </div>
      </div>

      {/* Center Search Pill & Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="app-region-no-drag">
        <button
          onClick={onOpenCommandPalette}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '4px 14px',
            color: 'var(--text-muted)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'border-color 150ms ease, background 150ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-highlight)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
        >
          <Search size={13} style={{ color: 'var(--text-muted)' }} />
          <span key={`tb-search-${language}`} className="lang-text-anim">{t.searchPlaceholder}</span>
          <kbd style={{
            fontSize: '10px',
            background: 'rgba(255,255,255,0.08)',
            padding: '1px 5px',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            fontFamily: 'inherit'
          }}>Ctrl K</kbd>
        </button>

        {/* Sync Steam button */}
        <button
          onClick={onScanSteam}
          disabled={isScanning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '4px 10px',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            cursor: isScanning ? 'wait' : 'pointer',
            transition: 'border-color 150ms ease, background 150ms ease'
          }}
          onMouseEnter={e => {
            if (!isScanning) {
              e.currentTarget.style.borderColor = 'var(--border-highlight)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }
          }}
          onMouseLeave={e => {
            if (!isScanning) {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }
          }}
          title={language === 'ru' ? 'Синхронизировать все библиотеки (Steam, Epic, GOG)' : 'Sync all game libraries (Steam, Epic, GOG)'}
        >
          <RefreshCw size={12} className={isScanning ? 'spin' : ''} style={{ color: 'var(--accent-primary)' }} />
          <span key={`tb-scan-${language}`} className="lang-text-anim">{t.scan}</span>
        </button>

        {/* Mini Mode Toggle */}
        <button
          onClick={onOpenMiniMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '4px 10px',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'border-color 150ms ease, background 150ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-highlight)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
          title="Open Mini Mode launcher (Ctrl + Space)"
        >
          <Minimize2 size={12} />
          <span key={`tb-mini-${language}`} className="lang-text-anim">{t.mini}</span>
        </button>

        {/* Quick Language Toggle Pill */}
        <button
          onClick={onToggleLanguage}
          className={langAnim ? 'lang-animate' : ''}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: langAnim ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.04)',
            border: langAnim ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '4px 9px',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'border-color 150ms ease, background 150ms ease, transform 200ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = langAnim ? 'var(--accent-primary)' : 'var(--border-subtle)';
            e.currentTarget.style.background = langAnim ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.04)';
          }}
          title="Switch Language / Сменить язык"
        >
          <Globe 
            size={12} 
            style={{ 
              color: 'var(--accent-primary)',
              transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
              transform: langAnim ? 'rotate(180deg)' : 'none'
            }} 
          />
          <span style={{ transition: 'opacity 200ms ease' }}>{language.toUpperCase()}</span>
        </button>
      </div>

      {/* Window Controls */}
      <div style={{ display: 'flex', alignItems: 'center' }} className="app-region-no-drag">
        <button 
          onClick={handleMinimize}
          style={{
            width: '36px',
            height: '42px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 120ms ease, color 120ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Minimize"
        >
          <Minus size={14} />
        </button>

        <button 
          onClick={handleMaximize}
          style={{
            width: '36px',
            height: '42px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 120ms ease, color 120ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <Square size={12} />
        </button>

        <button 
          onClick={handleClose}
          style={{
            width: '36px',
            height: '42px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 120ms ease, color 120ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#E11D48';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
