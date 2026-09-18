import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Bug,
  Shield,
  Crosshair,
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
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="fade-in"
        style={{
          width: '560px',
          maxWidth: '92vw',
          maxHeight: '88vh',
          background: 'var(--bg-modal, rgba(12, 12, 16, 0.96))',
          backdropFilter: 'blur(var(--glass-blur, 24px))',
          WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
          border: '1px solid var(--border-highlight, rgba(255, 255, 255, 0.16))',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-glass, 0 24px 60px rgba(0, 0, 0, 0.75))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-primary, #FFFFFF)',
          position: 'relative'
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
            background: 'var(--bg-header, rgba(8, 8, 10, 0.65))',
            borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444'
              }}
            >
              <Crosshair size={15} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-primary, #fff)' }}>
                  {isRu ? 'РАЗВЕДКА ЛОББИ' : 'LOBBY SCOUT'}
                </span>
                {loading && (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#EF4444',
                      boxShadow: '0 0 8px #EF4444',
                      display: 'inline-block'
                    }}
                  />
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #666)', marginTop: '1px' }}>
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
              className="interactive-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                color: 'var(--text-secondary, #A0A0A0)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 160ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary, #fff)';
                e.currentTarget.style.borderColor = 'var(--border-highlight, rgba(255, 255, 255, 0.16))';
                e.currentTarget.style.background = 'var(--bg-card-hover, rgba(22, 22, 28, 0.82))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary, #A0A0A0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle, rgba(255, 255, 255, 0.08))';
                e.currentTarget.style.background = 'var(--bg-surface, rgba(24, 24, 30, 0.5))';
              }}
            >
              <Clipboard size={12} />
              <span>{isRu ? 'Вставить status' : 'Paste status'}</span>
            </button>

            <button
              onClick={() => setDebugMode(!debugMode)}
              title={isRu ? 'Режим отладки (Debug Mode)' : 'Debug Mode'}
              className="interactive-press"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: debugMode ? 'rgba(255, 255, 255, 0.12)' : 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                border: `1px solid ${debugMode ? 'var(--border-highlight)' : 'var(--border-subtle)'}`,
                color: debugMode ? '#fff' : 'var(--text-secondary, #A0A0A0)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 160ms ease'
              }}
            >
              <Bug size={13} />
            </button>

            <button
              onClick={onClose}
              className="interactive-press"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                color: 'var(--text-secondary, #A0A0A0)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 160ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E11D48';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface, rgba(24, 24, 30, 0.5))';
                e.currentTarget.style.color = 'var(--text-secondary, #A0A0A0)';
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px', overflowY: 'auto', maxHeight: 'calc(88vh - 65px)' }}>
          {loading ? (
            /* Loading State */
            <div style={{ padding: '44px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '2.5px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                  borderTopColor: 'var(--text-primary, #fff)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '14px'
                }}
              />
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                {isRu ? 'Анализируем противников...' : 'Analyzing opponents...'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #666)', marginTop: '4px' }}>
                {isRu ? 'Сбор винрейтов Ranked, Turbo, All Pick и сигнатур' : 'Fetching Ranked, Turbo, All Pick winrates & signatures'}
              </div>
            </div>
          ) : enemies.length === 0 ? (
            /* Empty State */
            <div style={{ padding: '36px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  color: 'var(--text-muted, #666)'
                }}
              >
                <Shield size={22} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>
                {isRu ? 'Нет активных данных лобби' : 'No active lobby data'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary, #A0A0A0)', maxWidth: '380px', margin: '8px auto 20px auto', lineHeight: '1.5' }}>
                {isRu
                  ? 'Запустите матч в Dota 2 (стадия пиков) или скопируйте в консоли команду status и нажмите кнопку ниже.'
                  : 'Start a Dota 2 match (draft phase) or run status in game console and paste below.'}
              </p>
              <button
                onClick={handleParseClipboard}
                className="interactive-press"
                style={{
                  padding: '11px 22px',
                  borderRadius: '30px',
                  background: 'var(--text-primary, #FFFFFF)',
                  border: 'none',
                  color: 'var(--bg-app, #060608)',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
                  transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.35)';
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
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  marginBottom: '14px'
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary, #fff)', letterSpacing: '0.04em' }}>
                {isRu ? 'СМУРФЫ НЕ ОБНАРУЖЕНЫ' : 'NO SMURFS DETECTED'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #A0A0A0)', margin: '6px 0 20px 0' }}>
                {isRu
                  ? `Проверено: ${enemies.length} противников · Подозрительных игроков: 0`
                  : `Checked: ${enemies.length} opponents · Suspicious: 0`}
              </div>
              <button
                onClick={() => setForceShowAll(true)}
                className="interactive-press"
                style={{
                  padding: '9px 20px',
                  borderRadius: '30px',
                  background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  color: 'var(--text-primary, #fff)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-highlight)';
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                }}
              >
                {isRu ? 'Показать список игроков' : 'View player roster'}
              </button>
            </div>
          ) : currentEnemy ? (
            /* Player Dossier */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Carousel Switcher */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                  padding: '4px 6px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))'
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
                    color: 'var(--text-secondary, #A0A0A0)',
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
                          background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                          border: isSelected ? '1px solid var(--border-highlight, rgba(255, 255, 255, 0.16))' : '1px solid transparent',
                          color: isSelected ? 'var(--text-primary, #fff)' : 'var(--text-secondary, #A0A0A0)',
                          transition: 'all 140ms ease'
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: dotColor
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
                    color: 'var(--text-secondary, #A0A0A0)',
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
                let bg = 'rgba(16, 185, 129, 0.1)';
                let border = 'rgba(16, 185, 129, 0.25)';
                let color = '#10B981';

                if (level === 'high_smurf') {
                  bg = 'rgba(239, 68, 68, 0.1)';
                  border = 'rgba(239, 68, 68, 0.25)';
                  color = '#EF4444';
                } else if (level === 'high_suspicion') {
                  bg = 'rgba(245, 158, 11, 0.1)';
                  border = 'rgba(245, 158, 11, 0.25)';
                  color = '#F59E0B';
                } else if (level === 'suspicious') {
                  bg = 'rgba(250, 204, 21, 0.1)';
                  border = 'rgba(250, 204, 21, 0.25)';
                  color = '#FACC15';
                }

                return (
                  <div
                    style={{
                      padding: '9px 14px',
                      borderRadius: '10px',
                      background: bg,
                      border: `1px solid ${border}`,
                      color: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {level === 'clean' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
                  background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={currentEnemy.avatar}
                    alt={currentEnemy.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))'
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary, #fff)', lineHeight: 1.2 }}>
                      {currentEnemy.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <button
                        onClick={() => copyToClipboard(currentEnemy.accountId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted, #666)',
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
                          <Check size={11} style={{ color: '#10B981' }} />
                        ) : (
                          <Copy size={11} style={{ opacity: 0.6 }} />
                        )}
                      </button>
                      {currentEnemy.profileUrl && (
                        <a
                          href={currentEnemy.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--text-dim, #444)', display: 'flex', alignItems: 'center' }}
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>
                    {currentEnemy.rankName || (isRu ? 'Без ранга' : 'Unranked')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #666)', marginTop: '2px' }}>
                    MMR: <span style={{ color: 'var(--text-secondary, #A0A0A0)', fontWeight: 600 }}>{currentEnemy.mmrDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Mode Winrates (Ranked, Turbo, All Pick) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* Ranked */}
                <div
                  style={{
                    background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #666)' }}>
                    Ranked
                  </div>
                  <div
                    style={{
                      fontSize: '17px',
                      fontWeight: 900,
                      marginTop: '2px',
                      color:
                        currentEnemy.rankedStats.winrate !== null && currentEnemy.rankedStats.winrate >= 60
                          ? '#EF4444'
                          : 'var(--text-primary, #fff)'
                    }}
                  >
                    {currentEnemy.rankedStats.formatted}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #666)', marginTop: '2px' }}>
                    {currentEnemy.rankedStats.detailText}
                  </div>
                </div>

                {/* Turbo */}
                <div
                  style={{
                    background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #666)' }}>
                    Turbo
                  </div>
                  <div
                    style={{
                      fontSize: '17px',
                      fontWeight: 900,
                      marginTop: '2px',
                      color:
                        currentEnemy.turboStats.winrate !== null && currentEnemy.turboStats.winrate >= 60
                          ? '#F59E0B'
                          : 'var(--text-primary, #fff)'
                    }}
                  >
                    {currentEnemy.turboStats.formatted}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #666)', marginTop: '2px' }}>
                    {currentEnemy.turboStats.detailText}
                  </div>
                </div>

                {/* All Pick */}
                <div
                  style={{
                    background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #666)' }}>
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
                          : 'var(--text-primary, #fff)'
                    }}
                  >
                    {currentEnemy.allPickStats.formatted}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #666)', marginTop: '2px' }}>
                    {currentEnemy.allPickStats.detailText}
                  </div>
                </div>
              </div>

              {/* Signature Heroes */}
              <div
                style={{
                  background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  borderRadius: '10px',
                  padding: '12px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #666)', marginBottom: '8px' }}>
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
                          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))'
                        }}
                      >
                        <img
                          src={h.heroIcon}
                          alt={h.heroName}
                          style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #fff)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {h.heroName}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary, #A0A0A0)' }}>
                            {h.games} {isRu ? 'игр' : 'games'} ·{' '}
                            <span style={{ color: h.winrate >= 65 ? '#EF4444' : 'var(--text-primary, #fff)', fontWeight: h.winrate >= 65 ? 700 : 500 }}>
                              {h.winrate}% WR
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #666)', fontStyle: 'italic' }}>
                    {isRu ? 'Недостаточно сыгранных матчей на сигнатурах' : 'Not enough signature matches'}
                  </div>
                )}
              </div>

              {/* Reasons */}
              {currentEnemy.smurfAnalysis.reasons && currentEnemy.smurfAnalysis.reasons.length > 0 && (
                <div
                  style={{
                    background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                    borderRadius: '10px',
                    padding: '12px'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #666)', marginBottom: '6px' }}>
                    {isRu ? 'Причины подозрения' : 'Reasons for suspicion'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {currentEnemy.smurfAnalysis.reasons.map((r, i) => (
                      <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary, #A0A0A0)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ color: '#EF4444', lineHeight: 1 }}>•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px', fontSize: '11.5px', color: 'var(--text-muted, #666)' }}>
                <div>
                  {isRu ? 'Надёжность анализа:' : 'Analysis confidence:'}{' '}
                  <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 700 }}>
                    {currentEnemy.smurfAnalysis.confidenceScore}%
                  </span>
                </div>

                <button
                  onClick={() => setShowDetails(!showDetails)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary, #fff)',
                    opacity: 0.8,
                    fontWeight: 700,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
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
                    background: 'var(--bg-app, #060608)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                    <span>{isRu ? 'Последние матчи' : 'Recent Matches'}</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #666)' }}>
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
                          background: 'var(--bg-surface, rgba(24, 24, 30, 0.5))',
                          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.04))'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <img src={m.heroIcon} alt={m.heroName} style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'cover' }} />
                          <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 500 }}>{m.heroName}</span>
                          <span style={{ fontWeight: 700, color: m.won ? '#10B981' : '#EF4444' }}>
                            {m.won ? (isRu ? 'Победа' : 'Win') : (isRu ? 'Поражение' : 'Loss')}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-muted, #666)', fontFamily: 'monospace' }}>{m.kda}</div>
                      </div>
                    ))}
                  </div>

                  {debugMode && currentEnemy.debugMatches && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bug size={11} />
                        <span>Debug Mode: Raw Match Data</span>
                      </div>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.5)', padding: '6px', borderRadius: '6px', fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {currentEnemy.debugMatches.map((dm) => (
                          <div key={dm.matchId} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2px' }}>
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
