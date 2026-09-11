import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Check, Loader2, Sparkles, Layers } from 'lucide-react';
import type { Game, SteamGridArtItem } from '../../shared/types';
import { translations, Language } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface SteamGridModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
  onArtworkUpdated: (updatedGame: Game) => void;
  language: Language;
}

export const SteamGridModal: React.FC<SteamGridModalProps> = ({
  game,
  isOpen,
  onClose,
  onArtworkUpdated,
  language
}) => {
  const [query, setQuery] = useState(game.name);
  const [artType, setArtType] = useState<'cover' | 'hero' | 'logo'>('cover');
  const [items, setItems] = useState<SteamGridArtItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItemUrl, setSelectedItemUrl] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery(game.name);
      fetchArtwork(game.name, artType);
    }
  }, [isOpen, game.name, artType]);

  const fetchArtwork = async (searchQuery: string, type: 'cover' | 'hero' | 'logo') => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const results = await window.stormPlay.steamGrid.search(searchQuery, type);
      setItems(results || []);
    } catch (err) {
      console.error('Failed to search artwork:', err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (item: SteamGridArtItem) => {
    soundEngine.playClick();
    setSelectedItemUrl(item.url);
    setIsApplying(true);
    try {
      const updated = await window.stormPlay.steamGrid.applyArtwork(game.id, artType, item.url);
      onArtworkUpdated(updated);
      setTimeout(() => {
        setIsApplying(false);
        onClose();
      }, 350);
    } catch (err) {
      console.error('Failed to apply artwork:', err);
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-modal view-transition"
        style={{
          width: '820px',
          maxWidth: '92vw',
          maxHeight: '86vh',
          backgroundColor: 'var(--bg-modal, #0c0c10)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                {language === 'ru' ? 'Выбор обложки (SteamGrid)' : 'Find Artwork (SteamGrid)'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                {game.name}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          >
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  soundEngine.playClick();
                  fetchArtwork(query, artType);
                }
              }}
              placeholder={language === 'ru' ? 'Название игры...' : 'Search title...'}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '13px'
              }}
            />
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              fetchArtwork(query, artType);
            }}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            {language === 'ru' ? 'Искать' : 'Search'}
          </button>

          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => {
                soundEngine.playTab();
                setArtType('cover');
              }}
              style={{
                background: artType === 'cover' ? 'var(--accent-primary)' : 'transparent',
                color: artType === 'cover' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {language === 'ru' ? 'Постер (2:3)' : 'Cover (2:3)'}
            </button>
            <button
              onClick={() => {
                soundEngine.playTab();
                setArtType('hero');
              }}
              style={{
                background: artType === 'hero' ? 'var(--accent-primary)' : 'transparent',
                color: artType === 'hero' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {language === 'ru' ? 'Баннер (16:9)' : 'Hero (16:9)'}
            </button>
            <button
              onClick={() => {
                soundEngine.playTab();
                setArtType('logo');
              }}
              style={{
                background: artType === 'logo' ? 'var(--accent-primary)' : 'transparent',
                color: artType === 'logo' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {language === 'ru' ? 'Логотип (PNG)' : 'Logo (PNG)'}
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            minHeight: '340px'
          }}
        >
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '12px' }}>
              <Loader2 size={28} className="spin" style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {language === 'ru' ? 'Поиск лучших артов...' : 'Searching high-res artwork...'}
              </span>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <ImageIcon size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>
                {language === 'ru' ? 'Ничего не найдено по этому запросу' : 'No artwork found for this query'}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
                {language === 'ru' ? 'Попробуйте изменить поисковое название игры выше' : 'Try adjusting the game title in the search box above'}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: artType === 'cover'
                  ? 'repeat(auto-fill, minmax(160px, 1fr))'
                  : 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: '16px'
              }}
            >
              {items.map((item) => {
                const isSelected = selectedItemUrl === item.url;
                return (
                  <div
                    key={item.id}
                    onClick={() => !isApplying && handleApply(item)}
                    onMouseEnter={() => soundEngine.playHover()}
                    style={{
                      position: 'relative',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      cursor: isApplying ? 'wait' : 'pointer',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      background: '#07070a',
                      aspectRatio: artType === 'cover' ? '2/3' : artType === 'hero' ? '16/9' : '16/8',
                      transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease'
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.6)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <img
                      src={item.thumb || item.url}
                      alt={item.author || 'Artwork'}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: artType === 'logo' ? 'contain' : 'cover',
                        padding: artType === 'logo' ? '12px' : 0,
                        display: 'block'
                      }}
                    />

                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(56, 189, 248, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Check size={28} style={{ color: '#fff', strokeWidth: 3 }} />
                      </div>
                    )}

                    {item.author && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '4px 8px',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                          fontSize: '10px',
                          color: '#ccc',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.author}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
