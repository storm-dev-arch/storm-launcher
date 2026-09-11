import net from 'net';

// Storm Launcher Discord Application ID (or generic gaming client ID)
const CLIENT_ID = '1205168814781440050';

interface DiscordActivity {
  state?: string;
  details?: string;
  startTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  buttons?: { label: string; url: string }[];
}

class DiscordRPC {
  private socket: net.Socket | null = null;
  private isConnected = false;
  private currentActivity: DiscordActivity | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private enabled = true;

  constructor() {
    this.connect();
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.clearActivity();
      if (this.socket) {
        this.socket.destroy();
        this.socket = null;
        this.isConnected = false;
      }
    } else {
      this.connect();
    }
  }

  public connect() {
    if (!this.enabled || this.isConnected) return;

    // Try pipes discord-ipc-0 to discord-ipc-9
    const tryPipe = (pipeIndex: number) => {
      if (pipeIndex > 9 || !this.enabled) {
        // Retry in 15 seconds
        if (!this.retryTimer) {
          this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            this.connect();
          }, 15000);
        }
        return;
      }

      const pipePath = `\\\\?\\pipe\\discord-ipc-${pipeIndex}`;
      const sock = net.connect(pipePath, () => {
        this.socket = sock;
        this.isConnected = true;
        this.sendHandshake();

        if (this.currentActivity) {
          this.sendActivity(this.currentActivity);
        }
      });

      sock.on('error', () => {
        sock.destroy();
        tryPipe(pipeIndex + 1);
      });

      sock.on('close', () => {
        this.isConnected = false;
        this.socket = null;
      });
    };

    tryPipe(0);
  }

  private sendHandshake() {
    if (!this.socket || !this.isConnected) return;
    const payload = JSON.stringify({
      v: 1,
      client_id: CLIENT_ID
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
    if (!this.isConnected) {
      this.connect();
      return;
    }
    this.sendActivity(activity);
  }

  private sendActivity(activity: DiscordActivity) {
    const nonce = Math.random().toString(36).slice(2);
    const payload = JSON.stringify({
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: {
          state: activity.state,
          details: activity.details,
          timestamps: activity.startTimestamp ? { start: Math.floor(activity.startTimestamp / 1000) } : undefined,
          assets: {
            large_image: activity.largeImageKey || 'storm_logo',
            large_text: activity.largeImageText || 'Storm Launcher',
            small_image: activity.smallImageKey,
            small_text: activity.smallImageText
          },
          buttons: activity.buttons
        }
      },
      nonce
    });

    this.sendPacket(1, payload);
  }

  public clearActivity() {
    this.currentActivity = null;
    if (!this.socket || !this.isConnected) return;
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

  public setInGame(gameName: string, startTime: number = Date.now()) {
    this.setActivity({
      details: `Playing ${gameName}`,
      state: 'via Storm Launcher',
      startTimestamp: startTime,
      largeImageKey: 'game_pad',
      largeImageText: gameName,
      smallImageKey: 'storm_logo',
      smallImageText: 'Storm Launcher'
    });
  }

  public setIdle(gameCount: number) {
    this.setActivity({
      details: 'Browsing Game Library',
      state: `${gameCount} titles cataloged`,
      largeImageKey: 'storm_logo',
      largeImageText: 'Storm Launcher v1.0.0'
    });
  }
}

export const discordRPC = new DiscordRPC();
