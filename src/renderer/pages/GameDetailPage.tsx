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
  Download
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
  language
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'screenshots'>('overview');
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [achievements, setAchievements] = useState<{ total: number; unlocked: number; items: AchievementItem[] } | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const t = translations[language].gameDetail;

  useEffect(() => {
    if (game.steamAppId) {
      window.stormPlay.achievements.get(game.steamAppId).then(setAchievements).catch(() => {});
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
      {coverImage && (
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
            <img
              src={game.artwork.cover || game.artwork.hero || ''}
              alt={game.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
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
                padding: '6px 10px',
                background: 'rgba(10, 10, 14, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-highlight)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={12} style={{ color: 'var(--accent-primary)' }} />
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
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  <Download size={13} />
                  <span>{language === 'ru' ? 'Не установлена' : 'Not installed'}</span>
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: '36px',
                fontWeight: 800,
                color: '#fff',
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
                  borderRadius: '30px',
                  boxShadow: '0 8px 24px rgba(56, 189, 248, 0.35)'
                }}
              >
                {game.installed ? (
                  <>
                    <Play size={18} fill="#000" />
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
                <Trophy size={15} style={{ color: '#F59E0B' }} />
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
                <Camera size={15} style={{ color: 'var(--accent-primary)' }} />
                <span>{language === 'ru' ? 'Скриншоты' : 'Screenshots'}</span>
                {screenshots.length > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({screenshots.length})</span>
                )}
              </button>
            </>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="view-transition">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div className="glass-section" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{t.playtime}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
                  {formatHours(game.playtimeMinutes)}
                </div>
              </div>

              <div className="glass-section" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <Calendar size={16} style={{ color: '#10B981' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{t.lastPlayed}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                  {game.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString() : t.never}
                </div>
              </div>

              <div className="glass-section" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <HardDrive size={16} style={{ color: '#F59E0B' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{t.sizeOnDisk}</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                  {formatBytes(game.sizeOnDisk)}
                </div>
              </div>
            </div>

            <div className="glass-section" style={{ padding: '20px', marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                {translations[language].settings.steamPath}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', wordBreak: 'break-all', fontFamily: 'Consolas, monospace' }}>
                {game.installPath}
              </div>
              {game.executable && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Consolas, monospace' }}>
                  EXE: {game.executable}
                </div>
              )}
            </div>

            <div className="glass-section" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
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
                        background: inCol ? 'var(--bg-glass-hover)' : 'rgba(255,255,255,0.03)',
                        border: inCol ? `1px solid ${col.color || 'var(--accent-primary)'}` : '1px solid var(--border-subtle)',
                        color: inCol ? '#fff' : 'var(--text-muted)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: col.color || '#fff' }} />
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
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {achievements.items.map(item => (
                    <div
                      key={item.id}
                      className="glass-section"
                      style={{
                        padding: '16px',
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'center',
                        opacity: item.unlocked ? 1 : 0.45
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          background: '#0a0a0e',
                          border: item.unlocked ? '1px solid #10B981' : '1px solid var(--border-subtle)',
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
                          <Trophy size={20} style={{ color: '#10B981' }} />
                        ) : (
                          <Lock size={18} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
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
