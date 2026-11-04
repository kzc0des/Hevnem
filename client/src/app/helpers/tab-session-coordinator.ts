export type TabSessionCallback = () => void;

interface SessionMessage {
  type: 'JOIN' | 'ACK' | 'LEAVE' | 'INTRO_SEEN';
  id?: string;
  target?: string;
}

export class TabSessionCoordinator {
  readonly tabId: string;
  private channel?: BroadcastChannel;
  private knownPeers = new Set<string>();
  private introSeenListeners = new Set<TabSessionCallback>();
  private isBrowser: boolean;
  private isReloading = false;

  constructor(options: { isBrowser: boolean }) {
    this.isBrowser = options.isBrowser;
    this.tabId = 'tab_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();

    if (!this.isBrowser) return;

    try {
      this.isReloading = sessionStorage.getItem('hevnem:session_reloading') === 'true';
      sessionStorage.removeItem('hevnem:session_reloading');
    } catch {}

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('hevnem:tab-presence');
        this.channel.onmessage = (event: MessageEvent<SessionMessage>) => {
          this.handleChannelMessage(event.data);
        };
        this.channel.postMessage({ type: 'JOIN', id: this.tabId });
      } catch {}
    }

    window.addEventListener('pagehide', this.handlePageHide);
    window.addEventListener('storage', this.handleStorageEvent);
  }

  private handleChannelMessage(msg: SessionMessage): void {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'JOIN':
        if (msg.id && msg.id !== this.tabId) {
          this.knownPeers.add(msg.id);
          this.channel?.postMessage({
            type: 'ACK',
            id: this.tabId,
            target: msg.id,
          });
        }
        break;

      case 'ACK':
        if (msg.id && msg.id !== this.tabId && (!msg.target || msg.target === this.tabId)) {
          this.knownPeers.add(msg.id);
        }
        break;

      case 'LEAVE':
        if (msg.id) {
          this.knownPeers.delete(msg.id);
        }
        break;

      case 'INTRO_SEEN':
        this.notifyIntroSeenListeners();
        break;
    }
  }

  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === 'hevnem:intro_seen' && event.newValue === 'true') {
      this.notifyIntroSeenListeners();
    }
  };

  private handlePageHide = (): void => {
    try {
      sessionStorage.setItem('hevnem:session_reloading', 'true');
    } catch {}

    this.channel?.postMessage({ type: 'LEAVE', id: this.tabId });

    if (this.knownPeers.size === 0) {
      try {
        localStorage.removeItem('hevnem:intro_seen');
      } catch {}
    }
  };

  shouldShowIntro(): boolean {
    if (!this.isBrowser) return true;

    if (this.isReloading) {
      try {
        localStorage.setItem('hevnem:intro_seen', 'true');
      } catch {}
      return false;
    }

    try {
      if (localStorage.getItem('hevnem:intro_seen') === 'true') {
        return false;
      }
    } catch {}

    if (this.knownPeers.size > 0) {
      try {
        localStorage.setItem('hevnem:intro_seen', 'true');
      } catch {}
      return false;
    }

    return true;
  }

  markIntroSeen(): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem('hevnem:intro_seen', 'true');
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

    window.removeEventListener('pagehide', this.handlePageHide);
    window.removeEventListener('storage', this.handleStorageEvent);

    if (this.channel) {
      this.channel.close();
      this.channel = undefined;
    }

    this.knownPeers.clear();
    this.introSeenListeners.clear();
  }
}

