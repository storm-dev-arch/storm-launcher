import React, { useState, useEffect, useMemo } from 'react';
import { Search, LayoutGrid, Grid2X2, List, Filter, ArrowUpDown, Plus, RefreshCw, FolderSearch, Zap, Globe } from 'lucide-react';
import type { Game } from '../../shared/types';
import { GameCard } from '../components/GameCard';
import { translations, Language } from '../i18n/translations';
import { Grid, List as WindowList, RowComponentProps, CellComponentProps } from 'react-window';

interface VirtualizedGamesProps {
  games: Game[];
  viewMode: 'grid' | 'compact' | 'list';
  language: Language;
  focusedIndex?: number;
  gridRef?: React.RefObject<any>;
  onOpenDetails: (game: Game) => void;
  onContextMenu: (e: React.MouseEvent, game: Game) => void;
  onPlay: (game: Game) => void;
  onToggleFavorite: (id: string) => void;
}

interface ListRowCustomProps {
  games: Game[];
  focusedIndex: number;
  language: Language;
  onPlay: (game: Game) => void;
  onOpenDetails: (game: Game) => void;
  onContextMenu: (e: React.MouseEvent, game: Game) => void;
}

const ListRow = ({
  index,
  style,
  games,
  focusedIndex,
  language,
  onPlay,
  onOpenDetails,
  onContextMenu
}: RowComponentProps<ListRowCustomProps>): React.ReactElement | null => {
  const game = games[index];
  if (!game) return null;
  return (
    <div style={{ ...style, paddingBottom: '6px', paddingRight: '10px' }}>
      <div
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
          border: '1px solid var(--border-subtle)',
          height: '100%',
          boxSizing: 'border-box',
          transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 160ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '24px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-surface)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            {(game.artwork.hero || game.artwork.cover) ? (
              <img
                src={game.artwork.hero || game.artwork.cover || ''}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><path d="M15 13h.01"/><path d="M18 11h.01"/></svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{game.name}</div>
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
    </div>
  );
};

interface GridCellCustomProps {
  games: Game[];
  columnCount: number;
  viewMode: 'grid' | 'compact' | 'list';
  focusedIndex: number;
  language: Language;
  onPlay: (game: Game) => void;
  onOpenDetails: (game: Game) => void;
  onToggleFavorite: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, game: Game) => void;
}

const GridCell = ({
  columnIndex,
  rowIndex,
  style,
  games,
  columnCount,
  viewMode,
  focusedIndex,
  language,
  onPlay,
  onOpenDetails,
  onToggleFavorite,
  onContextMenu
}: CellComponentProps<GridCellCustomProps>): React.ReactElement | null => {
  const index = rowIndex * columnCount + columnIndex;
  const game = games[index];
  if (!game) return null;
  const isFocused = index === focusedIndex;
  return (
    <div style={{ ...style, padding: '10px 8px', boxSizing: 'border-box', overflow: 'visible' }}>
      <GameCard
        game={game}
        compact={viewMode === 'compact'}
        onPlay={onPlay}
        onOpenDetails={onOpenDetails}
        onToggleFavorite={onToggleFavorite}
        onContextMenu={onContextMenu}
        language={language}
        isFocused={isFocused}
      />
    </div>
  );
};

