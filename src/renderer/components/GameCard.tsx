import React, { useState, useEffect } from 'react';
import { Play, Star, MoreVertical, CheckCircle2, Download, Gamepad2 } from 'lucide-react';
import type { Game } from '../../shared/types';
import { useImageCache } from '../hooks/useImageCache';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  onOpenDetails: (game: Game) => void;
  onToggleFavorite: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, game: Game) => void;
  compact?: boolean;
  language?: 'en' | 'ru';
  isFocused?: boolean;
}

const attemptedCards = new Set<string>();

const GameCardComponent: React.FC<GameCardProps> = ({
  game,
  onPlay,
  onOpenDetails,
  onToggleFavorite,
  onContextMenu,
  compact = false,
  language = 'ru',
  isFocused = false
}) => {
  const isRu = language === 'ru';
  const { set, has } = useImageCache();
  const coverSrc = game.artwork.cover || game.artwork.hero;
  const [autoCover, setAutoCover] = useState<string | null>(null);
  const activeCover = autoCover || coverSrc;

  const isCached = activeCover ? has(activeCover) : false;
  const [imageLoaded, setImageLoaded] = useState(() => isCached);
  const [imageError, setImageError] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCover) {
      if (has(activeCover) || imgRef.current?.complete) {
        setImageLoaded(true);
      }
    }
  }, [activeCover]);

  useEffect(() => {
    if (!activeCover && !imageError && !attemptedCards.has(game.id)) {
      attemptedCards.add(game.id);
      window.stormPlay.steamGrid.search(game.name, 'cover')
        .then(async (results) => {
          if (results && results.length > 0) {
            const updated = await window.stormPlay.steamGrid.applyArtwork(game.id, 'cover', results[0].url);
            if (updated?.artwork?.cover) {
              setAutoCover(updated.artwork.cover);
            }
          }
        })
        .catch(() => {});
    }
  }, [activeCover, imageError, game.id, game.name]);

  const formatPlaytime = (mins: number) => {
    if (!mins || mins === 0) return 'Not played';
    if (mins < 60) return `${mins}m`;
    const hours = (mins / 60).toFixed(1).replace('.0', '');
    return `${hours}h played`;
  };

  return (
    <div
      ref={containerRef}
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
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: compact ? '16/9' : '2/3',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }}
      >
        {activeCover && !imageError ? (
          <>
            {!imageLoaded && (
              <div
                className="glass-shimmer"
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1
                }}
              />
            )}
            <img
              ref={imgRef}
              src={activeCover}
              alt=""
              loading="lazy"
              decoding="async"
              onLoad={() => {
                if (activeCover) {
                  set(activeCover);
                }
                setImageLoaded(true);
              }}
              onError={() => setImageError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
                transform: 'scale(1.0)',
                transition: isCached ? 'none' : 'opacity 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: isCached ? 'auto' : 'opacity'
              }}
            />
          </>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 12px',
              textAlign: 'center',
              background: 'var(--bg-surface)'
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                boxShadow: 'var(--shadow-card)',
                marginBottom: '10px'
              }}
            >
              <Gamepad2 size={24} />
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
                maxHeight: '2.6em',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
                padding: '0 4px'
              }}
            >
              {game.name}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {isRu ? 'Обложка отсутствует' : 'No artwork'}
            </span>
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
              background: game.favorite ? 'rgba(245, 158, 11, 0.9)' : 'rgba(10, 10, 15, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '5px',
              color: game.favorite ? '#000000' : 'rgba(255, 255, 255, 0.7)',
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
              background: 'rgba(10, 10, 15, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '5px',
              color: 'rgba(255, 255, 255, 0.7)',
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
            background: 'linear-gradient(to top, rgba(3,3,5,0.95) 0%, rgba(3,3,5,0.4) 60%, transparent 100%)',
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
              background: 'rgba(0, 0, 0, 0.65)',
              padding: '3px 7px',
              borderRadius: '10px',
              fontSize: '10px',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              backdropFilter: 'blur(8px)'
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
              background: 'rgba(0, 0, 0, 0.65)',
              padding: '3px 7px',
              borderRadius: '10px',
              fontSize: '10px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <Download size={10} style={{ color: '#FFFFFF' }} />
            <span>{isRu ? 'В библиотеке' : 'In Library'}</span>
          </div>
        )}

        {game.tags && game.tags.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            display: 'flex',
            gap: '4px',
            zIndex: 4
          }}>
            {game.tags.slice(0, 2).map((tag, i) => (
              <span key={i} style={{
                background: 'rgba(0, 0, 0, 0.65)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '9px',
                fontWeight: 600,
                backdropFilter: 'blur(8px)'
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px' }}>
        <h4
          style={{
            margin: '0 0 3px 0',
            fontSize: '12.5px',
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
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatPlaytime(game.playtimeMinutes)}</span>
          <span style={{ textTransform: 'capitalize', flexShrink: 0, marginLeft: '6px' }}>{game.source}</span>
        </div>
      </div>
    </div>
  );
};

export const GameCard = React.memo(GameCardComponent);
