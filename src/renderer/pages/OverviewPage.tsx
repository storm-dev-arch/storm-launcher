import React from 'react';
import { Play, Star, Clock, Zap, CheckCircle2, ChevronRight, Gamepad2, ArrowUpRight } from 'lucide-react';
import type { Game, ActiveGameInfo, LiveGameStats } from '../../shared/types';
import type { PageId } from '../components/Sidebar';
import { GameCard } from '../components/GameCard';
import { translations, Language } from '../i18n/translations';
import { NowPlayingWidget } from '../components/NowPlayingWidget';

interface OverviewPageProps {
  games: Game[];
  onPlay: (game: Game) => void;
  onOpenDetails: (game: Game) => void;
  onToggleFavorite: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, game: Game) => void;
  onNavigate: (page: PageId) => void;
  language: Language;
  activeGame?: ActiveGameInfo | null;
  gsiStats?: LiveGameStats | null;
  activeGameData?: Game | null;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  games,
  onPlay,
  onOpenDetails,
  onToggleFavorite,
  onContextMenu,
  onNavigate,
  language,
  activeGame,
  gsiStats,
  activeGameData
}) => {
  const t = translations[language].overview;

  const installedGames = games.filter(g => g.installed);
  const featuredGame = installedGames.slice().sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))[0] 
    || installedGames.slice().sort((a, b) => (b.playtimeMinutes || 0) - (a.playtimeMinutes || 0))[0]
    || games[0];

  const recentGames = games
    .filter(g => (g.lastPlayed || 0) > 0)
    .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
    .slice(0, 5);

  const formatPlaytime = (mins: number) => {
    if (!mins) return translations[language].gameCard.never;
    if (mins < 60) return `${mins} ${translations[language].gameCard.minutes}`;
    return `${(mins / 60).toFixed(1)} ${translations[language].gameCard.hours}`;
  };

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto' }}>
      {(activeGame || gsiStats) && (
        <div style={{ marginBottom: '28px' }}>
          <NowPlayingWidget
            variant="banner"
            activeGame={activeGame || null}
            gsiStats={gsiStats || null}
            gameData={activeGameData}
            language={language}
            onOpenDetails={onOpenDetails}
          />
        </div>
      )}

      {featuredGame && (
        <section
          style={{
            position: 'relative',
            minHeight: '340px',
            borderRadius: '20px',
            overflow: 'hidden',
            marginBottom: '36px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            padding: '32px 40px'
          }}
        >
          {featuredGame.artwork.hero || featuredGame.artwork.cover ? (
            <img
              src={featuredGame.artwork.hero || featuredGame.artwork.cover}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(50px) brightness(0.25) scale(1.05)',
                transform: 'scale(1.05)',
                pointerEvents: 'none'
              }}
            />
          ) : null}

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(5, 5, 8, 0.2) 0%, rgba(5, 5, 8, 0.75) 100%), linear-gradient(90deg, rgba(5, 5, 8, 0.88) 0%, rgba(5, 5, 8, 0.35) 100%)'
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '32px', width: '100%', flexWrap: 'wrap' }}>
            {(featuredGame.artwork.cover || featuredGame.artwork.hero) && (
              <div
                style={{
                  width: '160px',
                  height: '240px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-card)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)'
                }}
              >
                <img
                  src={featuredGame.artwork.cover || featuredGame.artwork.hero}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{ flex: 1, minWidth: '280px', maxWidth: '720px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: 'none',
                    padding: '4px 11px',
                    borderRadius: '16px',
                    color: '#fff'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                  {t.continuePlaying}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
                  {formatPlaytime(featuredGame.playtimeMinutes)}
                </span>
                {featuredGame.lastPlayed && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    • {language === 'ru' ? 'Был запущен: ' : 'Last played: '}{new Date(featuredGame.lastPlayed).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h1
                className="unbounded-font"
                style={{
                  fontSize: '34px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#fff',
                  margin: '0 0 14px 0',
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.9)',
                  lineHeight: 1.15
                }}
              >
                {featuredGame.name}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '20px' }}>
                <button
                  onClick={() => onPlay(featuredGame)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '13px 28px',
                    borderRadius: '30px',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#000000',
                    background: '#FFFFFF',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                    cursor: 'pointer',
                    transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#f4f4f5';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 22px rgba(0, 0, 0, 0.65)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.5)';
                  }}
                >
                  <Play size={18} fill="currentColor" />
                  <span>{translations[language].gameCard.play}</span>
                </button>

                <button
                  onClick={() => onOpenDetails(featuredGame)}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '30px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#fff',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                  }}
                >
                  <span>{language === 'ru' ? 'Подробнее' : 'Details'}</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div style={{ display: 'flex', gap: '18px', marginBottom: '38px' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: '18px', borderRadius: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gamepad2 size={24} style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>{language === 'ru' ? 'Всего игр' : 'Total Games'}</div>
            <div className="unbounded-font" style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 800 }}>{games.length}</div>
          </div>
        </div>
        
        <div className="glass-panel" style={{ flex: 1, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: '18px', borderRadius: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} style={{ color: '#10B981' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>{language === 'ru' ? 'Установлено' : 'Installed'}</div>
            <div className="unbounded-font" style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 800 }}>{installedGames.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: 1, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: '18px', borderRadius: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>{language === 'ru' ? 'Всего часов' : 'Total Time'}</div>
            <div className="unbounded-font" style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 800 }}>
              {(games.reduce((acc, g) => acc + (g.playtimeMinutes || 0), 0) / 60).toFixed(0)} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{language === 'ru' ? 'ч' : 'h'}</span>
            </div>
          </div>
        </div>
      </div>

      {recentGames.length > 0 && (
        <section style={{ marginBottom: '38px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={15} style={{ color: 'var(--text-primary)' }} />
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                {t.recentlyPlayed}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('recent')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                padding: '5px 12px',
                borderRadius: '8px',
                transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <span>{t.viewAll}</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: '14px',
              width: '100%',
              padding: '8px 4px',
              overflow: 'visible'
            }}
          >
            {recentGames.map((game, index) => (
              <div key={game.id} className="stagger-item" style={{ animationDelay: `${index * 50}ms`, overflow: 'visible' }}>
                <GameCard
                  game={game}
                  compact
                  onPlay={onPlay}
                  onOpenDetails={onOpenDetails}
                  onToggleFavorite={onToggleFavorite}
                  onContextMenu={onContextMenu}
                  language={language}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gamepad2 size={15} style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              {t.allLibrary}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>({games.length})</span>
          </div>
          <button
            onClick={() => onNavigate('library')}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: '5px 12px',
              borderRadius: '8px',
              transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <span>{t.viewAll}</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: '14px',
            width: '100%',
            padding: '8px 4px',
            overflow: 'visible'
          }}
        >
          {games.slice(0, 10).map((game, index) => (
            <div key={game.id} className="stagger-item" style={{ animationDelay: `${(index + recentGames.length) * 50}ms`, overflow: 'visible' }}>
              <GameCard
                game={game}
                onPlay={onPlay}
                onOpenDetails={onOpenDetails}
                onToggleFavorite={onToggleFavorite}
                onContextMenu={onContextMenu}
                language={language}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