const VirtualizedGames: React.FC<VirtualizedGamesProps> = ({
  games, viewMode, language, focusedIndex = -1, gridRef, onOpenDetails, onContextMenu, onPlay, onToggleFavorite
}) => {
  const [size, setSize] = useState({ width: 800, height: 600 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columnCount = size.width < 600 ? 3 : (size.width < 740 ? 4 : 5);
  const columnWidth = Math.floor(size.width / columnCount);
  const rowCount = Math.ceil(games.length / columnCount);
  const cardInnerWidth = Math.max(120, columnWidth - 16);
  const itemHeight = viewMode === 'compact'
    ? Math.round((cardInnerWidth * 9) / 16) + 88
    : Math.round(cardInnerWidth * 1.5) + 88;

  const listRowProps = useMemo(() => ({
    games,
    focusedIndex,
    language,
    onPlay,
    onOpenDetails,
    onContextMenu
  }), [games, focusedIndex, language, onPlay, onOpenDetails, onContextMenu]);

  const gridCellProps = useMemo(() => ({
    games,
    columnCount,
    viewMode,
    focusedIndex,
    language,
    onPlay,
    onOpenDetails,
    onToggleFavorite,
    onContextMenu
  }), [games, columnCount, viewMode, focusedIndex, language, onPlay, onOpenDetails, onToggleFavorite, onContextMenu]);

  if (viewMode === 'list') {
    return (
      <div ref={containerRef} style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
        <WindowList
          listRef={gridRef}
          style={{ width: size.width, height: size.height }}
          rowCount={games.length}
          rowHeight={56}
          rowComponent={ListRow}
          rowProps={listRowProps}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: 'calc(100vh - 200px)', overflow: 'visible' }}>
      <Grid
        gridRef={gridRef}
        style={{ width: size.width, height: size.height, overflowX: 'hidden' }}
        columnCount={columnCount}
        columnWidth={columnWidth}
        rowCount={rowCount}
        rowHeight={itemHeight}
        cellComponent={GridCell}
        cellProps={gridCellProps}
      />
    </div>
  );
};

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
  const [sortBy, setSortBy] = useState<'name' | 'name-desc' | 'playtime' | 'recent' | 'added' | 'platform'>('name');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const gridRef = React.useRef<any>(null);

  useEffect(() => {
    window.stormPlay.settings.get().then(s => {
      if (s.defaultView) setViewMode(s.defaultView);
      if (s.sortBy && initialFilter !== 'recent') setSortBy(s.sortBy as any);
      if ((s as any).defaultFilter && !initialFilter) setFilterSource((s as any).defaultFilter);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialFilter) {
      setFilterSource(initialFilter);
      if (initialFilter === 'recent') {
        setSortBy('recent');
      }
    }
  }, [initialFilter]);

  const handleFilterChange = (id: string) => {
    setFilterSource(id);
    setFocusedIndex(0);
    window.stormPlay.settings.update({ defaultFilter: id } as any).catch(() => {});
  };

  const handleSortChange = (newSort: any) => {
    setSortBy(newSort);
    setFocusedIndex(0);
    window.stormPlay.settings.update({ sortBy: newSort }).catch(() => {});
  };

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
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'playtime') return (b.playtimeMinutes || 0) - (a.playtimeMinutes || 0);
      if (sortBy === 'recent') return (b.lastPlayed || 0) - (a.lastPlayed || 0);
      if (sortBy === 'added') return b.dateAdded - a.dateAdded;
      if (sortBy === 'platform') return a.source.localeCompare(b.source);
      return 0;
    });

    return list;
  }, [games, filterSource, search, sortBy]);

  // F6: Keyboard Navigation in Library Grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if (filteredGames.length === 0) return;

      const columnCount = 5; // Default grid column count
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex(i => Math.min(filteredGames.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(i => Math.min(filteredGames.length - 1, i + columnCount));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(i => Math.max(0, i - columnCount));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredGames[focusedIndex]) {
          onOpenDetails(filteredGames[focusedIndex]);
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (filteredGames[focusedIndex]) {
          onPlay(filteredGames[focusedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredGames, focusedIndex, onOpenDetails, onPlay]);

  // Keep focused card in view via scrollToRow / scrollToCell
  useEffect(() => {
    if (gridRef.current && filteredGames.length > 0 && focusedIndex >= 0) {
      if (viewMode === 'list') {
        if (typeof gridRef.current.scrollToRow === 'function') {
          gridRef.current.scrollToRow({ index: focusedIndex, align: 'smart' });
        } else if (typeof gridRef.current.scrollToItem === 'function') {
          gridRef.current.scrollToItem(focusedIndex, 'smart');
        }
      } else {
        const rowIndex = Math.floor(focusedIndex / 5);
        const columnIndex = focusedIndex % 5;
        if (typeof gridRef.current.scrollToCell === 'function') {
          gridRef.current.scrollToCell({ rowIndex, columnIndex, rowAlign: 'smart', columnAlign: 'smart' });
        } else if (typeof gridRef.current.scrollToRow === 'function') {
          gridRef.current.scrollToRow({ index: rowIndex, align: 'smart' });
        } else if (typeof gridRef.current.scrollToItem === 'function') {
          gridRef.current.scrollToItem({ rowIndex, columnIndex, align: 'smart' });
        }
      }
    }
  }, [focusedIndex, viewMode, filteredGames.length]);

  const filterTabs = [
    { id: 'all', label: t.all, count: games.length },
    { id: 'favorites', label: t.favorites, count: games.filter(g => g.favorite).length },
    { id: 'recent', label: t.recent, count: games.filter(g => (g.lastPlayed || 0) > 0).length },
    { id: 'steam', label: t.steam, count: games.filter(g => g.source === 'steam').length },
    { id: 'epic', label: (t as any).epic || 'Epic Games', count: games.filter(g => g.source === 'epic').length },
    { id: 'gog', label: (t as any).gog || 'GOG Galaxy', count: games.filter(g => g.source === 'gog').length },
    { id: 'custom', label: t.custom, count: games.filter(g => g.custom || g.source === 'custom').length }
  ];

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
          flexWrap: 'wrap'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          {filterTabs.map(tab => {
            const isSel = filterSource === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`glass-chip ${isSel ? 'is-selected' : ''}`}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    background: isSel ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSel ? '#FFFFFF' : 'var(--text-muted)',
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
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder={t.searchGame}
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setFocusedIndex(0);
              }}
              className="glass-input"
              style={{
                paddingLeft: '34px',
                fontSize: '12px',
                width: '190px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'none'
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '0 10px',
              height: '36px'
            }}
          >
            <ArrowUpDown size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              value={sortBy}
              onChange={e => handleSortChange(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="name" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Name A–Z</option>
              <option value="name-desc" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Name Z–A</option>
              <option value="playtime" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Most Played</option>
              <option value="recent" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Last Played</option>
              <option value="added" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Recently Added</option>
              <option value="platform" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Platform</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '3px',
              height: '36px',
              boxSizing: 'border-box'
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--border-subtle)' : 'none',
                border: viewMode === 'grid' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                boxShadow: viewMode === 'grid' ? 'var(--shadow-card)' : 'none',
                color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '5px 8px',
                borderRadius: '7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 140ms ease'
              }}
              title={t.viewGrid}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              style={{
                background: viewMode === 'compact' ? 'var(--border-subtle)' : 'none',
                border: viewMode === 'compact' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                boxShadow: viewMode === 'compact' ? 'var(--shadow-card)' : 'none',
                color: viewMode === 'compact' ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '5px 8px',
                borderRadius: '7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 140ms ease'
              }}
              title={t.viewCompact}
            >
              <Grid2X2 size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'var(--border-subtle)' : 'none',
                border: viewMode === 'list' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                boxShadow: viewMode === 'list' ? 'var(--shadow-card)' : 'none',
                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '5px 8px',
                borderRadius: '7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 140ms ease'
              }}
              title={t.viewList}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {filteredGames.length > 0 ? (
        <VirtualizedGames
          games={filteredGames}
          viewMode={viewMode}
          language={language}
          focusedIndex={focusedIndex}
          gridRef={gridRef}
          onOpenDetails={onOpenDetails}
          onContextMenu={onContextMenu}
          onPlay={onPlay}
          onToggleFavorite={onToggleFavorite}
        />
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
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                <Zap size={14} />
              ) : filterSource === 'gog' ? (
                <Globe size={14} />
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
