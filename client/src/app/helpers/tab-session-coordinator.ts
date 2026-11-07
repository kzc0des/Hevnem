export type TabSessionCallback = () => void;

interface TabRegistryEntry {
  lastSeen: number;
}

type TabRegistry = Record<string, TabRegistryEntry>;

const REGISTRY_KEY = 'hevnem:tab_registry';
const INTRO_KEY = 'hevnem:intro_seen';
const RELOADING_KEY = 'hevnem:session_reloading';
const HEARTBEAT_INTERVAL_MS = 2500;
const LEASE_TTL_MS = 5500;

export class TabSessionCoordinator {
  readonly tabId: string;
  private channel?: BroadcastChannel;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private introSeenListeners = new Set<TabSessionCallback>();
  private isBrowser: boolean;
  private isReloading = false;

  constructor(options: { isBrowser: boolean }) {
    this.isBrowser = options.isBrowser;
    this.tabId = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

    if (!this.isBrowser) return;

    try {
      this.isReloading = sessionStorage.getItem(RELOADING_KEY) === 'true';
      sessionStorage.removeItem(RELOADING_KEY);
    } catch {}

    this.pulseHeartbeat();
    this.heartbeatTimer = setInterval(() => this.pulseHeartbeat(), HEARTBEAT_INTERVAL_MS);

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('hevnem:tab-presence');
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'INTRO_SEEN') {
            this.notifyIntroSeenListeners();
          }
        };
      } catch {}
    }

    window.addEventListener('pagehide', this.handlePageHide);
    window.addEventListener('storage', this.handleStorageEvent);
  }

  private readRegistry(): TabRegistry {
    try {
      const raw = localStorage.getItem(REGISTRY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private writeRegistry(registry: TabRegistry): void {
    try {
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
    } catch {}
  }

  private pulseHeartbeat(): void {
    const registry = this.readRegistry();
    const now = Date.now();

    for (const [id, entry] of Object.entries(registry)) {
      if (now - entry.lastSeen > LEASE_TTL_MS) {
        delete registry[id];
      }
    }

    registry[this.tabId] = { lastSeen: now };
    this.writeRegistry(registry);
  }

  private countOtherActiveTabs(): number {
    const registry = this.readRegistry();
    const now = Date.now();
    let count = 0;
    for (const [id, entry] of Object.entries(registry)) {
      if (id !== this.tabId && now - entry.lastSeen <= LEASE_TTL_MS) {
        count++;
      }
    }
    return count;
  }

  private handlePageHide = (): void => {
    try {
      sessionStorage.setItem(RELOADING_KEY, 'true');
    } catch {}

    const registry = this.readRegistry();
    delete registry[this.tabId];
    this.writeRegistry(registry);

    if (this.countOtherActiveTabs() === 0) {
      try {
        localStorage.removeItem(INTRO_KEY);
      } catch {}
    }
  };

  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === INTRO_KEY && event.newValue === 'true') {
      this.notifyIntroSeenListeners();
    }
  };

  shouldShowIntro(): boolean {
    if (!this.isBrowser) return true;

    if (this.isReloading) {
      try {
        localStorage.setItem(INTRO_KEY, 'true');
      } catch {}
      return false;
    }

    const otherTabs = this.countOtherActiveTabs();
    if (otherTabs === 0) {
      try {
        localStorage.removeItem(INTRO_KEY);
      } catch {}
      return true;
    }

    try {
      if (localStorage.getItem(INTRO_KEY) === 'true') {
        return false;
      }
    } catch {}

    return true;
  }

  markIntroSeen(): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(INTRO_KEY, 'true');
    } catch {}

    this.channel?.postMessage({ type: 'INTRO_SEEN' });
    this.notifyIntroSeenListeners();
  }

  onIntroSeen(cb: TabSessionCallback): () => void {
    this.introSeenListeners.add(cb);
    return () => {
      this.introSeenListeners.delete(cb);
    };
  }

  private notifyIntroSeenListeners(): void {
    for (const listener of this.introSeenListeners) {
      try {
        listener();
      } catch {}
    }
  }

  destroy(): void {
    if (!this.isBrowser) return;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    window.removeEventListener('pagehide', this.handlePageHide);
    window.removeEventListener('storage', this.handleStorageEvent);

    if (this.channel) {
      this.channel.close();
      this.channel = undefined;
    }

    const registry = this.readRegistry();
    delete registry[this.tabId];
    this.writeRegistry(registry);

    this.introSeenListeners.clear();
  }
}
