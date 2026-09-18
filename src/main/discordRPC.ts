import net from 'net';
import { db } from './db';

export const DOTA2_ICON_URL = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/global/dota2_logo_symbol.png';

export interface DiscordActivity {
  state?: string;
  details?: string;
  startTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  buttons?: { label: string; url: string }[];
}

export class DiscordRPC {
  private socket: net.Socket | null = null;
  private isConnected = false;
  private isReady = false;
  private currentActivity: DiscordActivity | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private enabled = true;
  private clientId = '1539256220282785833';

  constructor() {
    this.connect();
  }

  public setClientId(newId: string) {
    if (!newId || newId === this.clientId) return;
    this.clientId = newId;
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
      this.isConnected = false;
      this.isReady = false;
    }
    this.connect();
  }

  public getClientId(): string {
    return this.clientId;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.clearActivity();
      if (this.socket) {
        this.socket.destroy();
        this.socket = null;
        this.isConnected = false;
        this.isReady = false;
      }
    } else {
      this.connect();
    }
  }

  public connect() {
    if (!this.enabled || this.isConnected) return;

    const tryPipe = (pipeIndex: number) => {
      if (pipeIndex > 9 || !this.enabled) {
        if (!this.retryTimer) {
          this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            this.connect();
          }, 10000);
        }
        return;
      }

      const pipePath = `\\\\.\\pipe\\discord-ipc-${pipeIndex}`;
      const sock = net.connect(pipePath, () => {
        this.socket = sock;
        this.isConnected = true;
        this.sendHandshake();
      });

      sock.on('data', (buf) => {
        try {
          const len = buf.readInt32LE(4);
          const raw = buf.toString('utf8', 8, 8 + len);
          const msg = JSON.parse(raw);
          if (msg.evt === 'READY') {
            this.isReady = true;
            if (this.currentActivity) {
              this.sendActivity(this.currentActivity);
            }
          }
        } catch {}
      });

      sock.on('error', () => {
        sock.destroy();
        tryPipe(pipeIndex + 1);
      });

      sock.on('close', () => {
        this.isConnected = false;
        this.isReady = false;
        this.socket = null;
      });
    };

    tryPipe(0);
  }

  private sendHandshake() {
    if (!this.socket || !this.isConnected) return;
    const payload = JSON.stringify({
      v: 1,
      client_id: this.clientId
    });
    this.sendPacket(0, payload);
  }

  private sendPacket(opcode: number, payloadStr: string) {
    if (!this.socket || !this.isConnected) return;
    const length = Buffer.byteLength(payloadStr);
    const buffer = Buffer.alloc(8 + length);
    buffer.writeInt32LE(opcode, 0);
    buffer.writeInt32LE(length, 4);
    buffer.write(payloadStr, 8);
    try {
      this.socket.write(buffer);
    } catch {}
  }

  public setActivity(activity: DiscordActivity) {
    this.currentActivity = activity;
    if (!this.enabled) return;
    if (!this.isConnected || !this.isReady) {
      if (!this.isConnected) this.connect();
      return;
    }
    this.sendActivity(activity);
  }

  private sendActivity(activity: DiscordActivity) {
    const nonce = Math.random().toString(36).slice(2);

    const assets: any = {
      large_text: activity.largeImageText || activity.details || 'Storm Launcher',
      small_text: activity.smallImageText || 'Storm Launcher'
    };

    if (activity.largeImageKey && activity.largeImageKey.startsWith('http')) {
      assets.large_image = activity.largeImageKey;
    }
    if (activity.smallImageKey && activity.smallImageKey.startsWith('http')) {
      assets.small_image = activity.smallImageKey;
    }

    const payload = JSON.stringify({
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: {
          state: activity.state,
          details: activity.details,
          timestamps: activity.startTimestamp ? { start: Math.floor(activity.startTimestamp / 1000) } : undefined,
          assets,
          buttons: activity.buttons
        }
      },
      nonce
    });

    this.sendPacket(1, payload);
  }

  public clearActivity() {
    this.currentActivity = null;
    if (!this.socket || !this.isConnected || !this.isReady) return;
    const nonce = Math.random().toString(36).slice(2);
    const payload = JSON.stringify({
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: null
      },
      nonce
    });
    this.sendPacket(1, payload);
  }

  private launcherStartTime = Date.now();

  public setInMenu(gameCount?: number) {
    let lang = 'ru';
    try {
      lang = db.getSettings().language || 'ru';
    } catch {}

    const isRu = lang === 'ru';
    this.setActivity({
      details: isRu ? 'В меню' : 'In Main Menu',
      state: isRu ? `Каталог • ${gameCount || 0} игр` : `Library • ${gameCount || 0} games`,
      startTimestamp: this.launcherStartTime,
      largeImageText: 'Storm Launcher',
      smallImageText: 'Storm Launcher',
      buttons: [
        { label: isRu ? 'Скачать Storm Launcher' : 'Get Storm Launcher', url: 'https://github.com/storm-dev-arch/storm-launcher' }
      ]
    });
  }

  public setSearchingGame(gameCount?: number) {
    let lang = 'ru';
    try {
      lang = db.getSettings().language || 'ru';
    } catch {}

    const isRu = lang === 'ru';
    this.setActivity({
      details: isRu ? 'Ищет игру' : 'Looking for a game',
      state: isRu ? `В библиотеке • ${gameCount || 0} игр` : `In Library • ${gameCount || 0} games`,
      startTimestamp: this.launcherStartTime,
      largeImageText: 'Storm Launcher',
      smallImageText: 'Storm Launcher',
      buttons: [
        { label: isRu ? 'Скачать Storm Launcher' : 'Get Storm Launcher', url: 'https://github.com/storm-dev-arch/storm-launcher' }
      ]
    });
  }

  public setInSettings() {
    let lang = 'ru';
    try {
      lang = db.getSettings().language || 'ru';
    } catch {}

    const isRu = lang === 'ru';
    this.setActivity({
      details: isRu ? 'Настраивает лаунчер' : 'Configuring launcher',
      state: isRu ? 'Настройки лаунчера' : 'Launcher Settings',
      startTimestamp: this.launcherStartTime,
      largeImageText: 'Storm Launcher',
      smallImageText: 'Storm Launcher',
      buttons: [
        { label: isRu ? 'Скачать Storm Launcher' : 'Get Storm Launcher', url: 'https://github.com/storm-dev-arch/storm-launcher' }
      ]
    });
  }

  public setLaunching(gameName: string) {
    let lang = 'ru';
    try {
      lang = db.getSettings().language || 'ru';
    } catch {}

    const isRu = lang === 'ru';
    this.setActivity({
      details: isRu ? `Запускает ${gameName}` : `Launching ${gameName}`,
      state: isRu ? 'Подготовка к игре...' : 'Preparing game...',
      startTimestamp: Date.now(),
      largeImageText: gameName,
      smallImageText: 'Storm Launcher',
      buttons: [
        { label: isRu ? 'Скачать Storm Launcher' : 'Get Storm Launcher', url: 'https://github.com/storm-dev-arch/storm-launcher' }
      ]
    });
  }

  public setInGame(gameName: string, startTime: number = Date.now(), imageUrl?: string, isTool = false) {
    let lang = 'ru';
    try {
      lang = db.getSettings().language || 'ru';
    } catch {}

    const isRu = lang === 'ru';
    const isDota = gameName.toLowerCase().includes('dota');
    const largeImage = isDota ? DOTA2_ICON_URL : imageUrl;
    const details = isRu
      ? (isTool ? `Использует ${gameName}` : `Играет в ${gameName}`)
      : (isTool ? `Using ${gameName}` : `Playing ${gameName}`);
    const state = isRu ? 'через Storm Launcher' : 'via Storm Launcher';

    this.setActivity({
      details,
      state,
      startTimestamp: startTime,
      largeImageKey: largeImage,
      largeImageText: gameName,
      smallImageText: 'Storm Launcher',
      buttons: [
        { label: isRu ? 'Скачать Storm Launcher' : 'Get Storm Launcher', url: 'https://github.com/storm-dev-arch/storm-launcher' }
      ]
    });
  }

  public setIdle(gameCount: number, customDetails?: string) {
    this.setInMenu(gameCount);
  }
}

export const discordRPC = new DiscordRPC();
