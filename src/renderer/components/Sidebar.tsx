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
  Globe,
  Crosshair
} from 'lucide-react';
import { translations, Language } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';
import { NowPlayingWidget } from './NowPlayingWidget';
import type { ActiveGameInfo, LiveGameStats, Game } from '../../shared/types';

export type PageId =
  | 'overview'
  | 'library'
  | 'installed'
  | 'favorites'
  | 'recent'
  | 'collections'
  | 'statistics'
  | 'inspector'
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
  activeGame?: ActiveGameInfo | null;
  gsiStats?: LiveGameStats | null;
  activeGameData?: Game | null;
  onOpenDetails?: (game: Game) => void;
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
  language,
  activeGame,
  gsiStats,
  activeGameData,
  onOpenDetails
}) => {
  const t = translations[language].nav;

  const handleNav = (id: PageId) => {
    soundEngine.playClick();
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
          {mainNav.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--border-subtle)' : 'transparent',
                  border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  boxShadow: isActive ? 'var(--shadow-card)' : 'none',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  transition: 'background-color 160ms ease, color 160ms ease, border-color 160ms ease'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-glass-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} style={{ color: isActive ? 'var(--text-primary)' : 'inherit' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '1px 8px',
                      borderRadius: '12px',
                      background: isActive
                        ? 'var(--bg-card-hover)'
                        : 'var(--border-subtle)',
                      border: '1px solid var(--border-subtle)',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
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

        <div style={{ padding: '0 4px', marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '8px' }}>
            {t.sources}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {[
              { id: 'steam' as PageId, label: t.steamGames, icon: Gamepad2, count: steamCount },
              { id: 'epic' as PageId, label: t.epicGames, icon: Zap, count: epicCount },
              { id: 'gog' as PageId, label: t.gogGames, icon: Globe, count: gogCount },
              { id: 'custom' as PageId, label: t.customGames, icon: FolderCode, count: customCount }
            ].map(src => {
              const Icon = src.icon;
              const isSel = activePage === src.id;
              return (
                <button
                  key={src.id}
                  onClick={() => handleNav(src.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    background: isSel ? 'var(--border-subtle)' : 'transparent',
                    border: isSel ? '1px solid var(--border-highlight)' : '1px solid transparent',
                    boxShadow: isSel ? 'var(--shadow-card)' : 'none',
                    color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'background-color 160ms ease, color 160ms ease, border-color 160ms ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSel) {
                      e.currentTarget.style.background = 'var(--bg-glass-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSel) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={14} style={{ opacity: isSel ? 1 : 0.8 }} />
                    <span>{src.label}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{src.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '10px 4px 0 4px' }}>
          <button
            onClick={() => {
              soundEngine.playClick();
              onAddCustomGame();
            }}
            style={{
              width: '100%',
              fontSize: '12px',
              fontWeight: 600,
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              borderRadius: '10px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
              transition: 'background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-card-hover)';
              e.currentTarget.style.borderColor = 'var(--border-highlight)';
              e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'var(--shadow-card)';
            }}
          >
            <Plus size={14} />
            <span>{t.addGame}</span>
          </button>
        </div>
      </div>

      <div>
        {(activeGame || gsiStats) && (
          <div style={{ marginBottom: '12px' }}>
            <NowPlayingWidget
              activeGame={activeGame || null}
              gsiStats={gsiStats || null}
              gameData={activeGameData}
              language={language}
              onOpenDetails={onOpenDetails}
            />
          </div>
        )}

        <button
          onClick={() => {
            soundEngine.playClick();
            handleNav('settings');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '9px 12px',
            borderRadius: '10px',
            background: activePage === 'settings' ? 'var(--border-subtle)' : 'transparent',
            border: activePage === 'settings' ? '1px solid var(--border-highlight)' : '1px solid transparent',
            boxShadow: activePage === 'settings' ? 'var(--shadow-card)' : 'none',
            color: activePage === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activePage === 'settings' ? 600 : 500,
            transition: 'background-color 160ms ease, color 160ms ease, border-color 160ms ease'
          }}
          onMouseEnter={e => {
            if (activePage !== 'settings') {
              e.currentTarget.style.background = 'var(--bg-glass-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }
          }}
          onMouseLeave={e => {
            if (activePage !== 'settings') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'transparent';
            }
          }}
        >
          <Settings size={16} strokeWidth={activePage === 'settings' ? 2.2 : 1.8} />
          <span>{t.settings}</span>
        </button>

        <div
          style={{
            padding: '10px 12px 2px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10px',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)'
          }}
        >
          <span style={{ fontWeight: 600 }}>STORM LAUNCHER</span>
          <span style={{ padding: '1px 6px', borderRadius: '6px', background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>v1.2.3</span>
        </div>
      </div>
    </aside>
  );
};
