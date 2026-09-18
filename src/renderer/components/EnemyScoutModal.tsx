import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  X,
  Flame,
  ShieldAlert,
  Lock,
  Swords,
  Clipboard,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Award,
  AlertTriangle
} from 'lucide-react';
import type { PlayerDossier, LobbyRoster } from '../../shared/types';
import { translations, Language } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface EnemyScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const DEFAULT_SAMPLE = `
# 1 "Shadow_Slayer" [U:1:132749325]
# 2 "MidOrFeed" [U:1:86745912]
# 3 "Tinker_God" [U:1:115514818]
# 4 "Support_Main" [U:1:87278759]
# 5 "Pudge_Enjoyer" [U:1:1275334223]
# 6 "Night_Stalker" [U:1:70388657]
# 7 "SmurfHunter" [U:1:34509990]
# 8 "Viper_Pick" [U:1:105248644]
# 9 "HardCarry" [U:1:89871581]
# 10 "Pos5_Ward" [U:1:111620041]
`;

export const EnemyScoutModal: React.FC<EnemyScoutModalProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const isRu = language === 'ru';
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'enemies' | 'allies'>('enemies');
  const [lobby, setLobby] = useState<LobbyRoster | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !lobby) {
      // Auto-load sample or active lobby on open if empty
      loadRoster(DEFAULT_SAMPLE);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const loadRoster = async (text: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const roster = await window.stormPlay.inspector.parseLobby(text);
      if (roster.totalPlayers === 0) {
        setErrorMsg(isRu ? 'Игроки не найдены' : 'No players found');
      } else {
        setLobby(roster);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error parsing players');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    soundEngine.playClick();
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        await loadRoster(text);
      } else {
        setErrorMsg(isRu ? 'Буфер обмена пуст' : 'Clipboard is empty');
      }
    } catch {
      setErrorMsg(isRu ? 'Не удалось прочитать буфер обмена' : 'Failed to read clipboard');
    }
  };

  // Enemies are Dire (or Radiant depending on which side user is on, default to Dire as enemies)
  const enemies = lobby?.dire || [];
  const allies = lobby?.radiant || [];
  const currentList = activeTab === 'enemies' ? enemies : allies;

  // Find biggest threat in enemies
  const biggestThreat = enemies.find(p => p.smurfAnalysis.isSmurfSuspect || p.smurfAnalysis.threatLevel === 'high');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 5, 8, 0.82)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '20px'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="fade-in"
        style={{
          width: '100%',
          maxWidth: '860px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Crosshair size={20} color="#EF4444" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{isRu ? 'РАЗВЕДКА ПРОТИВНИКОВ' : 'ENEMY SCOUT'}</span>
                <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  DOTA 2
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {isRu ? 'Быстрая сводка для стадии банов и пиков' : 'Quick intel for draft & bans phase'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Tab switch: Enemies / Allies */}
            <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab('enemies');
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: activeTab === 'enemies' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  color: activeTab === 'enemies' ? '#EF4444' : 'var(--text-secondary)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isRu ? 'Враги' : 'Enemies'} ({enemies.length})
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab('allies');
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: activeTab === 'allies' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: activeTab === 'allies' ? '#10B981' : 'var(--text-secondary)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isRu ? 'Союзники' : 'Allies'} ({allies.length})
              </button>
            </div>

            {/* Paste Status Button */}
            <button
              onClick={handlePasteClipboard}
              disabled={loading}
              title={isRu ? 'Вставить вывод status из буфера' : 'Paste status from clipboard'}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'var(--bg-glass-hover)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Clipboard size={13} />
              <span>{isRu ? 'Вставить status' : 'Paste status'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Highlight Alert Banner if Smurf Found */}
        {activeTab === 'enemies' && biggestThreat && (
          <div
            style={{
              padding: '10px 20px',
              background: 'rgba(239, 68, 68, 0.12)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#FCA5A5' }}>
              <AlertTriangle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
              <span>
                <strong>{isRu ? 'ОПАСНОСТЬ' : 'HIGH THREAT'}:</strong> {biggestThreat.name} — {isRu ? 'Шанс смурфа' : 'Smurf chance'} {biggestThreat.smurfAnalysis.smurfChancePercent}%!
                {biggestThreat.topHeroes[0] && (
                  <span> {isRu ? '• Рекомендуется забанить' : '• Ban'}: <strong>{biggestThreat.topHeroes[0].heroName}</strong> ({biggestThreat.topHeroes[0].winrate}% WR)</span>
                )}
              </span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444', letterSpacing: '0.05em' }}>
              {isRu ? 'БАНЬТЕ СИГНАТУРКУ' : 'BAN SIGNATURE'}
            </span>
          </div>
        )}

        {/* Player Rows (Max 5 for instant 3-second readability) */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0', gap: '10px' }}>
              <RefreshCw size={24} className="spin" color="var(--accent-blue)" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {isRu ? 'Анализ профилей и винрейтов...' : 'Analyzing player winrates...'}
              </span>
            </div>
          ) : errorMsg ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#EF4444', fontSize: '13px' }}>
              {errorMsg}
            </div>
          ) : currentList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              {isRu ? 'Нет данных об игроках' : 'No player data'}
            </div>
          ) : (
            currentList.map(p => {
              const smurf = p.smurfAnalysis;
              const isSmurf = smurf.smurfChancePercent >= 50;
              const isMedium = smurf.smurfChancePercent >= 30 && smurf.smurfChancePercent < 50;
              const sigHero = p.topHeroes[0];

              return (
                <div
                  key={p.accountId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isSmurf ? 'rgba(239, 68, 68, 0.07)' : 'var(--bg-surface)',
                    border: `1px solid ${isSmurf ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-subtle)'}`,
                    gap: '14px',
                    transition: 'all 120ms ease'
                  }}
                >
                  {/* Left: Avatar + Name + Rank */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                    <img
                      src={p.avatar}
                      alt={p.name}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: p.rankTier ? '#38BDF8' : 'var(--text-muted)', fontWeight: 600, marginTop: '1px' }}>
                        {p.rankName || (isRu ? 'Без калибровки' : 'Uncalibrated')}
                        {p.rankStars ? ` ★${p.rankStars}` : ''}
                        {p.estimatedMmr ? ` (~${p.estimatedMmr})` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Smurf Chance Badge */}
                  <div style={{ minWidth: '130px' }}>
                    {p.isPrivate ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px' }}>
                        <Lock size={11} /> {isRu ? 'Закрыт' : 'Private'}
                      </span>
                    ) : isSmurf ? (
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', background: 'rgba(239, 68, 68, 0.18)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Flame size={12} /> {isRu ? 'СМУРФ' : 'SMURF'} {smurf.smurfChancePercent}%
                      </span>
                    ) : isMedium ? (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldAlert size={12} /> {isRu ? 'ОПАСЕН' : 'THREAT'} {smurf.smurfChancePercent}%
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '3px 8px', borderRadius: '6px' }}>
                        {isRu ? 'Обычный' : 'Normal'} ({smurf.smurfChancePercent}%)
                      </span>
                    )}
                  </div>

                  {/* Mode Winrates: Ranked & Turbo */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: '150px', fontSize: '11px' }}>
                    <div style={{ color: p.rankedWinrate && p.rankedWinrate >= 60 ? '#10B981' : 'var(--text-primary)', fontWeight: 600 }}>
                      {isRu ? 'Рейтинг' : 'Ranked'}: {p.rankedWinrate ? `${p.rankedWinrate}% (${p.rankedGames} игр)` : (p.overallWinrate > 0 ? `${p.overallWinrate}% (${p.totalGames})` : '-')}
                    </div>
                    <div style={{ color: p.turboWinrate && p.turboWinrate >= 60 ? '#38BDF8' : 'var(--text-muted)', marginTop: '1px' }}>
                      {isRu ? 'Турбо' : 'Turbo'}: {p.turboWinrate ? `${p.turboWinrate}% (${p.turboGames} игр)` : (isRu ? 'нет игр' : 'none')}
                    </div>
                  </div>

                  {/* Signature Hero to Ban */}
                  <div style={{ minWidth: '170px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {sigHero ? (
                      <>
                        <img
                          src={sigHero.heroIcon}
                          alt={sigHero.heroName}
                          style={{ width: '28px', height: '16px', borderRadius: '3px', objectFit: 'cover' }}
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div style={{ fontSize: '11px' }}>
                          <div style={{ fontWeight: 700, color: sigHero.winrate >= 60 ? '#EF4444' : 'var(--text-primary)' }}>
                            {sigHero.heroName}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {sigHero.games} игр • {sigHero.winrate}% WR
                          </div>
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {isRu ? 'Нет сигнатурки' : 'No signature'}
                      </span>
                    )}
                  </div>

                  {/* Active Streak */}
                  <div style={{ minWidth: '70px', textAlign: 'right', fontSize: '11px' }}>
                    {smurf.winStreak >= 3 ? (
                      <span style={{ color: '#EF4444', fontWeight: 800 }}>
                        🔥 {smurf.winStreak} W
                      </span>
                    ) : smurf.loseStreak >= 3 ? (
                      <span style={{ color: '#38BDF8', fontWeight: 600 }}>
                        ❄️ {smurf.loseStreak} L
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>
                        {smurf.recentWinrate > 0 ? `${smurf.recentWinrate}%` : '-'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}
        >
          <span>
            {isRu ? '💡 Совет: введите "status" в консоль Dota 2, скопируйте и нажмите «Вставить status»' : '💡 Tip: Type "status" into console, copy, and click "Paste status"'}
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'var(--bg-glass-hover)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isRu ? 'Закрыть' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
