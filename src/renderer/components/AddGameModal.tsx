import React, { useState } from 'react';
import { X, FolderOpen, Gamepad2, Plus, Sparkles } from 'lucide-react';
import type { Game } from '../../shared/types';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGame: (gameData: Partial<Game>) => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onSaveGame
}) => {
  const [name, setName] = useState('');
  const [exePath, setExePath] = useState('');
  const [workDir, setWorkDir] = useState('');
  const [args, setArgs] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  if (!isOpen) return null;

  const handlePickExe = async () => {
    const file = await window.stormPlay.scanner.selectFile([
      { name: 'Executable Files', extensions: ['exe'] }
    ]);
    if (file) {
      setExePath(file);
      if (!name) {
        // Derive name from filename
        const parts = file.split(/[\\/]/);
        const fileName = parts[parts.length - 1].replace(/\.exe$/i, '');
        setName(fileName.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
      }
      // Auto working directory
      const dir = file.substring(0, file.lastIndexOf('\\'));
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

  const handleSubmit = (e: React.FormEvent) => {
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
    >
      <div
        className="fade-in"
        style={{
          width: '520px',
          maxWidth: '92vw',
          background: 'rgba(14, 14, 18, 0.95)',
          backdropFilter: 'blur(28px)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gamepad2 size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Add Custom Game</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} />
              Add to Library
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
