import React, { useState } from 'react';
import { X, FolderOpen, Gamepad2, Plus, UploadCloud, Trash2 } from 'lucide-react';
import type { Game } from '../../shared/types';

interface BulkGameItem {
  id: string;
  name: string;
  path: string;
}

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGame: (gameData: Partial<Game>) => void;
  onBatchSave?: (games: Partial<Game>[]) => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onSaveGame,
  onBatchSave
}) => {
  const [tab, setTab] = useState<'single' | 'bulk'>('single');

  // Single game state
  const [name, setName] = useState('');
  const [exePath, setExePath] = useState('');
  const [workDir, setWorkDir] = useState('');
  const [args, setArgs] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // Bulk import state
  const [bulkGames, setBulkGames] = useState<BulkGameItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const extractTitleFromPath = (filePath: string): string => {
    const parts = filePath.split(/[\\/]/);
    const fileName = parts[parts.length - 1].replace(/\.exe$/i, '');
    return fileName
      .replace(/[._-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const handlePickExe = async () => {
    const file = await window.stormPlay.scanner.selectFile([
      { name: 'Executable Files', extensions: ['exe'] }
    ]);
    if (file) {
      setExePath(file);
      if (!name) {
        setName(extractTitleFromPath(file));
      }
      const dir = file.substring(0, Math.max(file.lastIndexOf('\\'), file.lastIndexOf('/')));
      setWorkDir(dir);
    }
  };

  const handlePickCover = async () => {
    const file = await window.stormPlay.scanner.selectFile([
      { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
    ]);
    if (file) {
      setCoverUrl(`play://local/${file.replace(/\\/g, '/')}`);
    }
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !exePath.trim()) return;

    onSaveGame({
      name: name.trim(),
      executable: exePath.trim(),
      workingDirectory: workDir.trim() || undefined,
      arguments: args.trim() || undefined,
      artwork: {
        cover: coverUrl.trim() || undefined
      }
    });

    onClose();
  };

  const processDroppedFiles = (fileList: FileList) => {
    const newItems: BulkGameItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const filePath = (file as any).path || file.name;
      if (filePath.toLowerCase().endsWith('.exe')) {
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: extractTitleFromPath(filePath),
          path: filePath
        });
      }
    }

    if (newItems.length > 0) {
      setBulkGames(prev => [...prev, ...newItems]);
      setTab('bulk');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processDroppedFiles(e.dataTransfer.files);
    }
  };

  const handleBulkItemNameChange = (id: string, newName: string) => {
    setBulkGames(prev => prev.map(item => item.id === id ? { ...item, name: newName } : item));
  };

  const handleRemoveBulkItem = (id: string) => {
    setBulkGames(prev => prev.filter(item => item.id !== id));
  };

  const handleExecuteBulkImport = async () => {
    if (bulkGames.length === 0 || isImporting) return;
    setIsImporting(true);

    const itemsToSave: Partial<Game>[] = bulkGames.map(g => {
      const dir = g.path.substring(0, Math.max(g.path.lastIndexOf('\\'), g.path.lastIndexOf('/')));
      return {
        name: g.name.trim() || 'Untitled Game',
        executable: g.path,
        installPath: dir || undefined,
        source: 'custom',
        installed: true
      };
    });

    if (onBatchSave) {
      onBatchSave(itemsToSave);
      setIsImporting(false);
      onClose();
    } else {
      try {
        for (const item of itemsToSave) {
          await window.stormPlay.games.addCustom(item);
        }
        onSaveGame(itemsToSave[0]);
        onClose();
      } catch (err) {
        console.error('Failed bulk import:', err);
      } finally {
        setIsImporting(false);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
      onClick={onClose}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="fade-in"
        style={{
          width: '560px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(14, 14, 18, 0.95)',
          backdropFilter: 'blur(28px)',
          border: isDragging ? '2px dashed var(--accent-primary)' : '1px solid var(--border-highlight)',
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          boxSizing: 'border-box'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gamepad2 size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Add Game</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
          <button
            type="button"
            className={`glass-chip ${tab === 'single' ? 'is-selected' : ''}`}
            onClick={() => setTab('single')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              background: tab === 'single' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: tab === 'single' ? '#fff' : 'var(--text-muted)'
            }}
          >
            Single Game
          </button>
          <button
            type="button"
            className={`glass-chip ${tab === 'bulk' ? 'is-selected' : ''}`}
            onClick={() => setTab('bulk')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              background: tab === 'bulk' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: tab === 'bulk' ? '#fff' : 'var(--text-muted)'
            }}
          >
            Bulk Drag-and-Drop {bulkGames.length > 0 && `(${bulkGames.length})`}
          </button>
        </div>

        {tab === 'single' ? (
          <form onSubmit={handleSingleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Game Executable (.exe) *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="C:\Games\MyGame\game.exe"
                  value={exePath}
                  onChange={e => setExePath(e.target.value)}
                  required
                  style={{ flex: 1, fontSize: '12px' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePickExe}
                  style={{ fontSize: '12px', padding: '0 12px' }}
                >
                  <FolderOpen size={14} />
                  Browse
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Game Title *
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. Grand Theft Auto V"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Working Directory (Optional)
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="Auto-detected from executable folder"
                value={workDir}
                onChange={e => setWorkDir(e.target.value)}
                style={{ width: '100%', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Launch Arguments (Optional)
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. -fullscreen -novid"
                value={args}
                onChange={e => setArgs(e.target.value)}
                style={{ width: '100%', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Cover Artwork (Optional)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Image URL or local path..."
                  value={coverUrl}
                  onChange={e => setCoverUrl(e.target.value)}
                  style={{ flex: 1, fontSize: '12px' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePickCover}
                  style={{ fontSize: '12px', padding: '0 12px' }}
                >
                  Choose File
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} />
                Add to Library
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: 0 }}>
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed #fff' : '2px dashed var(--border-highlight)',
                borderRadius: '10px',
                padding: '24px 16px',
                textAlign: 'center',
                background: isDragging ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 180ms ease'
              }}
              onClick={async () => {
                const file = await window.stormPlay.scanner.selectFile([
                  { name: 'Executable Files', extensions: ['exe'] }
                ]);
                if (file) {
                  setBulkGames(prev => [
                    ...prev,
                    {
                      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                      name: extractTitleFromPath(file),
                      path: file
                    }
                  ]);
                }
              }}
            >
              <UploadCloud size={28} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Drag & drop multiple .exe files here
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Executable names will be cleaned into titles automatically
              </div>
            </div>

            {/* Preview List */}
            {bulkGames.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '240px', paddingRight: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  <span>Queued Games ({bulkGames.length})</span>
                  <button
                    type="button"
                    onClick={() => setBulkGames([])}
                    style={{ background: 'none', border: 'none', color: '#F43F5E', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                </div>

                {bulkGames.map(item => (
                  <div
                    key={item.id}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="text"
                        className="glass-input"
                        value={item.name}
                        onChange={e => handleBulkItemNameChange(item.id, e.target.value)}
                        style={{ width: '100%', fontSize: '12px', fontWeight: 600, padding: '4px 8px' }}
                      />
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        {item.path}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBulkItem(item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'auto', paddingTop: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isImporting}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExecuteBulkImport}
                disabled={bulkGames.length === 0 || isImporting}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                {isImporting ? 'Importing...' : `Import All (${bulkGames.length})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
