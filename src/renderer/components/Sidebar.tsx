import React from 'react';
import {
  LayoutDashboard,
  LayoutGrid,
  CheckCircle2,
  Star,
  Clock,
  FolderClosed,
  BarChart2,
  Settings,
  Plus,
  Gamepad2,
  FolderCode,
  Zap,
  Globe
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

export type PageId =
  | 'overview'
  | 'library'
  | 'installed'
  | 'favorites'
  | 'recent'
  | 'collections'
  | 'statistics'
  | 'settings'
  | 'steam'
  | 'epic'
  | 'gog'
  | 'custom';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  installedCount: number;
  favoriteCount: number;
  steamCount: number;
  customCount: number;
  epicCount?: number;
  gogCount?: number;
  onAddCustomGame: () => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  installedCount,
  favoriteCount,
  steamCount,
  customCount,
  epicCount = 0,
  gogCount = 0,
  onAddCustomGame,
  language
}) => {
  const t = translations[language].nav;

  const handleNav = (id: PageId) => {
    soundEngine.playTab();
    onNavigate(id);
  };

  const mainNav = [
    { id: 'overview' as PageId, label: t.overview, icon: LayoutDashboard },
    { id: 'library' as PageId, label: t.library, icon: LayoutGrid },
    { id: 'installed' as PageId, label: t.installed, icon: CheckCircle2, badge: installedCount },
    { id: 'favorites' as PageId, label: t.favorites, icon: Star, badge: favoriteCount },
    { id: 'recent' as PageId, label: t.recent, icon: Clock },
    { id: 'collections' as PageId, label: t.collections, icon: FolderClosed },
    { id: 'statistics' as PageId, label: t.statistics, icon: BarChart2 }
  ];

  return (
    <aside
      style={{
        width: '240px',
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 12px',
        flexShrink: 0,
        zIndex: 10,
        userSelect: 'none'
      }}
    >
      <div>
        {/* Main Nav Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '24px' }}>
          {mainNav.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: isActive ? 'var(--bg-glass-hover)' : 'transparent',
                  border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease'
                }}
                onMouseEnter={e => {
                  soundEngine.playHover();
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} style={{ color: isActive ? 'var(--accent-primary)' : 'inherit' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 600
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Source Categories - Now Clickable! */}
        <div style={{ padding: '0 8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {t.sources}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <button 
              onClick={() => handleNav('steam')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                background: activePage === 'steam' ? 'var(--bg-glass-hover)' : 'transparent',
                border: activePage === 'steam' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                color: activePage === 'steam' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'background 120ms ease, color 120ms ease'
              }}
              onMouseEnter={e => {
                soundEngine.playHover();
                if (activePage !== 'steam') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (activePage !== 'steam') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gamepad2 size={14} style={{ color: '#38BDF8' }} />
                <span>{t.steamGames}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{steamCount}</span>
            </button>

            <button 
              onClick={() => handleNav('epic')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                background: activePage === 'epic' ? 'var(--bg-glass-hover)' : 'transparent',
                border: activePage === 'epic' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                color: activePage === 'epic' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'background 120ms ease, color 120ms ease'
              }}
              onMouseEnter={e => {
                soundEngine.playHover();
                if (activePage !== 'epic') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (activePage !== 'epic') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={14} style={{ color: '#10B981' }} />
                <span>{t.epicGames}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{epicCount}</span>
            </button>

            <button 
              onClick={() => handleNav('gog')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                background: activePage === 'gog' ? 'var(--bg-glass-hover)' : 'transparent',
                border: activePage === 'gog' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                color: activePage === 'gog' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'background 120ms ease, color 120ms ease'
              }}
              onMouseEnter={e => {
                soundEngine.playHover();
                if (activePage !== 'gog') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (activePage !== 'gog') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={14} style={{ color: '#A855F7' }} />
                <span>{t.gogGames}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{gogCount}</span>
            </button>

            <button 
              onClick={() => handleNav('custom')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                background: activePage === 'custom' ? 'var(--bg-glass-hover)' : 'transparent',
                border: activePage === 'custom' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                color: activePage === 'custom' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'background 120ms ease, color 120ms ease'
              }}
              onMouseEnter={e => {
                soundEngine.playHover();
                if (activePage !== 'custom') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (activePage !== 'custom') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderCode size={14} style={{ color: '#F59E0B' }} />
                <span>{t.customGames}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{customCount}</span>
            </button>
          </div>
        </div>

        {/* Add Game Button */}
        <div style={{ padding: '12px 6px 0 6px' }}>
          <button
            onClick={() => {
              soundEngine.playClick();
              onAddCustomGame();
            }}
            className="btn btn-secondary"
            style={{
              width: '100%',
              fontSize: '12px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={() => soundEngine.playHover()}
          >
            <Plus size={14} />
            <span>{t.addGame}</span>
          </button>
        </div>
      </div>

      {/* Bottom Settings & Version */}
      <div>
        <button
          onClick={() => {
            soundEngine.playTab();
            handleNav('settings');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '9px 12px',
            borderRadius: '8px',
            background: activePage === 'settings' ? 'var(--bg-glass-hover)' : 'transparent',
            border: activePage === 'settings' ? '1px solid var(--border-highlight)' : '1px solid transparent',
            color: activePage === 'settings' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activePage === 'settings' ? 600 : 500,
            transition: 'background 120ms ease, color 120ms ease'
          }}
          onMouseEnter={e => {
            if (activePage !== 'settings') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={e => {
            if (activePage !== 'settings') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          <Settings size={16} />
          <span>{t.settings}</span>
        </button>

        <div
          style={{
            padding: '8px 12px 0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'var(--text-dim)'
          }}
        >
          <span>STORM LAUNCHER</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
