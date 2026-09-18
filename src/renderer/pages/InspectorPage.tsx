import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  Search,
  User,
  ShieldAlert,
  Flame,
  Lock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Award,
  TrendingUp,
  TrendingDown,
  X,
  Swords,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type {
  PlayerDossier,
  LobbyRoster,
  PlayerHeroStats,
  PlayerRecentMatch
} from '../../shared/types';
import { translations, Language } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface InspectorPageProps {
  language: Language;
}

const SAMPLE_STATUS_TEXT = `
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

export const InspectorPage: React.FC<InspectorPageProps> = ({ language }) => {
  const t = translations[language].inspector;
  const isRu = language === 'ru';

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [dossier, setDossier] = useState<PlayerDossier | null>(null);
  const [lobby, setLobby] = useState<LobbyRoster | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDossier | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if active Steam account has data on mount
  useEffect(() => {
    // Optionally load user profile if search is empty
  }, []);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const raw = (textToAnalyze !== undefined ? textToAnalyze : inputQuery).trim();
    if (!raw) return;

    soundEngine.playClick();
    setLoading(true);
    setErrorMsg(null);
    setDossier(null);
    setLobby(null);

    try {
      // Check if raw input has multiple players (e.g. status console text)
      const ids = raw.split(/[\r\n]+/).filter(line => line.trim().length > 0);
      const isMulti = ids.length > 1 || raw.includes('#') || raw.includes('STEAM_') || raw.includes('[U:1:');

      if (isMulti) {
        const roster = await window.stormPlay.inspector.parseLobby(raw);
        if (roster.totalPlayers === 0) {
          setErrorMsg(t.noPlayersFound);
        } else if (roster.totalPlayers === 1) {
          const single = roster.radiant[0] || roster.dire[0] || roster.unassigned[0];
          setDossier(single);
        } else {
          setLobby(roster);
        }
      } else {
        const singleDossier = await window.stormPlay.inspector.getDossier(raw);
        if (!singleDossier || (singleDossier.accountId === 0 && singleDossier.isPrivate)) {
          setErrorMsg(t.noPlayersFound);
        } else {
          setDossier(singleDossier);
        }
      }
    } catch (err: any) {
      console.error('Inspector analyze error:', err);
      setErrorMsg(err.message || 'Ошибка анализа данных');
    } finally {
      setLoading(false);
    }
  };

  const handleMyProfile = async () => {
    soundEngine.playClick();
    setLoading(true);
    setErrorMsg(null);
    try {
      const myDossier = await window.stormPlay.inspector.getMyProfile();
      if (myDossier) {
        setInputQuery(String(myDossier.accountId));
        setLobby(null);
        setDossier(myDossier);
      } else {
        setErrorMsg(isRu ? 'Не удалось определить активный профиль Steam' : 'Failed to detect active Steam user');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    soundEngine.playClick();
    setInputQuery(SAMPLE_STATUS_TEXT.trim());
    handleAnalyze(SAMPLE_STATUS_TEXT.trim());
  };

  const handleClear = () => {
    soundEngine.playClick();
    setInputQuery('');
    setDossier(null);
    setLobby(null);
    setSelectedPlayer(null);
    setErrorMsg(null);
  };

  const handleCopy = (id: number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderRankBadge = (p: PlayerDossier) => {
    if (!p.rankTier) {
      return (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {t.uncalibrated}
        </span>
      );
    }

    const tier = Math.floor(p.rankTier / 10);
    const stars = p.rankTier % 10;
    const isImmortal = tier === 8;

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: isImmortal ? '#F59E0B' : tier >= 6 ? '#A855F7' : tier >= 4 ? '#38BDF8' : '#10B981',
            background: isImmortal ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-glass-hover)',
            padding: '2px 8px',
            borderRadius: '6px',
            border: `1px solid ${isImmortal ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`
          }}
        >
          {p.rankName} {stars > 0 && !isImmortal ? `★ ${stars}` : ''}
          {isImmortal && p.leaderboardRank ? ` #${p.leaderboardRank}` : ''}
        </span>
        {p.estimatedMmr && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ~{p.estimatedMmr.toLocaleString()} MMR
          </span>
        )}
      </div>
    );
  };

  const renderPlayerCard = (p: PlayerDossier, teamColor: string) => {
    const smurf = p.smurfAnalysis;
    const isHighThreat = smurf.threatLevel === 'high' || smurf.isSmurfSuspect;
    const isMedThreat = smurf.threatLevel === 'medium';

    return (
      <div
        key={p.accountId}
        onClick={() => setSelectedPlayer(p)}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: `1px solid ${isHighThreat ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          cursor: 'pointer',
          transition: 'all 160ms ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = isHighThreat ? '#EF4444' : teamColor;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = isHighThreat ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <img
              src={p.avatar}
              alt={p.name}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid var(--border-subtle)',
                flexShrink: 0
              }}
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={p.name}
              >
                {p.name}
              </div>
              <div style={{ marginTop: '2px' }}>
                {renderRankBadge(p)}
              </div>
            </div>
          </div>

          {/* Threat / Private Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
            {p.isPrivate ? (
              <span
                style={{
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-muted)'
                }}
              >
                <Lock size={11} /> {t.privateProfile}
              </span>
            ) : isHighThreat ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.16)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <Flame size={12} /> {isRu ? `СМУРФ ${smurf.smurfChancePercent}%` : `SMURF ${smurf.smurfChancePercent}%`}
              </span>
            ) : isMedThreat ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#F59E0B',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                <ShieldAlert size={12} /> {isRu ? `ОПАСНОСТЬ ${smurf.smurfChancePercent}%` : `THREAT ${smurf.smurfChancePercent}%`}
              </span>
            ) : (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  padding: '3px 8px'
                }}
              >
                {p.totalGames > 0 ? `${p.overallWinrate}% WR` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Smurf Reasons Alert Pill if suspect */}
        {!p.isPrivate && (smurf.summaryHeadline || smurf.reasons.length > 0) && (
          <div
            style={{
              fontSize: '11px',
              padding: '6px 10px',
              borderRadius: '6px',
              background: isHighThreat ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              color: isHighThreat ? '#FCA5A5' : '#FCD34D',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldAlert size={12} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {smurf.summaryHeadline || smurf.reasons[0]}
            </span>
          </div>
        )}

        {/* Signature Heroes (Top 3) */}
        {p.topHeroes && p.topHeroes.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            {p.topHeroes.slice(0, 3).map(h => (
              <div
                key={h.heroId}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-glass)',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  minWidth: 0
                }}
                title={`${h.heroName} - ${h.games} игр, ${h.winrate}% винрейт`}
              >
                <img
                  src={h.heroIcon}
                  alt={h.heroName}
                  style={{ width: '24px', height: '14px', borderRadius: '3px', objectFit: 'cover' }}
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {h.heroName}
                  </div>
                  <div style={{ fontSize: '9px', color: h.winrate >= 55 ? '#10B981' : h.winrate <= 46 ? '#EF4444' : 'var(--text-muted)' }}>
                    {h.winrate}% ({h.games})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Form Dots (last 10 matches) */}
        {p.recentMatches && p.recentMatches.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {t.recentMatches} ({p.smurfAnalysis.recentWinrate}% WR):
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {p.recentMatches.slice(0, 10).map((m, idx) => (
                <span
                  key={idx}
                  title={`${m.heroName} - ${m.won ? (isRu ? 'Победа' : 'Win') : (isRu ? 'Поражение' : 'Loss')} (${m.kda})`}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 700,
                    background: m.won ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: m.won ? '#10B981' : '#EF4444',
                    border: `1px solid ${m.won ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                  }}
                >
                  {m.won ? 'W' : 'L'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDossierView = (p: PlayerDossier, isModal = false) => {
    const smurf = p.smurfAnalysis;
    const isHighThreat = smurf.threatLevel === 'high' || smurf.isSmurfSuspect;

    return (
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: isModal ? '900px' : '100%',
          width: '100%',
          margin: '0 auto',
          boxShadow: 'var(--shadow-modal)'
        }}
      >
        {/* Top Dossier Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src={p.avatar}
              alt={p.name}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid var(--border-highlight)'
              }}
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {p.name}
                </h2>
                {p.isPrivate && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Lock size={12} /> {t.privateProfile}
                  </span>
                )}
              </div>
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {renderRankBadge(p)}
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ID: {p.accountId}
                </span>
                <button
                  onClick={() => handleCopy(p.accountId)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedId === p.accountId ? '#10B981' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    padding: 0
                  }}
                >
                  {copiedId === p.accountId ? <Check size={12} /> : <Copy size={12} />}
                  {copiedId === p.accountId ? t.copied : t.copyId}
                </button>
              </div>
            </div>
          </div>

          {/* Quick links & Close modal button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {p.profileUrl && (
              <button
                onClick={() => window.stormPlay.system.openExternal(p.profileUrl)}
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ExternalLink size={12} /> {t.openSteam}
              </button>
            )}
            {p.accountId > 0 && (
              <button
                onClick={() => window.stormPlay.system.openExternal(`https://www.dotabuff.com/players/${p.accountId}`)}
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: '#EF4444',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ExternalLink size={12} /> {t.openDotabuff}
              </button>
            )}
            {isModal && (
              <button
                onClick={() => setSelectedPlayer(null)}
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Private Profile Banner */}
        {p.isPrivate && (
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Lock size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t.privateProfile}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {t.privateProfileDesc}
              </div>
            </div>
          </div>
        )}

        {/* Threat & Smurf Assessment Box */}
        {!p.isPrivate && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: isHighThreat
                ? 'rgba(239, 68, 68, 0.08)'
                : smurf.threatLevel === 'medium'
                ? 'rgba(245, 158, 11, 0.08)'
                : 'rgba(16, 185, 129, 0.08)',
              border: `1px solid ${
                isHighThreat
                  ? 'rgba(239, 68, 68, 0.3)'
                  : smurf.threatLevel === 'medium'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(16, 185, 129, 0.3)'
              }`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isHighThreat ? (
                  <Flame size={18} color="#EF4444" />
                ) : smurf.threatLevel === 'medium' ? (
                  <ShieldAlert size={18} color="#F59E0B" />
                ) : (
                  <Award size={18} color="#10B981" />
                )}
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: isHighThreat ? '#EF4444' : smurf.threatLevel === 'medium' ? '#F59E0B' : '#10B981'
                  }}
                >
                  {isHighThreat ? t.threatHigh : smurf.threatLevel === 'medium' ? t.threatMed : t.threatLow}
                  {smurf.isSmurfSuspect ? ` • ${t.smurfSuspect}` : ''}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {isRu ? 'Надёжность данных' : 'Confidence'}: {smurf.confidenceScore}%
              </span>
            </div>

            {smurf.reasons.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {smurf.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Big Key Stats Grid */}
        {!p.isPrivate && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{t.winrate}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: p.overallWinrate >= 55 ? '#10B981' : 'var(--text-primary)', marginTop: '2px' }}>
                {p.overallWinrate}%
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {p.wins}W / {p.losses}L
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{t.totalMatches}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {p.totalGames.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {p.wins + p.losses > 0 ? (isRu ? 'Учтено в OpenDota' : 'Recorded matches') : ''}
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{t.estMmr}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
                {p.estimatedMmr ? p.estimatedMmr.toLocaleString() : '-'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {p.rankName || t.uncalibrated}
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{isRu ? 'Рейтинг WR' : 'Ranked WR'}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: p.rankedWinrate && p.rankedWinrate >= 55 ? '#10B981' : 'var(--text-primary)', marginTop: '2px' }}>
                {p.rankedWinrate ? `${p.rankedWinrate}%` : '-'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {p.rankedGames ? `${p.rankedGames} ${t.gamesUnit}` : (isRu ? 'Нет рейтинговых игр' : 'No ranked games')}
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{isRu ? 'Турбо WR' : 'Turbo WR'}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: p.turboWinrate && p.turboWinrate >= 55 ? '#38BDF8' : 'var(--text-primary)', marginTop: '2px' }}>
                {p.turboWinrate ? `${p.turboWinrate}%` : '-'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {p.turboGames ? `${p.turboGames} ${t.gamesUnit}` : (isRu ? 'Нет турбо игр' : 'No turbo games')}
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{isRu ? 'Форма (20 игр)' : 'Form (20 games)'}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: smurf.recentWinrate >= 60 ? '#10B981' : smurf.recentWinrate <= 40 ? '#EF4444' : 'var(--text-primary)', marginTop: '2px' }}>
                {smurf.recentWinrate}%
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {smurf.winStreak >= 2 ? `🔥 ${smurf.winStreak} winstreak` : smurf.loseStreak >= 2 ? `❄️ ${smurf.loseStreak} losestreak` : (isRu ? 'Обычный темп' : 'Standard pace')}
              </div>
            </div>
          </div>
        )}

        {/* Signature Heroes (Top 10) */}
        {!p.isPrivate && p.topHeroes && p.topHeroes.length > 0 && (
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#F59E0B" />
              {t.signatures}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
              {p.topHeroes.map(h => (
                <div
                  key={h.heroId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'var(--bg-glass)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <img
                    src={h.heroIcon}
                    alt={h.heroName}
                    style={{ width: '40px', height: '23px', borderRadius: '4px', objectFit: 'cover' }}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {h.heroName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <span>{h.games} {t.gamesUnit}</span>
                      <span style={{ fontWeight: 700, color: h.winrate >= 55 ? '#10B981' : h.winrate <= 46 ? '#EF4444' : 'var(--text-primary)' }}>
                        {h.winrate}% WR
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Matches (20) Form List */}
        {!p.isPrivate && p.recentMatches && p.recentMatches.length > 0 && (
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Swords size={16} color="#38BDF8" />
              {t.recentMatches}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
              {p.recentMatches.map(m => (
                <div
                  key={m.matchId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    background: 'var(--bg-glass)',
                    borderRadius: '8px',
                    border: `1px solid ${m.won ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: m.won ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: m.won ? '#10B981' : '#EF4444'
                      }}
                    >
                      {m.won ? (isRu ? 'ПОБЕДА' : 'WIN') : (isRu ? 'ПОРАЖЕНИЕ' : 'LOSS')}
                    </span>
                    <img
                      src={m.heroIcon}
                      alt={m.heroName}
                      style={{ width: '32px', height: '18px', borderRadius: '3px', objectFit: 'cover' }}
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.heroName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {m.kda} <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 400 }}>KDA</span>
                    </span>
                    {m.durationSeconds > 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {Math.floor(m.durationSeconds / 60)}:{(m.durationSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="view-transition" style={{ padding: '28px 36px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Crosshair size={24} color="#38BDF8" />
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {t.title}
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          {t.subtitle}
        </p>
      </header>

      {/* Search and Action Bar */}
      <div
        className="glass-section"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAnalyze();
              }}
              placeholder={t.searchPlaceholder}
              style={{
                width: '100%',
                padding: '11px 16px 11px 42px',
                borderRadius: '10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !inputQuery.trim()}
            style={{
              padding: '11px 22px',
              borderRadius: '10px',
              background: 'var(--accent-blue)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: loading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !inputQuery.trim() ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0
            }}
          >
            {loading ? <RefreshCw size={14} className="spin" /> : <Crosshair size={14} />}
            {loading ? t.analyzing : t.analyzeBtn}
          </button>
        </div>

        {/* Secondary Utility Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleMyProfile}
              disabled={loading}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <User size={13} />
              {t.myProfileBtn}
            </button>

            <button
              onClick={handleLoadSample}
              disabled={loading}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Swords size={13} />
              {t.sampleBtn}
            </button>
          </div>

          {(inputQuery || dossier || lobby) && (
            <button
              onClick={handleClear}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {t.clearBtn}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <ShieldAlert size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
          <RefreshCw size={28} className="spin" color="var(--accent-blue)" />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {t.analyzing}
          </span>
        </div>
      )}

      {/* Lobby Roster View (Radiant vs Dire) */}
      {!loading && lobby && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Summary stats banner */}
          <div
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {isRu ? 'Найдено игроков' : 'Players found'}: <strong>{lobby.totalPlayers}</strong>
              </span>
              {lobby.smurfCount > 0 && (
                <span style={{ color: '#EF4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Flame size={14} /> {isRu ? 'Подозрений на смурфа' : 'Smurf suspects'}: {lobby.smurfCount}
                </span>
              )}
              {lobby.privateCount > 0 && (
                <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> {isRu ? 'Закрытых профилей' : 'Private profiles'}: {lobby.privateCount}
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isRu ? 'Нажмите на карточку любого игрока для подробного досье' : 'Click any player card to view complete dossier'}
            </span>
          </div>

          {/* 5v5 Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            {/* Radiant Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#10B981', letterSpacing: '0.5px' }}>
                    {t.radiant}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {lobby.radiant.length} / 5
                </span>
              </div>

              {lobby.radiant.map(p => renderPlayerCard(p, '#10B981'))}
            </div>

            {/* Dire Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444', letterSpacing: '0.5px' }}>
                    {t.dire}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {lobby.dire.length} / 5
                </span>
              </div>

              {lobby.dire.map(p => renderPlayerCard(p, '#EF4444'))}
            </div>
          </div>

          {/* Unassigned Players (if > 10) */}
          {lobby.unassigned.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t.unassigned} ({lobby.unassigned.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
                {lobby.unassigned.map(p => renderPlayerCard(p, 'var(--border-subtle)'))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single Player Dossier View */}
      {!loading && dossier && !lobby && (
        renderDossierView(dossier, false)
      )}

      {/* Player Modal Drawer when clicking a card in Lobby */}
      {selectedPlayer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
            overflowY: 'auto'
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedPlayer(null);
          }}
        >
          {renderDossierView(selectedPlayer, true)}
        </div>
      )}
    </div>
  );
};
