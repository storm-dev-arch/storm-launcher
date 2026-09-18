import React, { useState, useEffect } from 'react';
import type { LiveGameStats, ActiveGameInfo, Game } from '../../shared/types';
import { translations, Language } from '../i18n/translations';

const DOTA2_ICON_URL = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/global/dota2_logo_symbol.png';

interface NowPlayingWidgetProps {
  activeGame: ActiveGameInfo | null;
  gsiStats: LiveGameStats | null;
  gameData?: Game | null;
  language: Language;
  onOpenDetails?: (game: Game) => void;
}

export const NowPlayingWidget: React.FC<NowPlayingWidgetProps> = ({
  activeGame,
  gsiStats,
  gameData,
  language,
  onOpenDetails
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isDota = activeGame?.name?.toLowerCase().includes('dota') || gsiStats?.game === 'dota2';
  const isCS = activeGame?.name?.toLowerCase().includes('cs') || activeGame?.name?.toLowerCase().includes('counter-strike') || gsiStats?.game === 'cs2';

  useEffect(() => {
    if (!activeGame?.startTime) return;
    const updateTimer = () => {
      const sec = Math.max(0, Math.floor((Date.now() - (activeGame.startTime || Date.now())) / 1000));
      setElapsedSeconds(sec);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeGame?.startTime]);

  if (!activeGame && !gsiStats) return null;

  const gameTitle = gsiStats?.title || activeGame?.name || 'Game';

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}h ${remM}m`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  let iconUrl: string | undefined = undefined;
  if (isDota) {
    iconUrl = gsiStats?.heroIcon || DOTA2_ICON_URL;
  } else if (isCS) {
    iconUrl = 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg';
  } else if (activeGame?.coverUrl) {
    iconUrl = activeGame.coverUrl;
  } else if (gameData?.artwork?.icon || gameData?.artwork?.cover) {
    iconUrl = gameData.artwork.icon || gameData.artwork.cover;
  }

  // Live status detail string
  let detailString = '';
  if (isDota) {
    const parts: string[] = [];
    if (gsiStats?.heroOrMap) parts.push(gsiStats.heroOrMap);
    if (gsiStats?.scoreOrKDA) parts.push(gsiStats.scoreOrKDA);
    if (gsiStats?.matchTime) parts.push(gsiStats.matchTime);
    detailString = parts.join(' • ');
  } else if (isCS) {
    const parts: string[] = [];
    if (gsiStats?.heroOrMap) parts.push(gsiStats.heroOrMap);
    if (gsiStats?.scoreOrKDA) parts.push(gsiStats.scoreOrKDA);
    detailString = parts.join(' • ');
  }

  if (!detailString) {
    detailString = gsiStats?.state || (language === 'ru' ? `В игре (${formatSeconds(elapsedSeconds)})` : `In game (${formatSeconds(elapsedSeconds)})`);
  }

  return (
    <div
      onClick={() => {
        if (gameData && onOpenDetails) onOpenDetails(gameData);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 10px',
        borderRadius: '10px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        cursor: gameData && onOpenDetails ? 'pointer' : 'default',
        transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
        overflow: 'hidden'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--bg-card-hover)';
        e.currentTarget.style.borderColor = 'var(--border-highlight)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--bg-card)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Game icon */}
      {iconUrl ? (
        <img
          src={iconUrl}
          alt=""
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            objectFit: 'cover',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            flexShrink: 0
          }}
        />
      ) : (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {gameTitle}
          </span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
              flexShrink: 0
            }}
            title={language === 'ru' ? 'В игре' : 'Now playing'}
          />
        </div>

        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '1px'
          }}
        >
          {detailString}
        </div>
      </div>
    </div>
  );
};
