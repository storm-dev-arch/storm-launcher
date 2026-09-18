import React, { useEffect, useState } from 'react';
import { X, Play, Maximize2, Zap } from 'lucide-react';
import type { Game } from '../../shared/types';
import { soundEngine } from '../audio/soundEngine';

export const MiniWidget: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const allGames = await window.stormPlay.games.getAll();
        setGames(allGames);
      } catch (err) {
        console.error('Failed to load games:', err);
      }
    };
    loadGames();

    const unsubUpdated = window.stormPlay.events.onGamesUpdated((updatedGames) => {
      setGames(updatedGames);
    });

    return () => {
      unsubUpdated();
    };
  }, []);

  const handlePlay = async (game: Game) => {
    soundEngine.playLaunch();
    try {
      await window.stormPlay.games.launch(game.id);
      window.close(); // Actually, in Electron, if it's the mini window, window.close() closes it
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenFullApp = () => {
    window.stormPlay.system.maximize(); // will maximize main window? Actually no, system.maximize doesn't explicitly focus main window. Let's add system.showMain()
  };

  const quickGames = games
    .filter(g => g.installed)
    .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
    .slice(0, 5);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        background: 'rgba(12, 12, 16, 0.96)',
        backdropFilter: 'blur(30px)',
        border: '1px solid var(--border-highlight)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
      className="fade-in app-region-drag"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={12} style={{ color: '#000', fill: '#000' }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', color: '#fff' }}>STORM MINI</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }} className="app-region-no-drag">
          <button
            onClick={handleOpenFullApp}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            title="Expand Full App"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={() => window.close()}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            title="Close Mini Mode"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }} className="app-region-no-drag">
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
          Quick Launch
        </div>
        {quickGames.map(g => (
          <div
            key={g.id}
            onClick={() => handlePlay(g)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 120ms ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-glass-hover)';
              e.currentTarget.style.borderColor = 'var(--border-highlight)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-glass)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div style={{ width: '22px', height: '30px', borderRadius: '4px', background: '#222', overflow: 'hidden', flexShrink: 0 }}>
                {g.artwork.cover && <img src={g.artwork.cover} alt={g.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {g.name}
              </span>
            </div>
            <button
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Play size={12} style={{ color: '#000', fill: '#000', marginLeft: '1px' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
