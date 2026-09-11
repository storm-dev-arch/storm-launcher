import React, { useState } from 'react';
import { FolderPlus, FolderClosed, Trash2, ArrowRight, Gamepad2, Plus } from 'lucide-react';
import type { CollectionRecord, Game } from '../../shared/types';
import { translations, Language } from '../i18n/translations';

interface CollectionsPageProps {
  collections: CollectionRecord[];
  games: Game[];
  onCreateCollection: (name: string, color?: string) => void;
  onDeleteCollection: (id: string) => void;
  onOpenGame: (game: Game) => void;
  language: Language;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({
  collections,
  games,
  onCreateCollection,
  onDeleteCollection,
  onOpenGame,
  language
}) => {
  const [newColName, setNewColName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#38BDF8');
  const [selectedColId, setSelectedColId] = useState<string | null>(null);
  const t = translations[language].collections;

  const colors = ['#38BDF8', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E', '#FFFFFF'];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    onCreateCollection(newColName.trim(), selectedColor);
    setNewColName('');
  };

  const activeCollection = collections.find(c => c.id === selectedColId);
  const collectionGames = activeCollection 
    ? games.filter(g => activeCollection.gameIds.includes(g.id))
    : [];

  return (
    <div className="view-transition" style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
          {t.title}
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          {t.subtitle}
        </p>
      </header>

      {/* Create New Collection Form */}
      <form onSubmit={handleCreate} className="glass-section" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '28px' }}>
        <FolderPlus size={20} style={{ color: selectedColor, flexShrink: 0 }} />
        <input
          type="text"
          placeholder={t.namePlaceholder}
          value={newColName}
          onChange={e => setNewColName(e.target.value)}
          className="glass-input"
          style={{ flex: 1, height: '38px', fontSize: '13px' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {colors.map(c => (
            <div
              key={c}
              onClick={() => setSelectedColor(c)}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: c,
                cursor: 'pointer',
                border: selectedColor === c ? '2px solid #fff' : '2px solid transparent',
                transform: selectedColor === c ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 100ms ease'
              }}
            />
          ))}
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px', height: '38px' }}>
          <Plus size={15} />
          <span>{t.create}</span>
        </button>
      </form>

      {/* Collections Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {collections.map(col => {
          const isSelected = selectedColId === col.id;
          return (
            <div
              key={col.id}
              onClick={() => setSelectedColId(isSelected ? null : col.id)}
              className="glass-card"
              style={{
                padding: '18px',
                cursor: 'pointer',
                border: isSelected ? `1px solid ${col.color || 'var(--accent-primary)'}` : '1px solid var(--border-subtle)',
                background: isSelected ? 'var(--bg-glass-hover)' : 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: col.color || 'var(--accent-primary)',
                      boxShadow: `0 0 8px ${col.color || 'var(--accent-primary)'}`
                    }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{col.name}</span>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteCollection(col.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#F43F5E')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
                  title={t.delete}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{col.gameIds.length} {translations[language].titlebar.gamesCount}</span>
                {col.gameIds.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                    <span>{translations[language].overview.viewAll}</span>
                    <ArrowRight size={11} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Collection Games View */}
      {activeCollection && (
        <div className="glass-section view-transition" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeCollection.color || '#fff' }} />
            <span>{activeCollection.name}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({collectionGames.length})</span>
          </h2>

          {collectionGames.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {collectionGames.map(game => (
                <div
                  key={game.id}
                  onClick={() => onOpenGame(game)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  <Gamepad2 size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {game.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>
              {translations[language].library.emptyTitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
