import React, { useState, useEffect } from 'react';
import {
  Palette,
  RefreshCw,
  Check,
  Gamepad2,
  Globe,
  Volume2,
  MessageSquare,
  Sparkles,
  Radio,
  Sliders,
  FolderSearch,
  Moon,
  Sun,
  Activity,
  Cpu,
  LayoutGrid,
  Grid2X2,
  List,
  HardDrive,
  Trash2,
  Power
} from 'lucide-react';
import type { LauncherSettings } from '../../shared/types';
import { translations, Language } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';
import { applyGlassStyleToDoc } from '../App';

interface SettingsPageProps {
  onScanSteam: () => void;
  onScanFolder: () => void;
  language: Language;
  onUpdateLanguage: (lang: Language) => void;
  onUpdateTheme?: (theme: string) => void;
}

const GlassToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => {
  return (
    <div
      onClick={() => {
        soundEngine.playClick();
        onChange(!checked);
      }}
      className={`glass-toggle-track ${checked ? 'is-active' : ''}`}
      role="switch"
      aria-checked={checked}
    >
      <div className="glass-toggle-knob" />
    </div>
  );
};

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
  const [activeSection, setActiveSection] = useState<'appearance' | 'audio' | 'system' | 'integrations'>('appearance');
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheResult, setCacheResult] = useState<string | null>(null);

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

    if (key === 'blurAmount' || key === 'cardOpacity' || key === 'lowPerformanceMode' || key === 'theme') {
      applyGlassStyleToDoc(updated);
    }

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
    setTimeout(() => setSavedToast(false), 1800);
  };

  const handleClearCache = async () => {
    try {
      setClearingCache(true);
      soundEngine.playClick();
      const res = await window.stormPlay.system.clearCache();
      setCacheResult(
        language === 'ru'
          ? `Успешно: освобождено ${res.freedMb} МБ (${res.count} файлов)`
          : `Success: freed ${res.freedMb} MB (${res.count} files)`
      );
      setTimeout(() => setCacheResult(null), 4500);
    } catch (e) {
      console.error(e);
    } finally {
      setClearingCache(false);
    }
  };

  if (!settings) {
    return (
      <div style={{ padding: '60px 40px', color: 'var(--text-muted)', textAlign: 'center' }}>
        <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px auto' }} />
        <div>{language === 'ru' ? 'Загрузка параметров...' : 'Loading settings...'}</div>
      </div>
    );
  }

  const themes = [
    {
      id: 'dark' as const,
      name: language === 'ru' ? 'Тёмная тема' : 'Dark Theme',
      desc: language === 'ru' ? 'Глубокий чёрный Liquid Glass, премиальные чистые акценты' : 'Deep obsidian glassmorphism with crisp monochrome accents',
      icon: Moon
    },
    {
      id: 'light' as const,
      name: language === 'ru' ? 'Светлая тема' : 'Light Theme',
      desc: language === 'ru' ? 'Матовое белое стекло, чистая контрастная типографика' : 'Frosted white glass with crisp slate typography and contrast',
      icon: Sun
    }
  ];

  const sections = [
    { id: 'appearance' as const, label: language === 'ru' ? 'Внешний вид' : 'Appearance', icon: Palette },
    { id: 'audio' as const, label: language === 'ru' ? 'Звуковые эффекты' : 'Audio FX', icon: Volume2 },
    { id: 'system' as const, label: language === 'ru' ? 'Система и Язык' : 'System & Language', icon: Globe },
    { id: 'integrations' as const, label: language === 'ru' ? 'Интеграции' : 'Integrations', icon: Radio }
  ];

  return (
    <div className="view-transition" style={{ padding: '28px 36px', maxWidth: '1020px', margin: '0 auto', paddingBottom: '90px' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {t.title}
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            {t.subtitle}
          </p>
        </div>

        {savedToast && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              backdropFilter: 'blur(24px) saturate(180%)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '7px 16px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '12px',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
            }}
            className="fade-in"
          >
            <Check size={15} strokeWidth={3} style={{ color: '#10B981' }} />
            <span>{t.saved}</span>
          </div>
        )}
      </header>

      {/* Modern Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          background: 'var(--bg-glass)',
          padding: '5px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '28px',
          overflowX: 'auto'
        }}
      >
        {sections.map(sec => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => {
                soundEngine.playClick();
                setActiveSection(sec.id);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: isActive ? 'var(--bg-glass-hover)' : 'transparent',
                border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} style={{ color: isActive ? 'var(--accent-primary)' : 'inherit' }} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: APPEARANCE */}
      {activeSection === 'appearance' && (
        <div className="view-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Theme Selector */}
          <div className="glass-section settings-glass" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Palette size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t.theme}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {themes.map(th => {
                const Icon = th.icon;
                const isSel = settings.theme === th.id || (th.id === 'dark' && settings.theme !== 'light');
                return (
                  <div
                    key={th.id}
                    onClick={() => {
                      soundEngine.playClick();
                      handleUpdate('theme', th.id);
                    }}
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      background: isSel ? 'var(--bg-glass-hover)' : 'rgba(120, 120, 140, 0.05)',
                      border: isSel ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      boxShadow: isSel ? '0 4px 20px rgba(0, 0, 0, 0.25)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: isSel ? 'rgba(255, 255, 255, 0.12)' : 'rgba(120, 120, 140, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSel ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                        {th.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        {th.desc}
                      </div>
                    </div>
                    {isSel && (
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--bg-main)',
                          flexShrink: 0,
                          boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Glass & Performance */}
          <div className="glass-section settings-glass" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Sliders size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t.glassCustomization}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Eco Mode Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.lowPerformanceMode}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.lowPerformanceModeDesc}</div>
                </div>
                <GlassToggle
                  checked={Boolean(settings.lowPerformanceMode)}
                  onChange={checked => handleUpdate('lowPerformanceMode', checked)}
                />
              </div>

              {/* Blur Slider */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', opacity: settings.lowPerformanceMode ? 0.4 : 1, transition: 'opacity 200ms ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t.blurIntensity}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {settings.lowPerformanceMode ? (language === 'ru' ? '0px (Отключено)' : '0px (Disabled)') : `${settings.blurAmount}px`}
                  </span>
                </div>
                <input
                  type="range"
                  className="glass-slider"
                  min="0"
                  max="50"
                  disabled={Boolean(settings.lowPerformanceMode)}
                  value={settings.blurAmount}
                  onChange={e => handleUpdate('blurAmount', Number(e.target.value))}
                />
              </div>

              {/* Opacity Slider */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t.cardOpacity}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{Math.round(settings.cardOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  className="glass-slider"
                  min="40"
                  max="95"
                  value={Math.round(settings.cardOpacity * 100)}
                  onChange={e => handleUpdate('cardOpacity', Number(e.target.value) / 100)}
                />
              </div>

              {/* Dynamic Shader Toggle */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.dynamicBg}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.dynamicBgDesc}</div>
                </div>
                <GlassToggle
                  checked={settings.dynamicBackground}
                  onChange={checked => handleUpdate('dynamicBackground', checked)}
                />
              </div>
            </div>
          </div>

          {/* Library Preferences */}
          <div className="glass-section settings-glass" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <LayoutGrid size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t.defaultView}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {[
                { id: 'grid' as const, label: t.viewGrid, icon: LayoutGrid },
                { id: 'compact' as const, label: t.viewCompact, icon: Grid2X2 },
                { id: 'list' as const, label: t.viewList, icon: List }
              ].map(v => {
                const VIcon = v.icon;
                const isSel = (settings.defaultView || 'grid') === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      soundEngine.playClick();
                      handleUpdate('defaultView', v.id);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '14px',
                      borderRadius: '10px',
                      background: isSel ? 'var(--bg-glass-hover)' : 'rgba(120, 120, 140, 0.05)',
                      border: isSel ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: isSel ? 700 : 500,
                      fontSize: '12px',
                      transition: 'all 160ms ease'
                    }}
                  >
                    <VIcon size={18} style={{ color: isSel ? 'var(--accent-primary)' : 'inherit' }} />
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                {t.defaultSort}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'recent' as const, label: t.sortRecent },
                  { id: 'playtime' as const, label: t.sortPlaytime },
                  { id: 'name' as const, label: t.sortName },
                  { id: 'added' as const, label: t.sortAdded }
                ].map(s => {
                  const isSel = (settings.sortBy || 'name') === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        soundEngine.playClick();
                        handleUpdate('sortBy', s.id);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isSel ? 'var(--bg-glass-hover)' : 'rgba(120, 120, 140, 0.05)',
                        border: isSel ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: isSel ? 600 : 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 160ms ease'
                      }}
                    >
                      <span>{s.label}</span>
                      {isSel && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: AUDIO */}
      {activeSection === 'audio' && (
        <div className="view-transition">
          <div className="glass-section settings-glass" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Volume2 size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t.soundEffects}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t.enableSounds}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {t.enableSoundsDesc}
                  </div>
                </div>
                <GlassToggle
                  checked={settings.soundEnabled}
                  onChange={checked => handleUpdate('soundEnabled', checked)}
                />
              </div>

              {settings.soundEnabled && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {t.soundVolume}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      {Math.round(settings.soundVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    className="glass-slider"
                    min="0"
                    max="100"
                    value={Math.round(settings.soundVolume * 100)}
                    onChange={e => handleUpdate('soundVolume', Number(e.target.value) / 100)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: SYSTEM & LANGUAGE */}
      {activeSection === 'system' && (
        <div className="view-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Language selection */}
          <div className="glass-section settings-glass" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Globe size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t.language}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  handleUpdate('language', 'ru');
                }}
                style={{
                  padding: '14px 20px',
                  borderRadius: '10px',
                  background: language === 'ru' ? 'var(--bg-glass-hover)' : 'rgba(120, 120, 140, 0.05)',
                  border: language === 'ru' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 160ms ease'
                }}
              >
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.russian}</span>
                {language === 'ru' && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  handleUpdate('language', 'en');
                }}
                style={{
                  padding: '14px 20px',
                  borderRadius: '10px',
                  background: language === 'en' ? 'var(--bg-glass-hover)' : 'rgba(120, 120, 140, 0.05)',
                  border: language === 'en' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 160ms ease'
                }}
              >
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.english}</span>
                {language === 'en' && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
              </button>
            </div>
          </div>

          {/* Windows & Behavior */}
          <div className="glass-section settings-glass" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Power size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {language === 'ru' ? 'Интеграция с Windows и запуск' : 'Windows & Launcher Behavior'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.startWithWindows}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.startWithWindowsDesc}</div>
                </div>
                <GlassToggle
                  checked={Boolean(settings.startWithWindows)}
                  onChange={checked => handleUpdate('startWithWindows', checked)}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.minimizeToTray}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.minimizeToTrayDesc}</div>
                </div>
                <GlassToggle
                  checked={settings.minimizeToTray !== false}
                  onChange={checked => handleUpdate('minimizeToTray', checked)}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.closeOnLaunch}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.closeOnLaunchDesc}</div>
                </div>
                <GlassToggle
                  checked={Boolean(settings.closeOnLaunch)}
                  onChange={checked => handleUpdate('closeOnLaunch', checked)}
                />
              </div>
            </div>
          </div>

          {/* Storage & Maintenance */}
          <div className="glass-section settings-glass" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <HardDrive size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {language === 'ru' ? 'Хранилище и кэш' : 'Storage & Maintenance'}
              </h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.clearCache}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.clearCacheDesc}</div>
                {cacheResult && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} />
                    <span>{cacheResult}</span>
                  </div>
                )}
              </div>

              <button
                className="btn btn-secondary"
                disabled={clearingCache}
                onClick={handleClearCache}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  borderRadius: '8px'
                }}
              >
                {clearingCache ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
                <span>{clearingCache ? (language === 'ru' ? 'Очистка...' : 'Clearing...') : t.clearCache}</span>
              </button>
            </div>
          </div>

          {/* Steam & Libraries */}
          <div className="glass-section settings-glass" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Gamepad2 size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t.steamIntegration}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    soundEngine.playClick();
                    onScanFolder();
                  }}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <FolderSearch size={13} />
                  <span>{t.scanFolder}</span>
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    soundEngine.playClick();
                    onScanSteam();
                  }}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <RefreshCw size={13} />
                  <span>{t.rescanSteam}</span>
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {t.steamPath}: <strong style={{ color: 'var(--text-primary)' }}>{steamStatus?.path || (language === 'ru' ? 'Клиент не найден' : 'Not detected')}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {t.libraries} ({steamStatus?.libraries.length || 0}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {steamStatus?.libraries && steamStatus.libraries.length > 0 ? (
                  steamStatus.libraries.map(p => (
                    <span
                      key={p}
                      style={{
                        fontSize: '11px',
                        background: 'rgba(120, 120, 140, 0.1)',
                        border: '1px solid var(--border-subtle)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontFamily: 'Consolas, monospace'
                      }}
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {language === 'ru' ? 'Библиотеки не обнаружены' : 'No library folders detected'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: INTEGRATIONS */}
      {activeSection === 'integrations' && (
        <div className="view-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Discord RPC */}
          <div className="glass-section settings-glass" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={18} style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Discord Rich Presence (RPC)
                  </h3>
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                    ● {language === 'ru' ? 'Расширенные статусы активны' : 'Enhanced Presence Active'}
                  </span>
                </div>
              </div>
              <GlassToggle
                checked={settings.discordRPC !== false}
                onChange={checked => handleUpdate('discordRPC', checked)}
              />
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {language === 'ru'
                ? 'Отображает текущую активность в вашем профиле Discord: когда вы в меню ("В меню"), просматриваете библиотеку ("Ищет игру"), меняете параметры ("Настраивает лаунчер"), запускаете или играете в игру ("Играет в [название]").'
                : 'Broadcasts dynamic statuses to your Discord profile: when browsing the launcher ("In Main Menu"), looking at games ("Looking for a game"), updating preferences ("Configuring launcher"), or playing games ("Playing [Game]").'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {[
                { label: language === 'ru' ? 'В главном меню' : 'In Main Menu', status: language === 'ru' ? 'В меню' : 'In Menu' },
                { label: language === 'ru' ? 'В библиотеке' : 'Browsing Library', status: language === 'ru' ? 'Ищет игру' : 'Looking for game' },
                { label: language === 'ru' ? 'В настройках' : 'In Settings', status: language === 'ru' ? 'Настраивает лаунчер' : 'Configuring' },
                { label: language === 'ru' ? 'При запуске' : 'On Game Launch', status: language === 'ru' ? 'Запускает [игра]' : 'Launching [game]' }
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-subtle)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>"{item.status}"</span>
                </div>
              ))}
            </div>
          </div>

          {/* SteamGridDB API Key */}
          <div className="glass-section settings-glass" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                SteamGridDB API
              </h3>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
              {language === 'ru'
                ? 'Персональный API-ключ SteamGridDB позволяет загружать альтернативные обложки сообщества высокого разрешения для любых игр.'
                : 'A personal SteamGridDB API key enables high-resolution community artwork for all library games.'}
            </div>

            <input
              type="password"
              value={settings.steamGridApiKey || ''}
              onChange={e => handleUpdate('steamGridApiKey', e.target.value)}
              placeholder="SteamGridDB API Key..."
              className="glass-input"
              style={{
                width: '100%',
                fontSize: '13px',
                padding: '10px 14px',
                borderRadius: '8px'
              }}
            />
          </div>

          {/* Valve GSI */}
          <div className="glass-section settings-glass" style={{ padding: '20px 24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Activity size={18} style={{ color: '#10B981' }} />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Valve Game State Integration (GSI)
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {language === 'ru'
                ? 'Автоматически подключено для Dota 2 и CS2. В режиме реального времени считывает состояние матча, счет и статистику K/D/A.'
                : 'Configured automatically for Dota 2 and CS2. Live match state, scores, and K/D/A stats are transmitted in real time.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
