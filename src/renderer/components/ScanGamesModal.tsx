import React, { useState } from 'react';
import { X, FolderSearch, FolderOpen, Check, Plus, RefreshCw, HardDrive, Sparkles, Layers } from 'lucide-react';
import type { CandidateExe } from '../../shared/types';
import { translations, Language } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface ScanGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGames: (candidates: CandidateExe[]) => void;
  onSyncMultiLaunchers?: () => void;
  language?: Language;
}

export const ScanGamesModal: React.FC<ScanGamesModalProps> = ({
  isOpen,
  onClose,
  onAddGames,
  onSyncMultiLaunchers,
  language = 'ru'
}) => {
  const [folderPath, setFolderPath] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [candidates, setCandidates] = useState<CandidateExe[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleSelectFolder = async () => {
    soundEngine.playClick();
    const folder = await window.stormPlay.scanner.selectFolder();
    if (folder) {
      setFolderPath(folder);
      runFolderScan(folder);
    }
  };

  const runFolderScan = async (path: string) => {
    setIsScanning(true);
    setScanMessage(language === 'ru' ? 'Сканирование директории...' : 'Scanning directory...');
    try {
      const results = await window.stormPlay.scanner.scanFolderForExecutables(path);
      setCandidates(results);
      setSelectedPaths(new Set(results.map(r => r.path)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
      setScanMessage('');
    }
  };

  const handleDeepScanDisks = async () => {
    soundEngine.playLaunch();
    setIsScanning(true);
    setScanMessage(language === 'ru' ? 'Поиск игр на всех дисках...' : 'Scanning all drives for games...');
    try {
      const results = await window.stormPlay.scanner.deepScanDisks();
      setCandidates(results);
      setSelectedPaths(new Set(results.map(r => r.path)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
      setScanMessage('');
    }
  };

  const handleScanLaunchers = async () => {
    soundEngine.playClick();
    setIsScanning(true);
    setScanMessage(language === 'ru' ? 'Поиск игр в Epic Games, GOG, Ubisoft...' : 'Scanning Epic Games, GOG, Ubisoft...');
    try {
      await window.stormPlay.scanner.scanMultiLaunchers();
      onSyncMultiLaunchers?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
      setScanMessage('');
    }
  };

  const toggleSelect = (path: string) => {
    soundEngine.playClick();
    const next = new Set(selectedPaths);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setSelectedPaths(next);
  };

  const handleConfirm = () => {
    soundEngine.playClick();
    const chosen = candidates.filter(c => selectedPaths.has(c.path));
    onAddGames(chosen);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-modal view-transition"
        style={{
          width: '680px',
          maxWidth: '92vw',
          maxHeight: '84vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-modal, #0c0c10)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FolderSearch size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                {language === 'ru' ? 'Поиск и импорт игр' : 'Search & Import Games'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                {language === 'ru' ? 'Автоматический поиск по дискам и лаунчерам' : 'Auto-detect across drives & launchers'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {/* Deep Disk Scanner Button */}
          <button
            onClick={handleDeepScanDisks}
            disabled={isScanning}
            className="btn btn-secondary"
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'rgba(56, 189, 248, 0.08)',
              borderColor: 'var(--accent-primary)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <HardDrive size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>{language === 'ru' ? 'Глубокий поиск на всех дисках' : 'Deep Scan All Disks'}</span>
          </button>

          {/* Multi-Launcher Scanner Button */}
          <button
            onClick={handleScanLaunchers}
            disabled={isScanning}
            className="btn btn-secondary"
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Layers size={16} style={{ color: '#F59E0B' }} />
            <span>{language === 'ru' ? 'Импорт из Epic / GOG / Uplay' : 'Import from Epic / GOG'}</span>
          </button>
        </div>

        {/* Directory Picker Bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            {language === 'ru' ? 'Или выберите конкретную папку с играми (например D:\\Games):' : 'Or select a specific folder (e.g. D:\\Games):'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={folderPath}
              placeholder={language === 'ru' ? 'Путь к директории с играми...' : 'Choose games folder...'}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '13px'
              }}
            />
            <button
              onClick={handleSelectFolder}
              disabled={isScanning}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <FolderOpen size={15} />
              <span>{language === 'ru' ? 'Обзор' : 'Browse'}</span>
            </button>
          </div>
        </div>

        {/* Scanning Status */}
        {isScanning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', marginBottom: '16px' }}>
            <RefreshCw size={16} className="spin" style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '13px', color: '#fff' }}>{scanMessage || 'Scanning...'}</span>
          </div>
        )}

        {/* Candidates List */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: '180px', marginBottom: '20px' }}>
          {candidates.length === 0 && !isScanning ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <FolderSearch size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>
                {language === 'ru' ? 'Нажмите одну из кнопок сканирования выше' : 'Press one of the scan options above'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>{language === 'ru' ? `Найдено игр: ${candidates.length}` : `Found ${candidates.length} games`}</span>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    if (selectedPaths.size === candidates.length) setSelectedPaths(new Set());
                    else setSelectedPaths(new Set(candidates.map(c => c.path)));
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', cursor: 'pointer' }}
                >
                  {selectedPaths.size === candidates.length ? (language === 'ru' ? 'Снять все' : 'Deselect all') : (language === 'ru' ? 'Выбрать все' : 'Select all')}
                </button>
              </div>

              {candidates.map(cand => {
                const isSelected = selectedPaths.has(cand.path);
                return (
                  <div
                    key={cand.path}
                    onClick={() => toggleSelect(cand.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, marginRight: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cand.suggestedTitle}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Consolas, monospace' }}>
                        {cand.path}
                      </div>
                    </div>

                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '5px',
                        border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'var(--accent-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isSelected && <Check size={13} style={{ color: '#000', strokeWidth: 3 }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="btn btn-secondary">
            {language === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedPaths.size === 0}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>{language === 'ru' ? `Добавить выбранные (${selectedPaths.size})` : `Add Selected (${selectedPaths.size})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
