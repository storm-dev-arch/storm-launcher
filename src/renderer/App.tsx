import React, { useState, useEffect, useCallback } from 'react';
import type { Game, CollectionRecord, LauncherSettings, ScannerProgress, CandidateExe } from '../shared/types';
import { TitleBar } from './components/TitleBar';
import { Sidebar, PageId } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { GameContextMenu } from './components/GameContextMenu';
import { CommandPalette } from './components/CommandPalette';
import { MiniModeModal } from './components/MiniModeModal';
import { AddGameModal } from './components/AddGameModal';
import { ScanGamesModal } from './components/ScanGamesModal';
import { WhatShouldIPlayModal } from './components/WhatShouldIPlayModal';
import { BackgroundShader } from './components/BackgroundShader';
import { SteamGridModal } from './components/SteamGridModal';
import { soundEngine } from './audio/soundEngine';
import { translations, Language } from './i18n/translations';

import { OverviewPage } from './pages/OverviewPage';
import { LibraryPage } from './pages/LibraryPage';
import { GameDetailPage } from './pages/GameDetailPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { OnboardingModal } from './pages/OnboardingModal';

export const App: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [settings, setSettings] = useState<LauncherSettings | null>(null);
  const [language, setLanguage] = useState<Language>('ru');
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [steamStatus, setSteamStatus] = useState<{ installed: boolean; libraries: string[] }>({
    installed: false,
    libraries: []
  });
  const [scanProgress, setScanProgress] = useState<ScannerProgress | undefined>(undefined);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isMiniOpen, setIsMiniOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isRandomOpen, setIsRandomOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [steamGridGame, setSteamGridGame] = useState<Game | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; game: Game } | null>(null);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message?: string, duration?: number) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshGames = useCallback(async () => {
    try {
      const allGames = await window.stormPlay.games.getAll();
      setGames(allGames);
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  }, []);

  const refreshCollections = useCallback(async () => {
    try {
      const cols = await window.stormPlay.collections.getAll();
      setCollections(cols);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [appSettings, steam, allGames, cols] = await Promise.all([
          window.stormPlay.settings.get(),
          window.stormPlay.scanner.getSteamStatus(),
          window.stormPlay.games.getAll(),
          window.stormPlay.collections.getAll()
        ]);

        setSettings(appSettings);
        if (appSettings.language) {
          setLanguage(appSettings.language);
        }

        soundEngine.setConfig(
          appSettings.soundEnabled !== false,
          appSettings.soundVolume ?? 0.75
        );

        setSteamStatus({
          installed: steam.installed,
          libraries: steam.libraries || []
        });
        setGames(allGames);
        setCollections(cols);

        window.stormPlay.scanner.scanMultiLaunchers().then(updated => {
          if (updated && updated.length > 0) {
            setGames(updated);
          }
        }).catch(err => console.warn('Multi-launcher startup scan:', err));

        if (appSettings.theme) {
          document.documentElement.setAttribute('data-theme', appSettings.theme);
          document.body.setAttribute('data-theme', appSettings.theme);
          document.body.className = `theme-${appSettings.theme}`;
        }

        if (!appSettings.firstLaunchDone) {
          setIsOnboardingOpen(true);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };

    init();
  }, []);

  const handleUpdateTheme = (themeName: string) => {
    setSettings(prev => prev ? { ...prev, theme: themeName as LauncherSettings['theme'] } : null);
    document.documentElement.setAttribute('data-theme', themeName);
    document.body.setAttribute('data-theme', themeName);
    document.body.className = `theme-${themeName}`;
  };

  const handleToggleLanguage = async () => {
    const nextLang: Language = language === 'ru' ? 'en' : 'ru';
    setLanguage(nextLang);
    if (settings) {
      setSettings(prev => prev ? { ...prev, language: nextLang } : null);
      await window.stormPlay.settings.update({ language: nextLang });
    }
  };

  const handleUpdateLanguage = async (newLang: Language) => {
    setLanguage(newLang);
    if (settings) {
      setSettings(prev => prev ? { ...prev, language: newLang } : null);
      await window.stormPlay.settings.update({ language: newLang });
    }
  };

  useEffect(() => {
    const unsubProgress = window.stormPlay.events.onScanProgress((prog) => {
      setScanProgress(prog);
    });

    const unsubLaunch = window.stormPlay.events.onGameLaunched((game) => {
      const t = translations[language].toasts;
      addToast('info', t.launching, game.name, 3000);
      refreshGames();
    });

    const unsubStopped = window.stormPlay.events.onGameStopped((data) => {
      const t = translations[language].toasts;
      const mins = Math.max(1, Math.round(data.session?.durationMinutes || 0));
      addToast('info', t.sessionEnded, `${t.playedFor} ${mins}m`, 4000);
      refreshGames();
    });

    const unsubUpdated = window.stormPlay.events.onGamesUpdated((updatedGames) => {
      setGames(updatedGames);
    });

    return () => {
      unsubProgress();
      unsubLaunch();
      unsubStopped();
      unsubUpdated();
    };
  }, [addToast, refreshGames, language]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'KeyK') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      } else if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        setIsMiniOpen(prev => !prev);
      } else if (e.code === 'Escape') {
        if (contextMenu) {
          setContextMenu(null);
        } else if (isCmdOpen) {
          setIsCmdOpen(false);
        } else if (isMiniOpen) {
          setIsMiniOpen(false);
        } else if (isAddOpen) {
          setIsAddOpen(false);
        } else if (isScanOpen) {
          setIsScanOpen(false);
        } else if (isRandomOpen) {
          setIsRandomOpen(false);
        } else if (selectedGame) {
          setSelectedGame(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextMenu, isCmdOpen, isMiniOpen, isAddOpen, isScanOpen, isRandomOpen, selectedGame]);

  const handlePlayGame = async (game: Game) => {
    soundEngine.playLaunch();
    try {
      const res = await window.stormPlay.games.launch(game.id);
      if (!res.success) {
        addToast('error', 'Launch Failed', res.error || 'Failed to start game');
      }
    } catch (err: any) {
      addToast('error', 'Launch Error', err.message || 'Unknown error occurred');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    soundEngine.playClick();
    try {
      await window.stormPlay.games.toggleFavorite(id);
      await refreshGames();
      if (selectedGame && selectedGame.id === id) {
        setSelectedGame(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
      }
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  const handleOpenFolder = async (id: string) => {
    soundEngine.playClick();
    try {
      await window.stormPlay.games.openInstallFolder(id);
    } catch (err) {
      console.error('Open folder failed:', err);
    }
  };

  const handleCreateShortcut = async (id: string) => {
    soundEngine.playClick();
    try {
      const res = await window.stormPlay.games.createDesktopShortcut(id);
      const t = translations[language].toasts;
      if (res.success) {
        addToast('success', t.shortcutCreated, t.shortcutDesc);
      } else {
        addToast('error', 'Shortcut Failed', 'Failed to create shortcut');
      }
    } catch (err: any) {
      addToast('error', 'Shortcut Error', err.message);
    }
  };

  const handleDeleteGame = async (id: string) => {
    soundEngine.playClick();
    try {
      await window.stormPlay.games.delete(id);
      setGames(prev => prev.filter(g => g.id !== id));
      if (selectedGame?.id === id) {
        setSelectedGame(null);
      }
      const t = translations[language].toasts;
      addToast('info', t.gameRemoved);
    } catch (err) {
      console.error('Delete game failed:', err);
    }
  };

  const handleScanSteam = async () => {
    try {
      setScanProgress({
        stage: 'detecting',
        message: language === 'ru' ? 'Синхронизация библиотек (Steam, Epic, GOG)...' : 'Syncing libraries (Steam, Epic, GOG)...',
        librariesFound: steamStatus.libraries.length,
        gamesDetected: games.length,
        gamesInstalled: games.filter(g => g.installed).length
      });
      const result = await window.stormPlay.scanner.syncAll();
      setGames(result.games);
      setScanProgress({
        stage: 'ready',
        message: `${language === 'ru' ? 'Найдено' : 'Discovered'} ${result.games.length} ${language === 'ru' ? 'игр' : 'games'}`,
        librariesFound: result.progress?.librariesFound || steamStatus.libraries.length,
        gamesDetected: result.games.length,
        gamesInstalled: result.games.filter(g => g.installed).length
      });
      setTimeout(() => setScanProgress(undefined), 3500);
      const t = translations[language].toasts;
      addToast(
        'success',
        language === 'ru' ? 'Библиотеки синхронизированы' : 'Libraries Synced',
        `${t.foundGames} ${result.games.length}`
      );
    } catch (err: any) {
      setScanProgress(undefined);
      addToast('error', 'Sync Failed', err.message || 'Scan error');
    }
  };

  const handleSaveCustomGame = async (gameData: Partial<Game>) => {
    try {
      const added = await window.stormPlay.games.addCustom(gameData);
      setGames(prev => [...prev, added]);
      setIsAddOpen(false);
      const t = translations[language].toasts;
      addToast('success', t.gameAdded, added.name);
    } catch (err: any) {
      addToast('error', 'Add Game Failed', err.message);
    }
  };

  const handleImportScannedGames = async (candidates: CandidateExe[]) => {
    try {
      for (const cand of candidates) {
        await window.stormPlay.games.addCustom({
          name: cand.suggestedTitle || cand.name,
          executable: cand.path,
          installPath: cand.folder,
          source: 'custom',
          installed: true
        });
      }
      await refreshGames();
      setIsScanOpen(false);
      addToast('success', 'Folder Scan Complete', `Imported ${candidates.length} games`);
    } catch (err: any) {
      addToast('error', 'Import Failed', err.message);
    }
  };

  const handleCreateCollection = async (name: string, color?: string) => {
    try {
      await window.stormPlay.collections.create(name, color);
      await refreshCollections();
      addToast('success', 'Collection Created', name);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await window.stormPlay.collections.delete(id);
      await refreshCollections();
      addToast('info', 'Collection Deleted');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCollection = async (colId: string, gameId: string) => {
    try {
      await window.stormPlay.collections.addGame(colId, gameId);
      await refreshCollections();
      addToast('success', 'Added to Collection');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromCollection = async (colId: string, gameId: string) => {
    try {
      await window.stormPlay.collections.removeGame(colId, gameId);
      await refreshCollections();
      addToast('info', 'Removed from Collection');
    } catch (err) {
      console.error(err);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, game: Game) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      game
    });
  };

  const handleCompleteOnboarding = async () => {
    setIsOnboardingOpen(false);
    if (settings) {
      await window.stormPlay.settings.update({ firstLaunchDone: true });
    }
  };

  const installedCount = games.filter(g => g.installed).length;
  const favoriteCount = games.filter(g => g.favorite).length;
  const steamCount = games.filter(g => g.source === 'steam').length;
  const customCount = games.filter(g => g.source === 'custom' || g.custom).length;
  const epicCount = games.filter(g => g.source === 'epic').length;
  const gogCount = games.filter(g => g.source === 'gog').length;

  const isLibraryView = ['library', 'installed', 'favorites', 'recent', 'steam', 'custom', 'epic', 'gog'].includes(activePage);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        userSelect: 'none',
        position: 'relative'
      }}
      onClick={() => {
        if (contextMenu) setContextMenu(null);
      }}
    >
      <BackgroundShader
        theme={settings?.theme || 'obsidian'}
        active={settings?.dynamicBackground !== false}
      />

      <TitleBar
        steamStatus={steamStatus}
        scanProgress={scanProgress}
        onOpenCommandPalette={() => setIsCmdOpen(true)}
        onOpenMiniMode={() => setIsMiniOpen(true)}
        onScanSteam={handleScanSteam}
        gameCount={games.length}
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />

      <div 
        key={`workspace-${language}`}
        className="lang-text-anim"
        style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}
      >
        <Sidebar
          activePage={activePage}
          onNavigate={(page: PageId) => {
            setSelectedGame(null);
            setActivePage(page);
          }}
          installedCount={installedCount}
          favoriteCount={favoriteCount}
          steamCount={steamCount}
          customCount={customCount}
          epicCount={epicCount}
          gogCount={gogCount}
          onAddCustomGame={() => setIsAddOpen(true)}
          language={language}
        />

        <main
          style={{
            flex: 1,
            height: '100%',
            overflowY: 'auto',
            position: 'relative',
            background: 'transparent'
          }}
        >
          {selectedGame ? (
            <GameDetailPage
              game={selectedGame}
              collections={collections}
              onBack={() => setSelectedGame(null)}
              onPlay={handlePlayGame}
              onToggleFavorite={handleToggleFavorite}
              onOpenFolder={handleOpenFolder}
              onCreateShortcut={handleCreateShortcut}
              onAddToCollection={handleAddToCollection}
              onRemoveFromCollection={handleRemoveFromCollection}
              onGameUpdated={(updated) => {
                setGames(prev => prev.map(g => g.id === updated.id ? updated : g));
                setSelectedGame(updated);
              }}
              language={language}
            />
          ) : activePage === 'overview' ? (
            <OverviewPage
              games={games}
              onPlay={handlePlayGame}
              onOpenDetails={(game) => setSelectedGame(game)}
              onToggleFavorite={handleToggleFavorite}
              onContextMenu={handleContextMenu}
              onNavigate={(page) => setActivePage(page)}
              language={language}
            />
          ) : isLibraryView ? (
            <LibraryPage
              games={games}
              initialFilter={activePage === 'library' ? 'all' : activePage}
              onPlay={handlePlayGame}
              onOpenDetails={(game) => setSelectedGame(game)}
              onToggleFavorite={handleToggleFavorite}
              onContextMenu={handleContextMenu}
              onAddCustomGame={() => setIsAddOpen(true)}
              onScanSteam={handleScanSteam}
              onSyncAll={handleScanSteam}
              onScanFolder={() => setIsScanOpen(true)}
              language={language}
            />
          ) : activePage === 'collections' ? (
            <CollectionsPage
              collections={collections}
              games={games}
              onCreateCollection={handleCreateCollection}
              onDeleteCollection={handleDeleteCollection}
              onOpenGame={(game) => setSelectedGame(game)}
              language={language}
            />
          ) : activePage === 'statistics' ? (
            <StatisticsPage language={language} />
          ) : activePage === 'settings' ? (
            <SettingsPage
              onScanSteam={handleScanSteam}
              onScanFolder={() => setIsScanOpen(true)}
              language={language}
              onUpdateLanguage={handleUpdateLanguage}
              onUpdateTheme={handleUpdateTheme}
            />
          ) : null}
        </main>
      </div>

      {contextMenu && (
        <GameContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          game={contextMenu.game}
          collections={collections}
          onClose={() => setContextMenu(null)}
          onPlay={handlePlayGame}
          onToggleFavorite={handleToggleFavorite}
          onOpenFolder={handleOpenFolder}
          onCreateShortcut={handleCreateShortcut}
          onDeleteGame={handleDeleteGame}
          onAddToCollection={handleAddToCollection}
          onOpenArtworkPicker={(game) => setSteamGridGame(game)}
          language={language}
        />
      )}

      <CommandPalette
        isOpen={isCmdOpen}
        games={games}
        onClose={() => setIsCmdOpen(false)}
        onNavigate={(page) => {
          setSelectedGame(null);
          setActivePage(page);
          setIsCmdOpen(false);
        }}
        onPlay={(game) => {
          handlePlayGame(game);
          setIsCmdOpen(false);
        }}
        onOpenWhatShouldIPlay={() => {
          setIsCmdOpen(false);
          setIsRandomOpen(true);
        }}
        onScanSteam={() => {
          setIsCmdOpen(false);
          handleScanSteam();
        }}
        onAddCustomGame={() => {
          setIsCmdOpen(false);
          setIsAddOpen(true);
        }}
      />

      <MiniModeModal
        isOpen={isMiniOpen}
        games={games}
        onClose={() => setIsMiniOpen(false)}
        onPlay={(game) => {
          handlePlayGame(game);
          setIsMiniOpen(false);
        }}
        onOpenFullApp={() => setIsMiniOpen(false)}
      />

      <AddGameModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaveGame={handleSaveCustomGame}
      />

      <ScanGamesModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onAddGames={handleImportScannedGames}
      />

      <WhatShouldIPlayModal
        isOpen={isRandomOpen}
        games={games}
        onClose={() => setIsRandomOpen(false)}
        onPlay={(game) => {
          handlePlayGame(game);
          setIsRandomOpen(false);
        }}
      />

      {isOnboardingOpen && (
        <OnboardingModal
          progress={scanProgress}
          onEnter={handleCompleteOnboarding}
        />
      )}

      {steamGridGame && (
        <SteamGridModal
          game={steamGridGame}
          isOpen={!!steamGridGame}
          onClose={() => setSteamGridGame(null)}
          onArtworkUpdated={async (updatedGame: Game) => {
            await refreshGames();
            if (selectedGame && selectedGame.id === updatedGame.id) {
              setSelectedGame(updatedGame);
            }
            setSteamGridGame(null);
            addToast('success', language === 'ru' ? 'Обложка обновлена' : 'Artwork updated', updatedGame.name);
          }}
          language={language}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
