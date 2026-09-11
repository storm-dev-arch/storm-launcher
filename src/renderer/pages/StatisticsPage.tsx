import React, { useState, useEffect } from 'react';
import { BarChart2, Clock, Gamepad2, Award, Flame, Calendar, HardDrive } from 'lucide-react';
import type { LauncherStats } from '../../shared/types';
import { translations, Language } from '../i18n/translations';

interface StatisticsPageProps {
  language: Language;
}

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ language }) => {
  const [stats, setStats] = useState<LauncherStats | null>(null);
  const t = translations[language].stats;

  useEffect(() => {
    window.stormPlay.sessions.getStats().then(setStats);
  }, []);

  if (!stats) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading statistics...</div>;
  }

  const formatHours = (mins: number) => {
    if (!mins) return `0 ${translations[language].gameCard.hours}`;
    return `${(mins / 60).toFixed(1)} ${translations[language].gameCard.hours}`;
  };

  const maxPlaytime = stats.mostPlayed.length > 0 ? (stats.mostPlayed[0].playtimeMinutes || 1) : 1;

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

      {/* Hero Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-section" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            {t.totalGames}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>
            {stats.totalGames}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {stats.steamGames} Steam • {stats.customGames} Non-Steam
          </div>
        </div>

        <div className="glass-section" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            {t.installedCount}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10B981' }}>
            {stats.installedGames}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {translations[language].gameCard.readyToPlay}
          </div>
        </div>

        <div className="glass-section" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            {t.totalPlaytime}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#38BDF8' }}>
            {formatHours(stats.totalPlaytimeMinutes)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {Math.round(stats.totalPlaytimeMinutes)} {translations[language].gameCard.minutes}
          </div>
        </div>

        <div className="glass-section" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            {t.steamRatio}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>
            {stats.totalGames > 0 ? Math.round((stats.steamGames / stats.totalGames) * 100) : 0}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {stats.steamGames} / {stats.totalGames}
          </div>
        </div>
      </div>

      {/* Top Played Games Breakdown */}
      <div className="glass-section" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Flame size={18} style={{ color: '#F59E0B' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>
            {t.topPlayed}
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {stats.mostPlayed.slice(0, 7).map((game, idx) => {
            const pct = Math.min(100, Math.round(((game.playtimeMinutes || 0) / maxPlaytime) * 100));
            return (
              <div key={game.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: idx < 3 ? 'var(--accent-primary)' : 'var(--text-muted)', width: '20px' }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{game.name}</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {formatHours(game.playtimeMinutes || 0)}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: idx === 0 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.3)',
                      borderRadius: '3px',
                      transition: 'width 300ms ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions Activity */}
      <div className="glass-section" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>
            {t.recentSessions}
          </h2>
        </div>

        {stats.recentSessions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.recentSessions.slice(0, 10).map(s => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{s.gameName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(s.startTime).toLocaleString()}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {s.durationMinutes} {translations[language].gameCard.minutes}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            {t.noSessions}
          </div>
        )}
      </div>
    </div>
  );
};
