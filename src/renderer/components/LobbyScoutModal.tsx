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
  HelpCircle,
  Shield,
  Zap,
  ExternalLink
} from 'lucide-react';
import type { PlayerDossier, LobbyRoster, DebugMatchInfo } from '../../shared/types';

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

  // Sync initialRoster if provided
  useEffect(() => {
    if (initialRoster) {
      setRoster(initialRoster);
      focusMostSuspicious(initialRoster);
    }
  }, [initialRoster]);

  // Pick enemies (Dire if Radiant, or just first 5 enemies)
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container: Compact 580px width, clean glassmorphism */}
      <div className="relative w-full max-w-[600px] bg-[#0d0f17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.03] border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide uppercase text-white flex items-center gap-2">
                {isRu ? 'Разведка лобби' : 'Lobby Scout'}
                {loading && (
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {loading
                  ? (isRu ? 'Анализируем противников...' : 'Analyzing opponents...')
                  : enemies.length > 0
                  ? (isRu ? `${enemies.length} противников · анализ завершён` : `${enemies.length} opponents · analyzed`)
                  : (isRu ? 'Ожидание матча или вставьте status' : 'Waiting for match or paste status')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleParseClipboard}
              disabled={loading}
              title={isRu ? 'Вставить вывод status из буфера' : 'Paste status from clipboard'}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white border border-white/5 transition flex items-center gap-1.5"
            >
              <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isRu ? 'Вставить status' : 'Paste status'}</span>
            </button>

            <button
              onClick={() => setDebugMode(!debugMode)}
              title={isRu ? 'Режим отладки (Debug Mode)' : 'Debug Mode'}
              className={`p-1.5 rounded-lg border transition ${
                debugMode
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border-white/5'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/5 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[75vh]">
          {loading ? (
            /* Loading State */
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold text-white">
                {isRu ? 'Анализируем противников...' : 'Analyzing opponents...'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isRu ? 'Сбор винрейтов Ranked, Turbo, All Pick и сигнатур' : 'Fetching Ranked, Turbo, All Pick winrates & signatures'}
              </p>
            </div>
          ) : enemies.length === 0 ? (
            /* Empty State */
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <Shield className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-200">
                {isRu ? 'Нет активных данных лобби' : 'No active lobby data'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                {isRu
                  ? 'Запустите матч в Dota 2 (стадия пиков) или скопируйте в консоли команду status и нажмите кнопку ниже.'
                  : 'Start a Dota 2 match (draft phase) or run status in game console and paste below.'}
              </p>
              <button
                onClick={handleParseClipboard}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Clipboard className="w-4 h-4" />
                <span>{isRu ? 'Вставить консольный status' : 'Paste console status'}</span>
              </button>
            </div>
          ) : !hasSuspicious && !forceShowAll ? (
            /* All Normal / Clean Screen */
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-white tracking-wide">
                {isRu ? '🟢 СМУРФЫ НЕ ОБНАРУЖЕНЫ' : '🟢 NO SMURFS DETECTED'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                {isRu
                  ? `Проверено: ${enemies.length} противников · Подозрительных игроков: 0`
                  : `Checked: ${enemies.length} opponents · Suspicious: 0`}
              </p>
              <button
                onClick={() => setForceShowAll(true)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition"
              >
                {isRu ? 'Показать список игроков' : 'View player roster'}
              </button>
            </div>
          ) : currentEnemy ? (
            /* Player Dossier Card (Fast 5-second reading) */
            <div className="space-y-4">
              {/* Opponent Carousel Selector */}
              <div className="flex items-center justify-between bg-black/30 p-1.5 rounded-xl border border-white/5">
                <button
                  onClick={() =>
                    setSelectedEnemyIndex((prev) =>
                      prev > 0 ? prev - 1 : enemies.length - 1
                    )
                  }
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                  title="Предыдущий игрок"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {enemies.map((e, idx) => {
                    const isSelected = idx === selectedEnemyIndex;
                    const level = e.smurfAnalysis.suspicionLevel;
                    let dotColor = 'bg-emerald-400';
                    if (level === 'high_smurf') dotColor = 'bg-red-500 animate-pulse';
                    else if (level === 'high_suspicion') dotColor = 'bg-amber-500';
                    else if (level === 'suspicious') dotColor = 'bg-yellow-400';

                    return (
                      <button
                        key={e.accountId || idx}
                        onClick={() => setSelectedEnemyIndex(idx)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-white/15 text-white border border-white/20'
                            : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className="truncate max-w-[80px]">
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
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                  title="Следующий игрок"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Suspicion Alert Banner */}
              <div
                className={`px-4 py-2.5 rounded-xl border flex items-center justify-between ${
                  currentEnemy.smurfAnalysis.suspicionLevel === 'high_smurf'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : currentEnemy.smurfAnalysis.suspicionLevel === 'high_suspicion'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : currentEnemy.smurfAnalysis.suspicionLevel === 'suspicious'
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {currentEnemy.smurfAnalysis.suspicionLevel === 'clean' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span className="text-xs font-black tracking-wider uppercase">
                    {currentEnemy.smurfAnalysis.summaryHeadline ||
                      (isRu ? 'ПОДОЗРИТЕЛЬНЫХ ПРИЗНАКОВ НЕ НАЙДЕНО' : 'CLEAN ACCOUNT')}
                  </span>
                </div>
                <span className="text-[11px] font-bold opacity-80">
                  {isRu
                    ? `Шанс: ${currentEnemy.smurfAnalysis.smurfChancePercent}%`
                    : `Chance: ${currentEnemy.smurfAnalysis.smurfChancePercent}%`}
                </span>
              </div>

              {/* Player Identity Row */}
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <img
                    src={currentEnemy.avatar}
                    alt={currentEnemy.name}
                    className="w-10 h-10 rounded-xl border border-white/10 object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {currentEnemy.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <button
                        onClick={() => copyToClipboard(currentEnemy.accountId)}
                        className="text-[11px] text-slate-400 hover:text-cyan-400 transition flex items-center gap-1 font-mono"
                        title="Копировать ID"
                      >
                        <span>ID: {currentEnemy.accountId}</span>
                        {copiedId === currentEnemy.accountId ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-60" />
                        )}
                      </button>
                      {currentEnemy.profileUrl && (
                        <a
                          href={currentEnemy.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-white"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-white">
                    {currentEnemy.rankName || (isRu ? 'Без ранга' : 'Unranked')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    MMR: <span className="font-semibold text-slate-200">{currentEnemy.mmrDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Mode Winrates Grid (Ranked, Turbo, All Pick) */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Ranked */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ranked
                  </div>
                  <div
                    className={`text-base font-black mt-0.5 ${
                      currentEnemy.rankedStats.winrate !== null &&
                      currentEnemy.rankedStats.winrate >= 60
                        ? 'text-amber-400'
                        : 'text-white'
                    }`}
                  >
                    {currentEnemy.rankedStats.formatted}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {currentEnemy.rankedStats.detailText}
                  </div>
                </div>

                {/* Turbo */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Turbo
                  </div>
                  <div
                    className={`text-base font-black mt-0.5 ${
                      currentEnemy.turboStats.winrate !== null &&
                      currentEnemy.turboStats.winrate >= 60
                        ? 'text-cyan-400'
                        : 'text-white'
                    }`}
                  >
                    {currentEnemy.turboStats.formatted}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {currentEnemy.turboStats.detailText}
                  </div>
                </div>

                {/* All Pick */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    All Pick
                  </div>
                  <div
                    className={`text-base font-black mt-0.5 ${
                      currentEnemy.allPickStats.winrate !== null &&
                      currentEnemy.allPickStats.winrate >= 60
                        ? 'text-emerald-400'
                        : 'text-white'
                    }`}
                  >
                    {currentEnemy.allPickStats.formatted}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {currentEnemy.allPickStats.detailText}
                  </div>
                </div>
              </div>

              {/* Signatures (Top 3-4 heroes) */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {isRu ? 'Сигнатурные герои' : 'Signature Heroes'}
                </div>
                {currentEnemy.topHeroes && currentEnemy.topHeroes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {currentEnemy.topHeroes.slice(0, 4).map((h) => (
                      <div
                        key={h.heroId}
                        className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/5"
                      >
                        <img
                          src={h.heroIcon}
                          alt={h.heroName}
                          className="w-7 h-7 rounded object-cover border border-white/10"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate">
                            {h.heroName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {h.games} {isRu ? 'игр' : 'games'} ·{' '}
                            <span
                              className={
                                h.winrate >= 65
                                  ? 'text-amber-400 font-bold'
                                  : 'text-slate-300 font-medium'
                              }
                            >
                              {h.winrate}% WR
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">
                    {isRu ? 'Недостаточно игр на сигнатурах' : 'Not enough signature games'}
                  </div>
                )}
              </div>

              {/* Why Suspicious? (Reasons list) */}
              {currentEnemy.smurfAnalysis.reasons &&
                currentEnemy.smurfAnalysis.reasons.length > 0 && (
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      {isRu ? 'Причины подозрения' : 'Reasons for suspicion'}
                    </div>
                    <ul className="space-y-1">
                      {currentEnemy.smurfAnalysis.reasons.map((r, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-300 flex items-start gap-1.5"
                        >
                          <span className="text-amber-400 leading-none mt-1">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Bottom Footer: Confidence & Details Toggle */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
                <div>
                  {isRu ? 'Надёжность анализа:' : 'Analysis confidence:'}{' '}
                  <span className="text-slate-300 font-bold">
                    {currentEnemy.smurfAnalysis.confidenceScore}%
                  </span>
                </div>

                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
                >
                  {showDetails
                    ? (isRu ? 'Скрыть подробности' : 'Hide details')
                    : (isRu ? 'Открыть подробности' : 'View details')}
                </button>
              </div>

              {/* Expanded Details / Debug View */}
              {showDetails && (
                <div className="mt-3 p-3 bg-black/40 rounded-xl border border-white/10 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{isRu ? 'Последние матчи' : 'Recent Matches'}</span>
                    <span className="text-[10px] text-slate-400">
                      {currentEnemy.recentMatches.length} {isRu ? 'матчей' : 'matches'}
                    </span>
                  </div>

                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {currentEnemy.recentMatches.slice(0, 10).map((m) => (
                      <div
                        key={m.matchId}
                        className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white/[0.02] border border-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={m.heroIcon}
                            alt={m.heroName}
                            className="w-4 h-4 rounded object-cover"
                          />
                          <span className="text-slate-300 font-medium">
                            {m.heroName}
                          </span>
                          <span
                            className={`font-bold ${
                              m.won ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {m.won ? (isRu ? 'Победа' : 'Win') : (isRu ? 'Поражение' : 'Loss')}
                          </span>
                        </div>
                        <div className="text-slate-400 font-mono">{m.kda}</div>
                      </div>
                    ))}
                  </div>

                  {/* Debug Mode details table */}
                  {debugMode && currentEnemy.debugMatches && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold mb-1.5 flex items-center gap-1">
                        <Bug className="w-3 h-3" />
                        <span>Debug Mode: Raw Match Metadata</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto text-[10px] font-mono text-slate-400 space-y-1 bg-black/60 p-2 rounded border border-white/5">
                        {currentEnemy.debugMatches.map((dm) => (
                          <div key={dm.matchId} className="border-b border-white/5 pb-0.5">
                            ID: <span className="text-slate-200">{dm.matchId}</span> | GM:{' '}
                            <span className="text-amber-400">{dm.gameMode}</span> | Lobby:{' '}
                            <span className="text-cyan-400">{dm.lobbyType}</span> | Won:{' '}
                            <span className={dm.won ? 'text-emerald-400' : 'text-red-400'}>
                              {dm.won ? 'true' : 'false'}
                            </span>
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
