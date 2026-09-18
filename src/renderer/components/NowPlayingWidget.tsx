import React, { useState, useEffect } from 'react';
import { Gamepad2, Swords, Clock, Trophy, ExternalLink } from 'lucide-react';
import type { LiveGameStats, ActiveGameInfo, Game } from '../../shared/types';
import { translations, Language } from '../i18n/translations';

const DOTA2_ICON_URL = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/global/dota2_logo_symbol.png';

interface NowPlayingWidgetProps {
  activeGame: ActiveGameInfo | null;
  gsiStats: LiveGameStats | null;
  gameData?: Game | null;
  language: Language;
  variant?: 'sidebar' | 'banner' | 'badge';
  onOpenDetails?: (game: Game) => void;
}

export const NowPlayingWidget: React.FC<NowPlayingWidgetProps> = ({
  activeGame,
  gsiStats,
  gameData,
  language,
  variant = 'sidebar',
  onOpenDetails
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const t = translations[language].nowPlaying;

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
  } else if (gameData?.artwork?.cover || gameData?.artwork?.icon) {
    iconUrl = gameData.artwork.cover || gameData.artwork.icon;
  }

  if (variant === 'badge') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          borderRadius: '20px',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
          color: 'var(--text-primary)',
          fontSize: '11.5px',
          cursor: gameData && onOpenDetails ? 'pointer' : 'default',
          userSelect: 'none'
        }}
        onClick={() => {
          if (gameData && onOpenDetails) onOpenDetails(gameData);
        }}
        title={gsiStats?.details || activeGame?.name}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 10px #22c55e'
          }}
        />
        <span style={{ fontWeight: 700, color: '#4ade80' }}>
          {gameTitle}
        </span>
        {gsiStats?.heroOrMap && (
          <span style={{ color: 'var(--text-secondary)' }}>
            • {gsiStats.heroOrMap}
          </span>
        )}
        {gsiStats?.scoreOrKDA && (
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            • {gsiStats.scoreOrKDA}
          </span>
        )}
        {gsiStats?.matchTime && (
          <span style={{ color: '#93c5fd', fontWeight: 600 }}>
            • {gsiStats.matchTime}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div
        style={{
          margin: '0 4px 12px 4px',
          padding: '12px',
          borderRadius: '12px',
          background: 'linear-gradient(145deg, rgba(20, 20, 26, 0.85) 0%, rgba(12, 12, 16, 0.95) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 0 15px rgba(34, 197, 94, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #22c55e 0%, #38bdf8 100%)',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.8)'
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e'
              }}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: '#4ade80'
              }}
            >
              {t.title}
            </span>
          </div>

          {gsiStats?.paused && (
            <span
              style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(234, 179, 8, 0.2)',
                color: '#facc15',
                fontWeight: 600,
                border: '1px solid rgba(234, 179, 8, 0.3)'
              }}
            >
              {t.paused}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          {iconUrl ? (
            <img
              src={iconUrl}
              alt=""
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                objectFit: 'cover',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                flexShrink: 0
              }}
            />
          ) : (
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Gamepad2 size={18} style={{ color: '#4ade80' }} />
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {gameTitle}
            </div>

            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {gsiStats?.heroOrMap
                ? `${gsiStats.heroOrMap}${gsiStats.level ? ` (${gsiStats.level} ур.)` : ''}`
                : (gsiStats?.state || t.inGame)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {gsiStats?.scoreOrKDA && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 7px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              {isCS ? <Trophy size={11} style={{ color: '#f59e0b' }} /> : <Swords size={11} style={{ color: '#ef4444' }} />}
              <span>{gsiStats.scoreOrKDA}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 7px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontSize: '10.5px',
              fontWeight: 600,
              color: '#38bdf8'
            }}
          >
            <Clock size={11} />
            <span>{gsiStats?.matchTime || formatSeconds(elapsedSeconds)}</span>
          </div>

          {gsiStats?.mode && (
            <div
              style={{
                padding: '3px 6px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                fontSize: '10px',
                color: 'var(--text-muted)'
              }}
            >
              {gsiStats.mode}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        padding: '20px 24px',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, rgba(20, 24, 33, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
        border: '1px solid rgba(34, 197, 94, 0.4)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 25px rgba(34, 197, 94, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #22c55e 0%, #38bdf8 50%, #a855f7 100%)'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {iconUrl ? (
          <img
            src={iconUrl}
            alt=""
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              objectFit: 'cover',
              border: '2px solid rgba(34, 197, 94, 0.4)',
              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.2)'
            }}
          />
        ) : (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Gamepad2 size={32} style={{ color: '#4ade80' }} />
          </div>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                fontSize: '10.5px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: '#4ade80'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 6px #22c55e'
                }}
              />
              {t.title}
            </span>

            {gsiStats?.paused && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(234, 179, 8, 0.2)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#facc15'
                }}
              >
                {t.paused}
              </span>
            )}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {gameTitle}
          </h2>

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {gsiStats?.heroOrMap
              ? `${gsiStats.heroOrMap}${gsiStats.level ? ` • ${gsiStats.level} ур.` : ''}`
              : (gsiStats?.state || t.inGame)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {gsiStats?.scoreOrKDA && (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {isCS ? t.score : t.kda}
            </span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {gsiStats.scoreOrKDA}
            </span>
          </div>
        )}

        <div
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#7dd3fc', textTransform: 'uppercase' }}>
            {t.matchTime}
          </span>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
            {gsiStats?.matchTime || formatSeconds(elapsedSeconds)}
          </span>
        </div>

        {gameData && onOpenDetails && (
          <button
            onClick={() => onOpenDetails(gameData)}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 160ms ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-highlight)';
              e.currentTarget.style.background = 'var(--bg-card-hover)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = 'var(--bg-card)';
            }}
          >
            <span>{t.viewGame}</span>
            <ExternalLink size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
