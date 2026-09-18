import React, { useState, useEffect, useRef } from 'react';
import { Search, Gamepad2, Play, Settings, RefreshCw, LayoutGrid, Star, Compass, X } from 'lucide-react';
import type { Game } from '../../shared/types';
import type { PageId } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  games: Game[];
  onClose: () => void;
  onNavigate: (page: PageId) => void;
  onPlay: (game: Game) => void;
  onOpenWhatShouldIPlay: () => void;
  onScanSteam: () => void;
  onAddCustomGame: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  games,
  onClose,
  onNavigate,
  onPlay,
  onOpenWhatShouldIPlay,
  onScanSteam,
  onAddCustomGame
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanQ = query.toLowerCase().trim();

  const commands = [
    { id: 'cmd_play_random', title: 'What should I play? (Randomizer)', icon: Compass, action: onOpenWhatShouldIPlay },
    { id: 'cmd_scan', title: 'Scan Steam Libraries for games', icon: RefreshCw, action: onScanSteam },
    { id: 'cmd_add', title: 'Add Custom Executable Game', icon: Gamepad2, action: onAddCustomGame },
    { id: 'cmd_lib', title: 'Go to Library', icon: LayoutGrid, action: () => onNavigate('library') },
    { id: 'cmd_fav', title: 'Go to Favorites', icon: Star, action: () => onNavigate('favorites') },
    { id: 'cmd_settings', title: 'Open Settings & Themes', icon: Settings, action: () => onNavigate('settings') }
  ].filter(c => c.title.toLowerCase().includes(cleanQ));

  const filteredGames = games
    .filter(g => g.name.toLowerCase().includes(cleanQ))
    .slice(0, 8);

  const totalItems = commands.length + filteredGames.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < commands.length) {
        commands[selectedIndex].action();
        onClose();
      } else {
        const gIdx = selectedIndex - commands.length;
        if (filteredGames[gIdx]) {
          onPlay(filteredGames[gIdx]);
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '120px',
        zIndex: 2000
      }}
      onClick={onClose}
    >
      <div
        className="fade-in"
        style={{
          width: '580px',
          maxWidth: '92vw',
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-glass)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a game name or command..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '15px',
              outline: 'none'
            }}
          />
          <kbd style={{ background: 'var(--border-subtle)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
          {commands.length > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 10px', letterSpacing: '0.05em' }}>
                Commands & Shortcuts
              </div>
              {commands.map((cmd, i) => {
                const Icon = cmd.icon;
                const isSel = selectedIndex === i;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => { cmd.action(); onClose(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'var(--bg-glass-hover)' : 'transparent',
                      border: isSel ? '1px solid var(--border-highlight)' : '1px solid transparent',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                  >
                    <Icon size={15} style={{ color: isSel ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                    <span>{cmd.title}</span>
                  </div>
                );
              })}
            </div>
          )}

          {filteredGames.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 10px', letterSpacing: '0.05em' }}>
                Games ({filteredGames.length})
              </div>
              {filteredGames.map((g, idx) => {
                const overallIdx = commands.length + idx;
                const isSel = selectedIndex === overallIdx;
                return (
                  <div
                    key={g.id}
                    onClick={() => { onPlay(g); onClose(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'var(--bg-glass-hover)' : 'transparent',
                      border: isSel ? '1px solid var(--border-highlight)' : '1px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '36px', borderRadius: '4px', background: '#181820', overflow: 'hidden', flexShrink: 0 }}>
                        {g.artwork.cover ? (
                          <img src={g.artwork.cover} alt={g.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#888' }}>
                            {g.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {g.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {g.playtimeMinutes > 0 ? `${Math.round(g.playtimeMinutes / 60)}h played` : 'Unplayed'} • {g.installed ? 'Installed' : 'Cloud'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <Play size={12} />
                      <span>Press Enter</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No matching games or commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
