import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Star,
  FolderOpen,
  Share2,
  ExternalLink,
  Trash2,
  Clock,
  HardDrive,
  Calendar,
  Layers,
  CheckCircle2,
  Square,
  Trophy,
  Camera,
  Sparkles,
  Maximize2,
  X,
  Lock,
  Download,
  Gamepad2,
  RefreshCw,
  Target,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Game, SessionRecord, CollectionRecord, AchievementItem } from '../../shared/types';
import { translations, Language } from '../i18n/translations';
import { SteamGridModal } from '../components/SteamGridModal';
import { soundEngine } from '../audio/soundEngine';

interface GameDetailPageProps {
  game: Game;
  collections: CollectionRecord[];
  onBack: () => void;
  onPlay: (game: Game) => void;
  onToggleFavorite: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onCreateShortcut: (id: string) => void;
  onAddToCollection: (collectionId: string, gameId: string) => void;
  onRemoveFromCollection: (collectionId: string, gameId: string) => void;
  onGameUpdated?: (updatedGame: Game) => void;
  onToast?: (type: 'info' | 'success' | 'warning' | 'error' | 'progress', title: string, message?: string) => void;
  language: Language;
}

export const GameDetailPage: React.FC<GameDetailPageProps> = ({
  game,
  collections,
  onBack,
  onPlay,
  onToggleFavorite,
  onOpenFolder,
  onCreateShortcut,
  onAddToCollection,
  onRemoveFromCollection,
  onGameUpdated,
  onToast,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'screenshots' | 'notes'>('overview');
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [achievements, setAchievements] = useState<{ total: number; unlocked: number; items: AchievementItem[] } | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // F3: Playtime Goal
  const [goalInput, setGoalInput] = useState<string>(game.goal ? String(game.goal) : '');
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // F5: Session History
  const [isSessionsOpen, setIsSessionsOpen] = useState(true);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  useEffect(() => {
    setGoalInput(game.goal ? String(game.goal) : '');
  }, [game.goal]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingSessions(true);
    window.stormPlay.stats.getSessionsByGame(game.id, 20)
      .then((data) => {
        if (isMounted) setSessions(data || []);
      })
      .catch((err) => {
        console.error('Failed to load session history:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSessions(false);
      });
    return () => {
      isMounted = false;
    };
  }, [game.id]);

  const handleSaveGoal = async () => {
    const val = parseFloat(goalInput);
    const targetGoal = isNaN(val) || val <= 0 ? undefined : val;
    try {
      await window.stormPlay.games.update(game.id, { goal: targetGoal });
      if (onGameUpdated) onGameUpdated({ ...game, goal: targetGoal });
      setIsEditingGoal(false);
      if (targetGoal) {
        const currentHours = game.playtimeMinutes / 60;
        if (currentHours >= targetGoal && onToast) {
          onToast('success', language === 'ru' ? 'Цель достигнута! 🏆' : 'Goal Achieved! 🏆', `${currentHours.toFixed(1)} / ${targetGoal}h`);
        } else if (onToast) {
          onToast('info', language === 'ru' ? 'Цель по времени установлена' : 'Playtime goal saved', `${targetGoal}h`);
        }
      }
    } catch (err) {
      console.error('Failed to update playtime goal:', err);
    }
  };

  const [coverError, setCoverError] = useState(false);
  const [isSearchingCover, setIsSearchingCover] = useState(false);
  const searchAttemptedRef = React.useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setCoverError(false);

    // Only search automatically once per game ID if no cover exists
    if (!game.artwork.cover && searchAttemptedRef.current !== game.id) {
      searchAttemptedRef.current = game.id;
      setIsSearchingCover(true);

      const timeoutId = setTimeout(() => {
        if (isMounted) setIsSearchingCover(false);
      }, 5000);

      window.stormPlay.steamGrid.search(game.name, 'cover')
        .then(async (results) => {
          if (!isMounted) return;
          if (results && results.length > 0) {
            const best = results[0];
            try {
              const updated = await window.stormPlay.steamGrid.applyArtwork(game.id, 'cover', best.url);
              if (isMounted && onGameUpdated) onGameUpdated(updated);
            } catch {
              if (isMounted) setCoverError(true);
            }
          }
        })
        .catch(() => {
          if (isMounted) setCoverError(true);
        })
        .finally(() => {
          clearTimeout(timeoutId);
          if (isMounted) setIsSearchingCover(false);
        });

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    } else {
      setIsSearchingCover(false);
    }

    return () => {
      isMounted = false;
    };
  }, [game.id, game.name, game.artwork.cover]);

  const t = translations[language].gameDetail;

  useEffect(() => {
    if (game.steamAppId) {
      window.stormPlay.achievements.get(game.steamAppId).then((items) => {
        if (Array.isArray(items)) {
          const unlocked = items.filter(a => a.unlocked).length;
          setAchievements({ total: items.length, unlocked, items });
        } else {
          setAchievements(items as any);
        }
      }).catch(() => {});
      window.stormPlay.screenshots.get(game.steamAppId).then(setScreenshots).catch(() => {});
    } else {
      setAchievements(null);
      setScreenshots([]);
    }
  }, [game.id, game.steamAppId]);

  const formatHours = (mins: number) => {
    if (!mins) return t.never;
    if (mins < 60) return `${mins} ${translations[language].gameCard.minutes}`;
    return `${(mins / 60).toFixed(1)} ${translations[language].gameCard.hours}`;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '—';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const coverImage = game.artwork.hero || game.artwork.cover;

  return (
    <div className="view-transition" style={{ position: 'relative', minHeight: '100%', paddingBottom: '60px' }}>
      {coverImage && !coverError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '480px',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0
          }}
        >
          <img
            src={coverImage}
            alt=""
            onError={e => (e.currentTarget.style.display = 'none')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.35) blur(2px)',
              transform: 'scale(1.02)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(6,6,8,0.2) 0%, rgba(6,6,8,0.85) 75%, var(--bg-app) 100%)'
            }}
          />
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, padding: '32px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <button
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '28px',
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.06)'
          }}
        >
          <ArrowLeft size={16} />
          <span>{t.back}</span>
        </button>

        <div style={{ display: 'flex', gap: '36px', marginBottom: '32px', alignItems: 'flex-end' }}>
          <div
            style={{
              position: 'relative',
              width: '220px',
              height: '330px',
              flexShrink: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              border: '1px solid var(--border-highlight)',
              background: '#07070a'
            }}
          >
            {(!game.artwork.cover && !game.artwork.hero) || coverError ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
                  padding: '24px 16px',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid var(--border-highlight)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                    marginBottom: '16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
                  }}
                >
                  <Gamepad2 size={32} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3, padding: '0 8px' }}>
                  {game.name}
                </div>
                {isSearchingCover ? (
                  <div style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                    <RefreshCw size={12} className="spin" />
                    <span>{language === 'ru' ? 'Поиск обложки...' : 'Finding artwork...'}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {language === 'ru' ? 'Обложка отсутствует' : 'No artwork available'}
                  </div>
                )}
              </div>
            ) : (
              <img
                src={game.artwork.cover || game.artwork.hero}
                alt=""
                onError={() => {
                  setCoverError(true);
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsGridModalOpen(true);
              }}
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                right: '10px',
                padding: '7px 10px',
                background: 'rgba(10, 10, 14, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-highlight)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'background 150ms ease'
              }}
            >
              <Sparkles size={12} />
              <span>{language === 'ru' ? 'Сменить обложку' : 'Change Artwork'}</span>
            </button>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: game.source === 'steam' ? 'rgba(56, 189, 248, 0.15)' : game.source === 'epic' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                  color: game.source === 'steam' ? 'var(--accent-primary)' : game.source === 'epic' ? '#F59E0B' : '#A855F7',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {game.source.toUpperCase()}
              </span>
              {game.installed ? (
                <span style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  <CheckCircle2 size={13} />
                  <span>{language === 'ru' ? 'Установлена' : 'Installed'}</span>
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  <Download size={13} />
                  <span>{language === 'ru' ? 'Не установлена' : 'Not installed'}</span>
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: '36px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 20px 0',
                letterSpacing: '-0.02em',
                lineHeight: 1.15
              }}
            >
              {game.name}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  soundEngine.playLaunch();
                  onPlay(game);
                }}
                className="btn btn-primary"
                style={{
                  padding: '13px 32px',
                  fontSize: '15px',
                  borderRadius: '30px'
                }}
              >
                {game.installed ? (
                  <>
                    <Play size={18} fill="currentColor" />
                    <span>{t.playNow}</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>{language === 'ru' ? 'Установить' : 'Install'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  onToggleFavorite(game.id);
                }}
                className="btn btn-secondary"
                style={{
                  padding: '12px 18px',
                  borderRadius: '30px',
                  color: game.favorite ? '#F59E0B' : 'var(--text-secondary)'
                }}
                title={game.favorite ? t.inFavorites : t.addToFavorites}
              >
                <Star size={17} fill={game.favorite ? '#F59E0B' : 'none'} />
                <span>{game.favorite ? t.inFavorites : t.addToFavorites}</span>
              </button>

              {game.installed && (
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onOpenFolder(game.id);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '12px 18px', borderRadius: '30px' }}
                  title={t.openFolder}
                >
                  <FolderOpen size={16} />
                  <span>{t.openFolder}</span>
                </button>
              )}

              <button
                onClick={() => {
                  soundEngine.playClick();
                  onCreateShortcut(game.id);
                }}
                className="btn btn-secondary"
                style={{ padding: '12px 18px', borderRadius: '30px' }}
                title={t.createShortcut}
              >
                <Share2 size={16} />
                <span>{t.createShortcut}</span>
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '28px', paddingBottom: '12px' }}>
          <button
            onClick={() => {
              soundEngine.playTab();
              setActiveTab('overview');
            }}
            style={{
              background: activeTab === 'overview' ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: activeTab === 'overview' ? '1px solid var(--border-highlight)' : '1px solid transparent',
              color: activeTab === 'overview' ? '#fff' : 'var(--text-secondary)',
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={15} />
            <span>{language === 'ru' ? 'Обзор' : 'Overview'}</span>
          </button>

          {game.steamAppId && (
            <>
              <button
                onClick={() => {
                  soundEngine.playTab();
                  setActiveTab('achievements');
                }}
                style={{
                  background: activeTab === 'achievements' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: activeTab === 'achievements' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  color: activeTab === 'achievements' ? '#fff' : 'var(--text-secondary)',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trophy size={15}  />
                <span>{language === 'ru' ? 'Достижения' : 'Achievements'}</span>
                {achievements && achievements.total > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({achievements.unlocked}/{achievements.total})</span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEngine.playTab();
                  setActiveTab('screenshots');
                }}
                style={{
                  background: activeTab === 'screenshots' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: activeTab === 'screenshots' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  color: activeTab === 'screenshots' ? '#fff' : 'var(--text-secondary)',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Camera size={15}  />
                <span>{language === 'ru' ? 'Скриншоты' : 'Screenshots'}</span>
                {screenshots.length > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({screenshots.length})</span>
                )}
              </button>
            </>
          )}

          <button
            onClick={() => {
              soundEngine.playTab();
              setActiveTab('notes');
            }}
            style={{
              background: activeTab === 'notes' ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: activeTab === 'notes' ? '1px solid var(--border-highlight)' : '1px solid transparent',
              color: activeTab === 'notes' ? '#fff' : 'var(--text-secondary)',
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Square size={15}  />
            <span>{language === 'ru' ? 'Заметки и Теги' : 'Notes & Tags'}</span>
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="view-transition">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div className="glass-section" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <Clock size={16}  />
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{t.playtime}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatHours(game.playtimeMinutes)}
                </div>
              </div>

              <div className="glass-section" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <Calendar size={16}  />
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{t.lastPlayed}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {game.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString() : t.never}
                </div>
              </div>

              <div className="glass-section" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <HardDrive size={16}  />
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{t.sizeOnDisk}</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatBytes(game.sizeOnDisk)}
                </div>
              </div>
            </div>

            {/* F3: Playtime Goal */}
            <div className="glass-section" style={{ padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {language === 'ru' ? 'Цель по времени игры' : 'Playtime Goal'}
                  </span>
                </div>

                {isEditingGoal ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="glass-input"
                      placeholder={language === 'ru' ? 'Часы' : 'Hours'}
                      value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveGoal()}
                      style={{ width: '80px', padding: '4px 8px', fontSize: '12px' }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveGoal}
                      className="btn btn-primary"
                      style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                    >
                      {language === 'ru' ? 'Сохранить' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setGoalInput(game.goal ? String(game.goal) : '');
                        setIsEditingGoal(false);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                    >
                      {language === 'ru' ? 'Отмена' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingGoal(true)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '16px' }}
                  >
                    {game.goal ? (language === 'ru' ? 'Изменить цель' : 'Edit Goal') : (language === 'ru' ? '+ Задать цель' : '+ Set Goal')}
                  </button>
                )}
              </div>

              {game.goal ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {(game.playtimeMinutes / 60).toFixed(1)} / {game.goal} {language === 'ru' ? 'ч' : 'hrs'}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: (game.playtimeMinutes / 60) >= game.goal ? '#10B981' : 'var(--accent-primary)' }}>
                      {Math.min(100, Math.round(((game.playtimeMinutes / 60) / game.goal) * 100))}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      className="glass-progress-bar"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((game.playtimeMinutes / 60) / game.goal) * 100))}%`,
                        height: '100%',
                        background: (game.playtimeMinutes / 60) >= game.goal ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, var(--accent-primary), #fff)',
                        borderRadius: '4px',
                        transition: 'width 240ms cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    />
                  </div>
                  {(game.playtimeMinutes / 60) >= game.goal && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} />
                      <span>{language === 'ru' ? 'Поздравляем! Цель достигнута!' : 'Congratulations! Goal achieved!'}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {language === 'ru' ? 'Установите целевое количество часов для этой игры, чтобы отслеживать свой прогресс.' : 'Set a target playtime in hours for this game to track your progress.'}
                </div>
              )}
            </div>

            {/* F5: Session History Timeline */}
            <div className="glass-section" style={{ padding: '20px', marginBottom: '24px' }}>
              <div
                onClick={() => setIsSessionsOpen(!isSessionsOpen)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {language === 'ru' ? 'История игровых сессий' : 'Session History'}
                  </span>
                  {sessions.length > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px' }}>
                      {sessions.length}
                    </span>
                  )}
                </div>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {isSessionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {isSessionsOpen && (
                <div style={{ marginTop: '16px' }}>
                  {isLoadingSessions ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0' }}>
                      {language === 'ru' ? 'Загрузка истории сессий...' : 'Loading session history...'}
                    </div>
                  ) : sessions.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0' }}>
                      {language === 'ru' ? 'История сессий для этой игры пока отсутствует.' : 'No recorded sessions for this game yet.'}
                    </div>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid rgba(255,255,255,0.08)', marginLeft: '8px' }}>
                      {sessions.map((sess, idx) => {
                        const start = new Date(sess.startTime);
                        const end = sess.endTime ? new Date(sess.endTime) : null;
                        const dateStr = start.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                        const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (language === 'ru' ? 'Сейчас' : 'Now')}`;
                        const mins = sess.durationMinutes || (end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000)) : 0);
                        const durStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;

                        return (
                          <div key={sess.id || idx} style={{ position: 'relative', marginBottom: idx === sessions.length - 1 ? 0 : '16px' }}>
                            <div
                              style={{
                                position: 'absolute',
                                left: '-25px',
                                top: '5px',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: idx === 0 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.3)',
                                boxShadow: idx === 0 ? '0 0 8px var(--accent-primary)' : 'none'
                              }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {dateStr}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {timeStr}
                                </div>
                              </div>
                              <span
                                className="glass-chip"
                                style={{
                                  fontSize: '11px',
                                  padding: '3px 10px',
                                  borderRadius: '12px',
                                  fontWeight: 600,
                                  color: 'var(--text-primary)',
                                  background: 'rgba(255,255,255,0.06)'
                                }}
                              >
                                {durStr}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="glass-section" style={{ padding: '20px', marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {translations[language].settings.steamPath}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', wordBreak: 'break-all', fontFamily: 'Consolas, monospace' }}>
                {game.installPath}
              </div>
              {game.executable && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Consolas, monospace' }}>
                  EXE: {game.executable}
                </div>
              )}
            </div>

            <div className="glass-section" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {translations[language].collections.title}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {collections.map(col => {
                  const inCol = col.gameIds.includes(game.id);
                  return (
                    <button
                      key={col.id}
                      onClick={() => {
                        soundEngine.playClick();
                        inCol ? onRemoveFromCollection(col.id, game.id) : onAddToCollection(col.id, game.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: inCol ? 'var(--bg-glass-hover)' : 'var(--bg-glass)',
                        border: inCol ? `1px solid ${col.color || 'var(--accent-primary)'}` : '1px solid var(--border-subtle)',
                        color: inCol ? 'var(--accent-primary)' : 'var(--text-muted)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: col.color || 'var(--accent-primary)' }} />
                      <span>{col.name}</span>
                      {inCol && <span style={{ fontSize: '10px' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="view-transition">
            {achievements && achievements.total > 0 ? (
              <div>
                <div className="glass-section" style={{ padding: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {language === 'ru' ? 'Прогресс достижений' : 'Achievement Progress'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {achievements.unlocked} / {achievements.total} ({Math.round((achievements.unlocked / achievements.total) * 100)}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(achievements.unlocked / achievements.total) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #38BDF8, #10B981)',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {achievements.items.map(item => (
                    <div
                      key={item.id}
                      className="glass-card"
                      style={{
                        padding: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        borderRadius: '10px',
                        background: item.unlocked ? 'var(--bg-glass-hover)' : 'var(--bg-glass)',
                        opacity: item.unlocked ? 1 : 0.55
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          background: 'rgba(0,0,0,0.4)',
                          border: item.unlocked ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {item.icon ? (
                          <img src={item.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : item.unlocked ? (
                          <Trophy size={20}  />
                        ) : (
                          <Lock size={18} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </div>
                        {item.description && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-section" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Trophy size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {language === 'ru' ? 'Достижения не найдены или профиль Steam закрыт' : 'No achievements available or profile is private'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'screenshots' && (
          <div className="view-transition">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {language === 'ru' ? 'Скриншоты Steam' : 'Steam Screenshots'}
              </h3>
              {game.steamAppId && (
                <button
                  onClick={() => window.stormPlay.screenshots.openFolder(game.steamAppId!)}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <FolderOpen size={14} />
                  <span>{language === 'ru' ? 'Открыть папку' : 'Open in Explorer'}</span>
                </button>
              )}
            </div>

            {screenshots.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {screenshots.map((sUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxImg(sUrl)}
                    style={{
                      position: 'relative',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      aspectRatio: '16/9',
                      cursor: 'pointer',
                      border: '1px solid var(--border-subtle)',
                      background: '#07070a'
                    }}
                    className="glass-card"
                  >
                    <img src={sUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-section" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Camera size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {language === 'ru' ? 'В этой игре пока нет скриншотов' : 'No screenshots captured for this game yet'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
                  {language === 'ru' ? 'Сделайте скриншот в игре клавишей F12 в Steam' : 'Press F12 in-game via Steam overlay to take screenshots'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="view-transition">
            <div className="glass-section" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {language === 'ru' ? 'Быстрые теги' : 'Quick Tags'}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
                {['пройдено', 'хочу поиграть', 'мультиплеер', 'кооператив', 'сложно'].map(tag => {
                  const isActive = game.tags?.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={async () => {
                        const tags = game.tags || [];
                        const newTags = isActive ? tags.filter(t => t !== tag) : [...tags, tag];
                        const updated = await window.stormPlay.games.update(game.id, { tags: newTags });
                        onGameUpdated?.(updated);
                      }}
                      style={{
                        background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-glass)',
                        color: isActive ? '#38BDF8' : 'var(--text-secondary)',
                        border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {language === 'ru' ? 'Заметки (ревью, чит-коды и т.д.)' : 'Notes (Reviews, cheats, etc)'}
                </h3>
              </div>
              
              <textarea
                className="glass-input"
                style={{ width: '100%', height: '200px', resize: 'vertical', fontSize: '14px', lineHeight: 1.5 }}
                placeholder={language === 'ru' ? 'Напишите здесь свои заметки об игре...' : 'Write your notes about the game here...'}
                defaultValue={game.notes || ''}
                onBlur={async (e) => {
                  const newNotes = e.target.value;
                  if (newNotes !== game.notes) {
                    const updated = await window.stormPlay.games.update(game.id, { notes: newNotes });
                    onGameUpdated?.(updated);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {lightboxImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={() => setLightboxImg(null)}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <X size={28} />
          </button>
          <img
            src={lightboxImg}
            alt="Screenshot"
            style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 12px 48px rgba(0,0,0,0.8)' }}
          />
        </div>
      )}

      {isGridModalOpen && (
        <SteamGridModal
          game={game}
          isOpen={isGridModalOpen}
          onClose={() => setIsGridModalOpen(false)}
          onArtworkUpdated={(updated) => {
            onGameUpdated?.(updated);
          }}
          language={language}
        />
      )}
    </div>
  );
};
