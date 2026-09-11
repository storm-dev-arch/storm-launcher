import React, { useState, useEffect, useMemo } from 'react';
import { Search, LayoutGrid, Grid2X2, List, Filter, ArrowUpDown, Plus, RefreshCw, FolderSearch, Zap, Globe } from 'lucide-react';
import type { Game } from '../../shared/types';
import { GameCard } from '../components/GameCard';
import { translations, Language } from '../i18n/translations';

interface LibraryPageProps {
  games: Game[];
  initialFilter?: string;
  onPlay: (game: Game) => void;
  onOpenDetails: (game: Game) => void;
  onToggleFavorite: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, game: Game) => void;
  onAddCustomGame: () => void;
  onScanSteam: () => void;
  onSyncAll?: () => void;
  onScanFolder: () => void;
  language: Language;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  games,
  initialFilter = 'all',
  onPlay,
  onOpenDetails,
  onToggleFavorite,
  onContextMenu,
  onAddCustomGame,
  onScanSteam,
  onSyncAll,
  onScanFolder,
  language
}) => {
  const t = translations[language].library;
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'list'>('grid');
  const [filterSource, setFilterSource] = useState<string>(initialFilter);
  const [sortBy, setSortBy] = useState<'name' | 'playtime' | 'recent' | 'added'>('name');

  useEffect(() => {
    if (initialFilter) {
      setFilterSource(initialFilter);
      if (initialFilter === 'recent') {
        setSortBy('recent');
      }
    }
  }, [initialFilter]);

  const filteredGames = useMemo(() => {
    let list = [...games];

    if (filterSource === 'installed') {
      list = list.filter(g => g.installed);
    } else if (filterSource === 'steam') {
      list = list.filter(g => g.source === 'steam');
    } else if (filterSource === 'epic') {
      list = list.filter(g => g.source === 'epic');
    } else if (filterSource === 'gog') {
      list = list.filter(g => g.source === 'gog');
    } else if (filterSource === 'custom') {
      list = list.filter(g => g.custom || g.source === 'custom');
    } else if (filterSource === 'favorites') {
      list = list.filter(g => g.favorite);
    } else if (filterSource === 'recent') {
      list = list.filter(g => (g.lastPlayed || 0) > 0);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(g => g.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'playtime') return (b.playtimeMinutes || 0) - (a.playtimeMinutes || 0);
      if (sortBy === 'recent') return (b.lastPlayed || 0) - (a.lastPlayed || 0);
      if (sortBy === 'added') return b.dateAdded - a.dateAdded;
      return 0;
    });

    return list;
  }, [games, filterSource, search, sortBy]);

  const filterTabs = [
    { id: 'all', label: t.all, count: games.length },
    { id: 'installed', label: t.installed, count: games.filter(g => g.installed).length },
    { id: 'favorites', label: t.favorites, count: games.filter(g => g.favorite).length },
    { id: 'recent', label: t.recent, count: games.filter(g => (g.lastPlayed || 0) > 0).length },
    { id: 'steam', label: t.steam, count: games.filter(g => g.source === 'steam').length },
    { id: 'epic', label: (t as any).epic || 'Epic Games', count: games.filter(g => g.source === 'epic').length },
    { id: 'gog', label: (t as any).gog || 'GOG Galaxy', count: games.filter(g => g.source === 'gog').length },
    { id: 'custom', label: t.custom, count: games.filter(g => g.custom || g.source === 'custom').length }
  ];

  return (
    <div className="view-transition" style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255,255,255,0.03)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {filterTabs.map(tab => {
            const isSel = filterSource === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterSource(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  background: isSel ? 'var(--bg-card-hover)' : 'transparent',
                  border: isSel ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  color: isSel ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: isSel ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background 120ms ease, color 120ms ease'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    color: isSel ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontWeight: 600
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t.searchGame}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input"
              style={{
                paddingLeft: '32px',
                fontSize: '12px',
                width: '190px',
                height: '34px'
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0 8px',
              height: '34px'
            }}
          >
            <ArrowUpDown size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="name" style={{ background: '#121216' }}>{t.sortName}</option>
              <option value="playtime" style={{ background: '#121216' }}>{t.sortPlaytime}</option>
              <option value="recent" style={{ background: '#121216' }}>{t.sortRecent}</option>
              <option value="added" style={{ background: '#121216' }}>{t.sortAdded}</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '2px',
              height: '34px'
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'rgba(255,255,255,0.1)' : 'none',
                border: 'none',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
                padding: '5px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={t.viewGrid}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              style={{
                background: viewMode === 'compact' ? 'rgba(255,255,255,0.1)' : 'none',
                border: 'none',
                color: viewMode === 'compact' ? '#fff' : 'var(--text-muted)',
                padding: '5px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={t.viewCompact}
            >
              <Grid2X2 size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'none',
                border: 'none',
                color: viewMode === 'list' ? '#fff' : 'var(--text-muted)',
                padding: '5px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={t.viewList}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {filteredGames.length > 0 ? (
        viewMode === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredGames.map(game => (
              <div
                key={game.id}
                onClick={() => onOpenDetails(game)}
                onContextMenu={e => onContextMenu(e, game)}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '24px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      background: '#0a0a0c',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={game.artwork.hero || game.artwork.cover || ''}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{game.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {game.source} • {game.installed ? (translations[language].gameCard.installed) : (language === 'ru' ? 'Не установлена' : 'Not installed')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {game.playtimeMinutes > 0 ? `${(game.playtimeMinutes / 60).toFixed(1)} ${translations[language].gameCard.hours}` : translations[language].gameCard.never}
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onPlay(game);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '20px' }}
                  >
                    {game.installed ? translations[language].gameCard.play : (language === 'ru' ? 'Установить' : 'Install')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'compact'
                ? 'repeat(auto-fill, minmax(170px, 200px))'
                : 'repeat(auto-fill, minmax(180px, 220px))',
              gap: '20px',
              justifyContent: 'start'
            }}
          >
            {filteredGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                compact={viewMode === 'compact'}
                onPlay={onPlay}
                onOpenDetails={onOpenDetails}
                onToggleFavorite={onToggleFavorite}
                onContextMenu={onContextMenu}
                language={language}
              />
            ))}
          </div>
        )
      ) : (
        <div
          className="glass-section"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            borderRadius: '16px',
            marginTop: '20px'
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: 'var(--accent-primary)'
            }}
          >
            <Filter size={24} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#fff' }}>
            {filterSource === 'installed'
              ? t.emptyInstalled
              : filterSource === 'favorites'
              ? t.emptyFavorites
              : filterSource === 'recent'
              ? t.emptyRecent
              : filterSource === 'epic'
              ? (t.emptyEpic || (language === 'ru' ? 'В Epic Games Store пока нет синхронизированных игр' : 'No Epic Games Store titles discovered yet'))
              : filterSource === 'gog'
              ? (t.emptyGog || (language === 'ru' ? 'В GOG Galaxy пока нет синхронизированных игр' : 'No GOG Galaxy titles discovered yet'))
              : t.emptyTitle}
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {t.emptySearch}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (onSyncAll) onSyncAll();
                else onScanSteam();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {filterSource === 'epic' ? (
                <Zap size={14} style={{ color: '#10B981' }} />
              ) : filterSource === 'gog' ? (
                <Globe size={14} style={{ color: '#A855F7' }} />
              ) : (
                <RefreshCw size={14} />
              )}
              <span>
                {filterSource === 'epic'
                  ? (t.rescanEpic || (language === 'ru' ? 'Синхронизировать Epic Games' : 'Sync Epic Games'))
                  : filterSource === 'gog'
                  ? (t.rescanGOG || (language === 'ru' ? 'Синхронизировать GOG Galaxy' : 'Sync GOG Galaxy'))
                  : filterSource === 'steam'
                  ? t.rescanSteam
                  : (t.rescanAll || (language === 'ru' ? 'Синхронизировать библиотеки' : 'Sync All Libraries'))}
              </span>
            </button>
            <button className="btn btn-secondary" onClick={onScanFolder}>
              <FolderSearch size={14} />
              <span>{t.scanFolder}</span>
            </button>
            <button className="btn btn-secondary" onClick={onAddCustomGame}>
              <Plus size={14} />
              <span>{translations[language].nav.addGame}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
