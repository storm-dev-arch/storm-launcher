import React, { useEffect, useRef } from 'react';
import { Play, Star, FolderOpen, ExternalLink, Trash2, Tag, Compass, Sparkles, Share2 } from 'lucide-react';
import type { Game, CollectionRecord } from '../../shared/types';
import { translations, Language } from '../i18n/translations';

interface GameContextMenuProps {
  x: number;
  y: number;
  game: Game;
  collections: CollectionRecord[];
  onClose: () => void;
  onPlay: (game: Game) => void;
  onToggleFavorite: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onCreateShortcut: (id: string) => void;
  onDeleteGame?: (id: string) => void;
  onAddToCollection: (collectionId: string, gameId: string) => void;
  onOpenArtworkPicker?: (game: Game) => void;
  language: Language;
}

export const GameContextMenu: React.FC<GameContextMenuProps> = ({
  x,
  y,
  game,
  collections,
  onClose,
  onPlay,
  onToggleFavorite,
  onOpenFolder,
  onCreateShortcut,
  onDeleteGame,
  onAddToCollection,
  onOpenArtworkPicker,
  language
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const t = translations[language].contextMenu;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  const posX = Math.min(x, window.innerWidth - 230);
  const posY = Math.min(y, window.innerHeight - 320);

  return (
    <div
      ref={menuRef}
      className="fade-in"
      style={{
        position: 'fixed',
        left: `${posX}px`,
        top: `${posY}px`,
        width: '220px',
        background: 'rgba(12, 12, 16, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--border-highlight)',
        borderRadius: '12px',
        padding: '6px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
        zIndex: 2500,
        userSelect: 'none'
      }}
    >
      <div style={{ padding: '6px 10px 8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {game.name}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {game.source} • {game.installed ? (translations[language].gameCard.installed) : ''}
        </div>
      </div>

      <button
        onClick={() => {
          onPlay(game);
          onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '8px 10px',
          borderRadius: '6px',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          textAlign: 'left'
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <Play size={14} fill="#fff" />
        <span>{t.play}</span>
      </button>

      <button
        onClick={() => {
          onToggleFavorite(game.id);
          onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '8px 10px',
          borderRadius: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: '12px',
          cursor: 'pointer',
          textAlign: 'left'
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <Star size={14} fill={game.favorite ? '#F59E0B' : 'none'} style={{ color: game.favorite ? '#F59E0B' : 'inherit' }} />
        <span>{game.favorite ? t.unfavorite : t.favorite}</span>
      </button>

      <button
        onClick={() => {
          onCreateShortcut(game.id);
          onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '8px 10px',
          borderRadius: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: '12px',
          cursor: 'pointer',
          textAlign: 'left'
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <Share2 size={14} />
        <span>{t.shortcut}</span>
      </button>

      <button
        onClick={() => {
          onOpenFolder(game.id);
          onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '8px 10px',
          borderRadius: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: '12px',
          cursor: 'pointer',
          textAlign: 'left'
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <FolderOpen size={14} />
        <span>{t.openFolder}</span>
      </button>

      {onOpenArtworkPicker && (
        <button
          onClick={() => {
            onOpenArtworkPicker(game);
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '12px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>{language === 'ru' ? 'Найти постер (SteamGrid)' : 'Find Artwork (SteamGrid)'}</span>
        </button>
      )}

      {/* Collections Sublist */}
      {collections.length > 0 && (
        <div style={{ margin: '4px 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '2px 8px', textTransform: 'uppercase' }}>
            {t.addToCol}
          </div>
          {collections.slice(0, 4).map(col => (
            <button
              key={col.id}
              onClick={() => {
                onAddToCollection(col.id, game.id);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '5px 10px',
                borderRadius: '5px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: col.color || '#fff' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.name}</span>
            </button>
          ))}
        </div>
      )}

      {onDeleteGame && (
        <div style={{ marginTop: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
          <button
            onClick={() => {
              onDeleteGame(game.id);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'none',
              border: 'none',
              color: '#F43F5E',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Trash2 size={14} />
            <span>{t.remove}</span>
          </button>
        </div>
      )}
    </div>
  );
};
