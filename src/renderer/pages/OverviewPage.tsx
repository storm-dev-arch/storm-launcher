import React from 'react';
import { Play, Star, Clock, Zap, CheckCircle2, ChevronRight, Gamepad2, ArrowUpRight } from 'lucide-react';
import type { Game } from '../../shared/types';
import type { PageId } from '../components/Sidebar';
import { GameCard } from '../components/GameCard';
import { translations, Language } from '../i18n/translations';

interface OverviewPageProps {
  games: Game[];
  onPlay: (game: Game) => void;
  onOpenDetails: (game: Game) => void;
  onToggleFavorite: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, game: Game) => void;
  onNavigate: (page: PageId) => void;
  language: Language;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  games,
  onPlay,
  onOpenDetails,
  onToggleFavorite,
  onContextMenu,
  onNavigate,
  language
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
    <div className="view-transition" style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Featured Game Hero Banner */}
      {featuredGame && (
        <section
          style={{
            position: 'relative',
            minHeight: '320px',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '36px',
            border: '1px solid var(--border-subtle)',
            background: '#0a0a0d',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '36px'
          }}
        >
          {/* Background Hero Artwork */}
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
                opacity: 0.42,
                filter: 'brightness(0.85)'
              }}
            />
          ) : null}

          {/* Vignette Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(6,6,8,0.1) 0%, rgba(6,6,8,0.7) 60%, rgba(6,6,8,0.96) 100%), linear-gradient(90deg, rgba(6,6,8,0.9) 0%, rgba(6,6,8,0.2) 60%)'
            }}
          />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                  padding: '3px 9px',
                  borderRadius: '12px',
                  color: '#fff'
                }}
              >
                {t.continuePlaying}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {formatPlaytime(featuredGame.playtimeMinutes)}
              </span>
            </div>

            <h1
              style={{
                fontSize: '32px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#fff',
                margin: '0 0 12px 0',
                textShadow: '0 2px 12px rgba(0,0,0,0.8)'
              }}
            >
              {featuredGame.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px' }}>
              <button
                onClick={() => onPlay(featuredGame)}
                className="btn btn-play"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Play size={18} fill="#000" />
                <span>{translations[language].gameCard.play}</span>
              </button>

              <button
                onClick={() => onOpenDetails(featuredGame)}
                className="btn btn-secondary"
                style={{ padding: '12px 20px', borderRadius: '30px', fontSize: '13px' }}
              >
                <span>{translations[language].gameDetail.openFolder}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Recent Activity Section */}
      {recentGames.length > 0 && (
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>
                {t.recentlyPlayed}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('recent')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <span>{t.viewAll}</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 200px))',
              gap: '16px',
              justifyContent: 'start'
            }}
          >
            {recentGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                compact
                onPlay={onPlay}
                onOpenDetails={onOpenDetails}
                onToggleFavorite={onToggleFavorite}
                onContextMenu={onContextMenu}
                language={language}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Games Grid Preview */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gamepad2 size={16} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>
              {t.allLibrary}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({games.length})</span>
          </div>
          <button
            onClick={() => onNavigate('library')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <span>{t.viewAll}</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 220px))',
            gap: '20px',
            justifyContent: 'start'
          }}
        >
          {games.slice(0, 10).map(game => (
            <GameCard
              key={game.id}
              game={game}
              onPlay={onPlay}
              onOpenDetails={onOpenDetails}
              onToggleFavorite={onToggleFavorite}
              onContextMenu={onContextMenu}
              language={language}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
