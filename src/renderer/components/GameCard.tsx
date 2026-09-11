import React, { useState } from 'react';
import { Play, Star, MoreVertical, CheckCircle2, Download } from 'lucide-react';
import type { Game } from '../../shared/types';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  onOpenDetails: (game: Game) => void;
  onToggleFavorite: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, game: Game) => void;
  compact?: boolean;
  language?: 'en' | 'ru';
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onPlay,
  onOpenDetails,
  onToggleFavorite,
  onContextMenu,
  compact = false,
  language = 'ru'
}) => {
  const isRu = language === 'ru';
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPlaytime = (mins: number) => {
    if (!mins || mins === 0) return 'Not played';
    if (mins < 60) return `${mins}m`;
    const hours = (mins / 60).toFixed(1).replace('.0', '');
    return `${hours}h played`;
  };

  const coverSrc = game.artwork.cover || game.artwork.hero;

  return (
    <div
      className="glass-card"
      onClick={() => onOpenDetails(game)}
      onContextMenu={(e) => onContextMenu(e, game)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        background: 'var(--bg-card)',
        width: '100%',
        maxWidth: '220px'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: compact ? '16/9' : '2/3',
          background: '#0B0B0E',
          overflow: 'hidden'
        }}
      >
        {coverSrc && !imageError ? (
          <img
            src={coverSrc}
            alt={game.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 300ms ease, transform 300ms ease'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(25,25,32,0.8), rgba(12,12,16,0.95))'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '10px'
              }}
            >
              {game.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', lineClamp: 2 }}>
              {game.name}
            </div>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 5
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(game.id);
            }}
            style={{
              background: game.favorite ? 'rgba(245, 158, 11, 0.9)' : 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              padding: '5px',
              color: game.favorite ? '#000000' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'transform 150ms ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            title={game.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={13} fill={game.favorite ? '#000000' : 'none'} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, game);
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              padding: '5px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="More actions"
          >
            <MoreVertical size={13} />
          </button>
        </div>

        <div
          className="hover-play-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 180ms ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(game);
            }}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(255,255,255,0.3)',
              transition: 'transform 150ms ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            title={game.installed ? (isRu ? 'Запустить' : 'Launch Game') : (isRu ? 'Установить' : 'Install')}
          >
            {game.installed ? (
              <Play size={22} style={{ color: '#000000', fill: '#000000', marginLeft: '3px' }} />
            ) : (
              <Download size={22} style={{ color: '#000000' }} />
            )}
          </button>
        </div>

        {game.installed ? (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(6px)',
              padding: '3px 7px',
              borderRadius: '10px',
              fontSize: '10px',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }} />
            <span>{isRu ? 'Установлена' : 'Installed'}</span>
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(6px)',
              padding: '3px 7px',
              borderRadius: '10px',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
          >
            <Download size={10} style={{ color: 'rgba(255,255,255,0.7)' }} />
            <span>{isRu ? 'В библиотеке' : 'In Library'}</span>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>
        <h4
          style={{
            margin: '0 0 4px 0',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={game.name}
        >
          {game.name}
        </h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>{formatPlaytime(game.playtimeMinutes)}</span>
          <span style={{ textTransform: 'capitalize' }}>{game.source}</span>
        </div>
      </div>
    </div>
  );
};
