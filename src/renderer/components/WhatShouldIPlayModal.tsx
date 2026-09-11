import React, { useState } from 'react';
import { X, Compass, Play, Sparkles, RefreshCw, Star, CheckCircle2 } from 'lucide-react';
import type { Game } from '../../shared/types';

interface WhatShouldIPlayModalProps {
  isOpen: boolean;
  games: Game[];
  onClose: () => void;
  onPlay: (game: Game) => void;
}

export const WhatShouldIPlayModal: React.FC<WhatShouldIPlayModalProps> = ({
  isOpen,
  games,
  onClose,
  onPlay
}) => {
  const [onlyInstalled, setOnlyInstalled] = useState(true);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  if (!isOpen) return null;

  const handlePickRandom = () => {
    let pool = games;
    if (onlyInstalled) pool = pool.filter(g => g.installed);
    if (onlyFavorites) pool = pool.filter(g => g.favorite);

    if (pool.length === 0) {
      setSelectedGame(null);
      return;
    }

    setIsSpinning(true);
    setTimeout(() => {
      const rand = pool[Math.floor(Math.random() * pool.length)];
      setSelectedGame(rand);
      setIsSpinning(false);
    }, 450);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
      onClick={onClose}
    >
      <div
        className="fade-in"
        style={{
          width: '460px',
          maxWidth: '92vw',
          background: 'rgba(14, 14, 18, 0.95)',
          backdropFilter: 'blur(28px)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '16px',
          padding: '28px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', marginBottom: '12px' }}>
          <Compass size={24} />
        </div>

        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#fff' }}>
          What Should I Play?
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Let Storm Launcher choose a title from your real library.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyInstalled}
              onChange={e => setOnlyInstalled(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span>Installed only</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={e => setOnlyFavorites(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span>Favorites only</span>
          </label>
        </div>

        <div style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          {isSpinning ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
              <RefreshCw size={32} className="spin" style={{ color: 'var(--accent-primary)' }} />
              <span>Rolling library...</span>
            </div>
          ) : selectedGame ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '110px', height: '150px', borderRadius: '10px', overflow: 'hidden', background: '#222', border: '1px solid var(--border-highlight)', marginBottom: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
                {selectedGame.artwork.cover && <img src={selectedGame.artwork.cover} alt={selectedGame.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                {selectedGame.name}
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                {selectedGame.playtimeMinutes > 0 ? `${(selectedGame.playtimeMinutes / 60).toFixed(1)}h on record` : 'Unplayed title'}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => { onPlay(selectedGame); onClose(); }}
                style={{ padding: '10px 24px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Play size={14} fill="#000" />
                Launch This Game
              </button>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Click below to pick a game!
            </div>
          )}
        </div>

        <button
          className="btn btn-secondary"
          onClick={handlePickRandom}
          style={{ width: '100%', fontSize: '13px', padding: '10px 0' }}
        >
          {selectedGame ? 'Pick Another Game' : 'Pick Random Game'}
        </button>
      </div>
    </div>
  );
};
