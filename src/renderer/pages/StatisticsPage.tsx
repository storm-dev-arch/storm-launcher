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
    const fetchStats = () => {
      window.stormPlay.sessions.getStats().then(setStats);
    };
    fetchStats();
    const unsub = window.stormPlay.events.onGameStopped(() => {
      fetchStats();
    });
    return () => {
      unsub();
    };
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-section" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            {t.totalGames}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
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
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {stats.totalGames > 0 ? Math.round((stats.steamGames / stats.totalGames) * 100) : 0}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {stats.steamGames} / {stats.totalGames}
          </div>
        </div>
      </div>

      <div className="glass-section" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Flame size={18} style={{ color: '#F59E0B' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
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
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{game.name}</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {formatHours(game.playtimeMinutes || 0)}
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: idx === 0 ? 'var(--accent-primary)' : 'var(--border-highlight)',
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

      <div className="glass-section" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--text-primary)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {language === 'ru' ? 'Активность за 12 недель' : '12-Week Playtime Activity'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>{language === 'ru' ? 'Меньше' : 'Less'}</span>
            {[0, 20, 60, 120, 240].map((m, idx) => (
              <div
                key={idx}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  background: m === 0 ? 'rgba(255, 255, 255, 0.02)' : m <= 30 ? 'rgba(255, 255, 255, 0.08)' : m <= 90 ? 'rgba(255, 255, 255, 0.16)' : m <= 180 ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.52)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              />
            ))}
            <span>{language === 'ru' ? 'Больше' : 'More'}</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {(() => {
              const weeks: { dateStr: string; minutes: number }[][] = [];
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const currentDayOfWeek = today.getDay();
              const endOffset = 6 - currentDayOfWeek;
              const endDate = new Date(today);
              endDate.setDate(today.getDate() + endOffset);

              const startDate = new Date(endDate);
              startDate.setDate(endDate.getDate() - (12 * 7 - 1));

              const cursor = new Date(startDate);
              for (let w = 0; w < 12; w++) {
                const days = [];
                for (let d = 0; d < 7; d++) {
                  const dateStr = cursor.toISOString().split('T')[0];
                  const minutes = (stats.playtimeByDay && stats.playtimeByDay[dateStr]) || 0;
                  days.push({ dateStr, minutes });
                  cursor.setDate(cursor.getDate() + 1);
                }
                weeks.push(days);
              }

              const getLevelBg = (mins: number) => {
                if (mins <= 0) return 'rgba(255, 255, 255, 0.02)';
                if (mins <= 30) return 'rgba(255, 255, 255, 0.08)';
                if (mins <= 90) return 'rgba(255, 255, 255, 0.16)';
                if (mins <= 180) return 'rgba(255, 255, 255, 0.28)';
                return 'rgba(255, 255, 255, 0.52)';
              };

              return weeks.map((week, wIdx) => (
                <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {week.map(day => (
                    <div
                      key={day.dateStr}
                      title={`${day.dateStr}: ${day.minutes > 0 ? (day.minutes >= 60 ? `${(day.minutes / 60).toFixed(1)} ${translations[language].gameCard.hours}` : `${day.minutes} ${translations[language].gameCard.minutes}`) : (language === 'ru' ? 'Нет игровых сессий' : 'No play sessions')}`}
                      style={{
                        width: '13px',
                        height: '13px',
                        borderRadius: '3px',
                        background: getLevelBg(day.minutes),
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        boxShadow: day.minutes > 0 ? 'inset 0 1px 0 rgba(255, 255, 255, 0.2)' : 'none',
                        cursor: 'pointer',
                        transition: 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1), background-color 140ms ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.3)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1.0)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                      }}
                    />
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      <div className="glass-section" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
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
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.gameName}</div>
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
