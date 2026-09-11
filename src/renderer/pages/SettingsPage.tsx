import React, { useState, useEffect } from 'react';
import { Settings, Sliders, Palette, RefreshCw, Check, HardDrive, ShieldCheck, Gamepad2, Globe, Volume2, MessageSquare, Sparkles, Radio } from 'lucide-react';
import type { LauncherSettings } from '../../shared/types';
import { translations, Language } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface SettingsPageProps {
  onScanSteam: () => void;
  onScanFolder: () => void;
  language: Language;
  onUpdateLanguage: (lang: Language) => void;
  onUpdateTheme?: (theme: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onScanSteam,
  onScanFolder,
  language,
  onUpdateLanguage,
  onUpdateTheme
}) => {
  const [settings, setSettings] = useState<LauncherSettings | null>(null);
  const [steamStatus, setSteamStatus] = useState<{ installed: boolean; path?: string; libraries: string[] } | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const t = translations[language].settings;

  useEffect(() => {
    window.stormPlay.settings.get().then(setSettings);
    window.stormPlay.scanner.getSteamStatus().then(setSteamStatus);
  }, []);

  const handleUpdate = async <K extends keyof LauncherSettings>(key: K, value: LauncherSettings[K]) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await window.stormPlay.settings.update({ [key]: value });

    if (key === 'theme') {
      const themeName = String(value);
      document.documentElement.setAttribute('data-theme', themeName);
      document.body.setAttribute('data-theme', themeName);
      document.body.className = `theme-${themeName}`;
      onUpdateTheme?.(themeName);
    }

    if (key === 'language') {
      onUpdateLanguage(value as Language);
    }

    if (key === 'soundEnabled' || key === 'soundVolume') {
      const isEn = key === 'soundEnabled' ? Boolean(value) : settings.soundEnabled;
      const vol = key === 'soundVolume' ? Number(value) : settings.soundVolume;
      soundEngine.setConfig(isEn, vol);
      if (key === 'soundVolume') soundEngine.playClick();
    }

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  if (!settings) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading settings...</div>;
  }

  const themes = [
    { id: 'obsidian', name: 'Obsidian Black', desc: 'Standard deep glass aesthetic' },
    { id: 'oled', name: 'OLED Pure Black', desc: '100% black contrast for OLED panels' },
    { id: 'graphite', name: 'Graphite Charcoal', desc: 'Subtle slate gray glass tones' },
    { id: 'midnight', name: 'Midnight Deep Blue', desc: 'Space navy dark glass' },
    { id: 'crimson', name: 'Crimson Glass', desc: 'Wine red dark tones' },
    { id: 'emerald', name: 'Emerald Glass', desc: 'Cyber forest dark tones' },
    { id: 'purple', name: 'Royal Purple Glass', desc: 'Deep violet glass accents' }
  ];

  return (
    <div className="view-transition" style={{ padding: '28px 36px', maxWidth: '960px', margin: '0 auto', paddingBottom: '80px' }}>
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
          {t.title}
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          {t.subtitle}
        </p>
      </header>

      {savedToast && (
        <div 
          style={{ 
            position: 'fixed', 
            top: '56px', 
            right: '36px', 
            background: '#10B981', 
            color: '#000', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            fontWeight: 600, 
            fontSize: '12px', 
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
          }} 
          className="fade-in"
        >
          {t.saved}
        </div>
      )}

      {/* Language Selector */}
      <section className="glass-section" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Globe size={18} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>
            {t.language}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              soundEngine.playClick();
              handleUpdate('language', 'ru');
            }}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '8px',
              background: language === 'ru' ? 'var(--bg-glass-hover)' : 'rgba(255,255,255,0.03)',
              border: language === 'ru' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'border-color 150ms ease, background 150ms ease'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{t.russian}</span>
            {language === 'ru' && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              handleUpdate('language', 'en');
            }}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '8px',
              background: language === 'en' ? 'var(--bg-glass-hover)' : 'rgba(255,255,255,0.03)',
              border: language === 'en' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'border-color 150ms ease, background 150ms ease'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{t.english}</span>
            {language === 'en' && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
          </button>
        </div>
      </section>

      {/* Tactile Audio (UI Sounds) */}
      <section className="glass-section" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Volume2 size={18} style={{ color: '#10B981' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>
            {language === 'ru' ? 'Тактильные звуковые эффекты UI' : 'Tactile UI Audio'}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>
                {language === 'ru' ? 'Включить звуки интерфейса' : 'Enable Sound FX'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {language === 'ru' ? 'Синтезированные щелчки и акценты при наведении и кликах' : 'Synthesized clicks, pops and launch sound effects'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={e => handleUpdate('soundEnabled', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>

          {settings.soundEnabled && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{language === 'ru' ? 'Громкость звуков' : 'Master Volume'}</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{Math.round(settings.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(settings.soundVolume * 100)}
                onChange={e => handleUpdate('soundVolume', Number(e.target.value) / 100)}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>
          )}
        </div>
      </section>

      {/* Discord Rich Presence */}
      <section className="glass-section" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <MessageSquare size={18} style={{ color: '#5865F2' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>
            Discord Rich Presence (RPC)
          </h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>
              {language === 'ru' ? 'Отображать игровую активность в Discord' : 'Show game activity in Discord profile'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {language === 'ru' ? 'Транслирует запущенную игру и таймер сессии через Storm Launcher' : 'Broadcasting active game session and elapsed timer'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.discordRPC}
            onChange={e => handleUpdate('discordRPC', e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#5865F2', cursor: 'pointer' }}
          />
        </div>
      </section>

      {/* SteamGridDB API Settings */}
      <section className="glass-section" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>
            SteamGridDB API
          </h3>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
            {language === 'ru' ? 'Персональный API ключ SteamGridDB (необязательно)' : 'SteamGridDB API Key (Optional)'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            {language === 'ru' ? 'Позволяет загружать официальные и кастомные обложки сообщества в высоком разрешении' : 'Allows downloading official and community artwork in full resolution'}
          </div>
          <input
            type="password"
            value={settings.steamGridApiKey || ''}
            onChange={e => handleUpdate('steamGridApiKey', e.target.value)}
            placeholder="SGDB API key..."
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '13px'
            }}
          />
        </div>
      </section>

      {/* Theme Selector */}
      <section className="glass-section" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Palette size={18} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>
            {t.theme}
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {themes.map(th => {
            const isSel = settings.theme === th.id;
            return (
              <div
                key={th.id}
                onClick={() => {
                  soundEngine.playClick();
                  handleUpdate('theme', th.id as any);
                }}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: isSel ? 'var(--bg-glass-hover)' : 'rgba(255,255,255,0.03)',
                  border: isSel ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease, background 150ms ease'
                }}
                onMouseEnter={e => {
                  if (!isSel) {
                    e.currentTarget.style.borderColor = 'var(--border-highlight)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSel) {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                  {th.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {th.desc}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Glassmorphism & Shader Controls */}
      <section className="glass-section" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sliders size={18} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>
            {t.glassCustomization}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.blurIntensity}</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{settings.blurAmount}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              value={settings.blurAmount}
              onChange={e => handleUpdate('blurAmount', Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.cardOpacity}</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{Math.round(settings.cardOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="95"
              value={settings.cardOpacity * 100}
              onChange={e => handleUpdate('cardOpacity', Number(e.target.value) / 100)}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{t.dynamicBg}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.dynamicBgDesc}</div>
            </div>
            <input
              type="checkbox"
              checked={settings.dynamicBackground}
              onChange={e => handleUpdate('dynamicBackground', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>
        </div>
      </section>

      {/* Steam Integration Status */}
      <section className="glass-section" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gamepad2 size={18} style={{ color: '#38BDF8' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>
              {t.steamIntegration}
            </h3>
          </div>
          <button className="btn btn-secondary" onClick={onScanSteam} style={{ fontSize: '12px' }}>
            <RefreshCw size={13} />
            {t.rescanSteam}
          </button>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t.steamPath}: <strong style={{ color: '#fff' }}>{steamStatus?.path || 'Not detected'}</strong>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {t.libraries}:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {steamStatus?.libraries.map(p => (
              <span key={p} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px', color: '#fff' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
