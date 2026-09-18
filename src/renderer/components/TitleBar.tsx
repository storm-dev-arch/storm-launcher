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
        height: '46px',
        background: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        zIndex: 100,
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Brand & Steam Live Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="app-region-no-drag">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              background: 'var(--text-primary)',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Zap size={13} style={{ color: 'var(--bg-app)', fill: 'var(--bg-app)' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
            STORM <span style={{ color: 'var(--accent-primary)', fontWeight: 400, opacity: 0.85 }}>LAUNCHER</span>
          </span>
        </div>

        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '20px',
            background: 'var(--bg-surface)',
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
              boxShadow: steamStatus.installed ? '0 0 8px #10B981' : 'none'
            }} 
          />
          <span 
            key={`tb-steam-${language}`} 
            className="lang-text-anim" 
            style={{ color: 'var(--text-primary)', fontWeight: 500 }}
          >
            {steamStatus.installed ? t.steamConnected : t.steamNotFound}
          </span>
        </div>
      </div>

      {/* Center Dynamic Search Capsule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="app-region-no-drag">
        <button
          onClick={onOpenCommandPalette}
          className="interactive-press"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '5px 16px',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)',
            transition: 'background-color 160ms ease, border-color 160ms ease',
            minWidth: '220px',
            justifyContent: 'space-between'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-highlight)';
            e.currentTarget.style.background = 'var(--bg-card-hover)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.background = 'var(--bg-surface)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={13} style={{ color: 'var(--text-muted)' }} />
            <span key={`tb-search-${language}`} className="lang-text-anim" style={{ fontWeight: 500 }}>
              {t.searchPlaceholder}
            </span>
          </div>
          <kbd style={{
            fontSize: '10px',
            background: 'var(--border-subtle)',
            padding: '2px 6px',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            fontFamily: 'inherit',
            border: '1px solid var(--border-subtle)'
          }}>Ctrl K</kbd>
        </button>

        <button
          onClick={onScanSteam}
          disabled={isScanning}
          className="interactive-press"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '5px 12px',
            color: 'var(--text-secondary)',
            fontSize: '11.5px',
            fontWeight: 500,
            cursor: isScanning ? 'wait' : 'pointer',
            transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease'
          }}
          onMouseEnter={e => {
            if (!isScanning) {
              e.currentTarget.style.borderColor = 'var(--border-highlight)';
              e.currentTarget.style.background = 'var(--bg-card-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={e => {
            if (!isScanning) {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
          title={language === 'ru' ? 'Синхронизировать библиотеки' : 'Sync game libraries'}
        >
          <RefreshCw size={12} className={isScanning ? 'spin' : ''} style={{ color: 'var(--text-primary)' }} />
          <span key={`tb-scan-${language}`} className="lang-text-anim">{t.scan}</span>
        </button>

        <button
          onClick={onOpenMiniMode}
          className="interactive-press"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '5px 12px',
            color: 'var(--text-secondary)',
            fontSize: '11.5px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-highlight)';
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.background = 'var(--bg-surface)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Mini Mode (Ctrl + Space)"
        >
          <Minimize2 size={12} />
          <span key={`tb-mini-${language}`} className="lang-text-anim">{t.mini}</span>
        </button>

        <button
          onClick={onToggleLanguage}
          className={`interactive-press ${langAnim ? 'lang-animate' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '5px 11px',
            color: 'var(--text-primary)',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background-color 160ms ease, border-color 160ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-highlight)';
            e.currentTarget.style.background = 'var(--bg-card-hover)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.background = 'var(--bg-surface)';
          }}
          title="Switch Language / Сменить язык"
        >
          <Globe 
            size={12} 
            style={{ 
              color: 'var(--text-primary)',
              transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
              transform: langAnim ? 'rotate(180deg)' : 'none'
            }} 
          />
          <span>{language.toUpperCase()}</span>
        </button>
      </div>

      {/* Window Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="app-region-no-drag">
        <button 
          onClick={handleMinimize}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 160ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-glass-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
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
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 160ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-glass-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
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
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 160ms ease'
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
