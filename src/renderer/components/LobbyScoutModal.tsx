import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Bug,
  Shield,
  Zap,
  ExternalLink
} from 'lucide-react';
import type { PlayerDossier, LobbyRoster } from '../../shared/types';

interface LobbyScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ru' | 'en';
  initialRoster?: LobbyRoster | null;
}

export const LobbyScoutModal: React.FC<LobbyScoutModalProps> = ({
  isOpen,
  onClose,
  language = 'ru',
  initialRoster = null
}) => {
  const isRu = language === 'ru';

  const [loading, setLoading] = useState(false);
  const [roster, setRoster] = useState<LobbyRoster | null>(initialRoster);
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState<number>(0);
  const [forceShowAll, setForceShowAll] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (initialRoster) {
      setRoster(initialRoster);
      focusMostSuspicious(initialRoster);
    }
  }, [initialRoster]);

  const enemies: PlayerDossier[] = React.useMemo(() => {
    if (!roster) return [];
    if (roster.dire.length > 0) return roster.dire;
    if (roster.radiant.length > 0) return roster.radiant;
    return roster.unassigned.slice(0, 5);
  }, [roster]);

  const suspiciousEnemies = React.useMemo(() => {
    return enemies.filter(
      (e) =>
        e.smurfAnalysis.suspicionLevel === 'high_smurf' ||
        e.smurfAnalysis.suspicionLevel === 'high_suspicion' ||
        e.smurfAnalysis.suspicionLevel === 'suspicious'
    );
  }, [enemies]);

  const hasSuspicious = suspiciousEnemies.length > 0;

  const focusMostSuspicious = (r: LobbyRoster) => {
    const list = r.dire.length > 0 ? r.dire : r.radiant.length > 0 ? r.radiant : r.unassigned;
    if (!list || list.length === 0) return;

    let bestIdx = 0;
    let maxChance = -1;
    list.forEach((p, idx) => {
      if (p.smurfAnalysis.smurfChancePercent > maxChance) {
        maxChance = p.smurfAnalysis.smurfChancePercent;
        bestIdx = idx;
      }
    });
    setSelectedEnemyIndex(bestIdx);
  };

  const handleParseClipboard = async () => {
    try {
      setLoading(true);
      const text = await navigator.clipboard.readText();
      if (!text) {
        setLoading(false);
        return;
      }
      const newRoster = await window.stormPlay.inspector.parseLobby(text);
      setRoster(newRoster);
      focusMostSuspicious(newRoster);
      setForceShowAll(false);
    } catch (err) {
      console.error('Failed to parse clipboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const currentEnemy: PlayerDossier | undefined = enemies[selectedEnemyIndex];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.80)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 180ms ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '580px',
          maxWidth: '94vw',
          maxHeight: '88vh',
          background: 'rgba(13, 15, 23, 0.97)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#E2E8F0',
          position: 'relative',
          fontFamily: 'inherit'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B'
              }}
            >
              <Zap size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#fff' }}>
                  {isRu ? 'Разведка лобби' : 'Lobby Scout'}
                </span>
                {loading && (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#38BDF8',
                      boxShadow: '0 0 8px #38BDF8',
                      display: 'inline-block'
                    }}
                  />
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '1px' }}>
                {loading
                  ? (isRu ? 'Анализируем противников...' : 'Analyzing opponents...')
                  : enemies.length > 0
                  ? (isRu ? `${enemies.length} противников · анализ завершён` : `${enemies.length} opponents · analyzed`)
                  : (isRu ? 'Ожидание матча или вставьте status' : 'Waiting for match or paste status')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleParseClipboard}
              disabled={loading}
              title={isRu ? 'Вставить вывод status из буфера' : 'Paste status from clipboard'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E2E8F0',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 160ms ease'
              }}
            >
              <Clipboard size={13} style={{ color: '#38BDF8' }} />
              <span>{isRu ? 'Вставить status' : 'Paste status'}</span>
            </button>

            <button
              onClick={() => setDebugMode(!debugMode)}
              title={isRu ? 'Режим отладки (Debug Mode)' : 'Debug Mode'}
              style={{
                padding: '7px',
                borderRadius: '8px',
                background: debugMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${debugMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                color: debugMode ? '#38BDF8' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 160ms ease'
              }}
            >
              <Bug size={14} />
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '7px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 160ms ease'
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div style={{ padding: '16px', overflowY: 'auto', maxHeight: 'calc(88vh - 65px)' }}>
          {loading ? (
            /* Loading State */
            <div style={{ padding: '40px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid rgba(56, 189, 248, 0.2)',
                  borderTopColor: '#38BDF8',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '12px'
                }}
              />
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                {isRu ? 'Анализируем противников...' : 'Analyzing opponents...'}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                {isRu ? 'Сбор винрейтов Ranked, Turbo, All Pick и сигнатурок' : 'Fetching Ranked, Turbo, All Pick winrates & signatures'}
              </div>
            </div>
          ) : enemies.length === 0 ? (
            /* Empty State */
            <div style={{ padding: '36px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
                <Shield size={26} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                {isRu ? 'Нет активных данных лобби' : 'No active lobby data'}
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '380px', margin: '8px auto 18px auto', lineHeight: '1.4' }}>
                {isRu
                  ? 'Запустите матч в Dota 2 (стадия пиков) или скопируйте в консоли команду status и нажмите кнопку ниже.'
                  : 'Start a Dota 2 match (draft phase) or run status in game console and paste below.'}
              </p>
              <button
                onClick={handleParseClipboard}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: '#0EA5E9',
                  border: 'none',
                  color: '#040d1a',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
                }}
              >
                <Clipboard size={14} />
                <span>{isRu ? 'Вставить консольный status' : 'Paste console status'}</span>
              </button>
            </div>
          ) : !hasSuspicious && !forceShowAll ? (
            /* All Normal / Clean Screen */
            <div style={{ padding: '36px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  marginBottom: '14px',
                  boxShadow: '0 0 24px rgba(16, 185, 129, 0.18)'
                }}
              >
                <CheckCircle size={32} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff', letterSpacing: '0.04em' }}>
                {isRu ? '🟢 СМУРФЫ НЕ ОБНАРУЖЕНЫ' : '🟢 NO SMURFS DETECTED'}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', margin: '6px 0 20px 0' }}>
                {isRu
                  ? `Проверено: ${enemies.length} противников · Подозрительных игроков: 0`
                  : `Checked: ${enemies.length} opponents · Suspicious: 0`}
              </div>
              <button
                onClick={() => setForceShowAll(true)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isRu ? 'Показать список игроков' : 'View player roster'}
              </button>
            </div>
          ) : currentEnemy ? (
            /* Player Dossier (Fast 5-second reading) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Opponent Carousel Switcher */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '5px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <button
                  onClick={() =>
                    setSelectedEnemyIndex((prev) =>
                      prev > 0 ? prev - 1 : enemies.length - 1
                    )
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
                  {enemies.map((e, idx) => {
                    const isSelected = idx === selectedEnemyIndex;
                    const level = e.smurfAnalysis.suspicionLevel;
                    let dotColor = '#10B981';
                    if (level === 'high_smurf') dotColor = '#EF4444';
                    else if (level === 'high_suspicion') dotColor = '#F59E0B';
                    else if (level === 'suspicious') dotColor = '#FACC15';

                    return (
                      <button
                        key={e.accountId || idx}
                        onClick={() => setSelectedEnemyIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                          color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                          transition: 'all 140ms ease'
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: dotColor,
                            boxShadow: `0 0 6px ${dotColor}`
                          }}
                        />
                        <span style={{ maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.name || `P${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setSelectedEnemyIndex((prev) =>
                      prev < enemies.length - 1 ? prev + 1 : 0
                    )
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Suspicion Alert Banner */}
              {(() => {
                const level = currentEnemy.smurfAnalysis.suspicionLevel;
                let bg = 'rgba(16, 185, 129, 0.12)';
                let border = 'rgba(16, 185, 129, 0.3)';
                let color = '#10B981';

                if (level === 'high_smurf') {
                  bg = 'rgba(239, 68, 68, 0.14)';
                  border = 'rgba(239, 68, 68, 0.35)';
                  color = '#EF4444';
                } else if (level === 'high_suspicion') {
                  bg = 'rgba(245, 158, 11, 0.14)';
                  border = 'rgba(245, 158, 11, 0.35)';
                  color = '#F59E0B';
                } else if (level === 'suspicious') {
                  bg = 'rgba(250, 204, 21, 0.14)';
                  border = 'rgba(250, 204, 21, 0.35)';
                  color = '#FACC15';
                }

                return (
                  <div
                    style={{
                      padding: '9px 14px',
                      borderRadius: '12px',
                      background: bg,
                      border: `1px solid ${border}`,
                      color: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {level === 'clean' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                      <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {currentEnemy.smurfAnalysis.summaryHeadline || (isRu ? 'ПОДОЗРИТЕЛЬНЫХ ПРИЗНАКОВ НЕ НАЙДЕНО' : 'CLEAN ACCOUNT')}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.85 }}>
                      {isRu ? `Шанс: ${currentEnemy.smurfAnalysis.smurfChancePercent}%` : `Chance: ${currentEnemy.smurfAnalysis.smurfChancePercent}%`}
                    </span>
                  </div>
                );
              })()}

              {/* Player Identity Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.07)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={currentEnemy.avatar}
                    alt={currentEnemy.name}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                      {currentEnemy.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <button
                        onClick={() => copyToClipboard(currentEnemy.accountId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0,
                          fontFamily: 'monospace'
                        }}
                      >
                        <span>ID: {currentEnemy.accountId}</span>
                        {copiedId === currentEnemy.accountId ? (
                          <Check size={12} style={{ color: '#10B981' }} />
                        ) : (
                          <Copy size={12} style={{ opacity: 0.6 }} />
                        )}
                      </button>
                      {currentEnemy.profileUrl && (
                        <a
                          href={currentEnemy.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'rgba(255, 255, 255, 0.4)', display: 'flex', alignItems: 'center' }}
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                    {currentEnemy.rankName || (isRu ? 'Без ранга' : 'Unranked')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                    MMR: <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{currentEnemy.mmrDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Mode Winrates (Ranked, Turbo, All Pick) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* Ranked */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '12px',
                    padding: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.45)' }}>
                    Ranked
                  </div>
                  <div
                    style={{
                      fontSize: '17px',
                      fontWeight: 900,
                      marginTop: '2px',
                      color:
                        currentEnemy.rankedStats.winrate !== null && currentEnemy.rankedStats.winrate >= 60
                          ? '#F59E0B'
                          : '#fff'
                    }}
                  >
                    {currentEnemy.rankedStats.formatted}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>
                    {currentEnemy.rankedStats.detailText}
                  </div>
                </div>

                {/* Turbo */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '12px',
                    padding: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.45)' }}>
                    Turbo
                  </div>
                  <div
                    style={{
                      fontSize: '17px',
                      fontWeight: 900,
                      marginTop: '2px',
                      color:
                        currentEnemy.turboStats.winrate !== null && currentEnemy.turboStats.winrate >= 60
                          ? '#38BDF8'
                          : '#fff'
                    }}
                  >
                    {currentEnemy.turboStats.formatted}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>
                    {currentEnemy.turboStats.detailText}
                  </div>
                </div>

                {/* All Pick */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '12px',
                    padding: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.45)' }}>
                    All Pick
                  </div>
                  <div
                    style={{
                      fontSize: '17px',
                      fontWeight: 900,
                      marginTop: '2px',
                      color:
                        currentEnemy.allPickStats.winrate !== null && currentEnemy.allPickStats.winrate >= 60
                          ? '#10B981'
                          : '#fff'
                    }}
                  >
                    {currentEnemy.allPickStats.formatted}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>
                    {currentEnemy.allPickStats.detailText}
                  </div>
                </div>
              </div>

              {/* Signature Heroes (3-4 items) */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.45)', marginBottom: '8px' }}>
                  {isRu ? 'Сигнатурные герои' : 'Signature Heroes'}
                </div>
                {currentEnemy.topHeroes && currentEnemy.topHeroes.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {currentEnemy.topHeroes.slice(0, 4).map((h) => (
                      <div
                        key={h.heroId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'rgba(0, 0, 0, 0.25)',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <img
                          src={h.heroIcon}
                          alt={h.heroName}
                          style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {h.heroName}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.5)' }}>
                            {h.games} {isRu ? 'игр' : 'games'} ·{' '}
                            <span style={{ color: h.winrate >= 65 ? '#F59E0B' : '#E2E8F0', fontWeight: h.winrate >= 65 ? 700 : 500 }}>
                              {h.winrate}% WR
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic' }}>
                    {isRu ? 'Недостаточно сыгранных матчей на сигнатурах' : 'Not enough signature matches'}
                  </div>
                )}
              </div>

              {/* Reasons */}
              {currentEnemy.smurfAnalysis.reasons && currentEnemy.smurfAnalysis.reasons.length > 0 && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '12px',
                    padding: '12px'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.45)', marginBottom: '6px' }}>
                    {isRu ? 'Причины подозрения' : 'Reasons for suspicion'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {currentEnemy.smurfAnalysis.reasons.map((r, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#CBD5E1', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ color: '#F59E0B', lineHeight: 1 }}>•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer row: confidence & details toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px', fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.45)' }}>
                <div>
                  {isRu ? 'Надёжность анализа:' : 'Analysis confidence:'}{' '}
                  <span style={{ color: '#E2E8F0', fontWeight: 700 }}>
                    {currentEnemy.smurfAnalysis.confidenceScore}%
                  </span>
                </div>

                <button
                  onClick={() => setShowDetails(!showDetails)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38BDF8',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showDetails
                    ? (isRu ? 'Скрыть подробности' : 'Hide details')
                    : (isRu ? 'Открыть подробности' : 'View details')}
                </button>
              </div>

              {/* Details / Debug collapsible */}
              {showDetails && (
                <div
                  style={{
                    marginTop: '4px',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                    <span>{isRu ? 'Последние матчи' : 'Recent Matches'}</span>
                    <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      {currentEnemy.recentMatches.length} {isRu ? 'матчей' : 'matches'}
                    </span>
                  </div>

                  <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {currentEnemy.recentMatches.slice(0, 10).map((m) => (
                      <div
                        key={m.matchId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <img src={m.heroIcon} alt={m.heroName} style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'cover' }} />
                          <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{m.heroName}</span>
                          <span style={{ fontWeight: 700, color: m.won ? '#10B981' : '#EF4444' }}>
                            {m.won ? (isRu ? 'Победа' : 'Win') : (isRu ? 'Поражение' : 'Loss')}
                          </span>
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'monospace' }}>{m.kda}</div>
                      </div>
                    ))}
                  </div>

                  {debugMode && currentEnemy.debugMatches && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bug size={11} />
                        <span>Debug Mode: Raw Match Data</span>
                      </div>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.6)', padding: '6px', borderRadius: '6px', fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.6)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {currentEnemy.debugMatches.map((dm) => (
                          <div key={dm.matchId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '2px' }}>
                            ID: <span style={{ color: '#fff' }}>{dm.matchId}</span> | GM: <span style={{ color: '#F59E0B' }}>{dm.gameMode}</span> | Lobby: <span style={{ color: '#38BDF8' }}>{dm.lobbyType}</span> | Won: <span style={{ color: dm.won ? '#10B981' : '#EF4444' }}>{dm.won ? 'true' : 'false'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
