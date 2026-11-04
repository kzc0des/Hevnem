import { Song } from '../models/song-model';

export interface CrossfadeEngineCallbacks {
  onTimeUpdate: (currentTime: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onPlaybackHealthChange?: (health: 'idle' | 'buffering' | 'reconnecting' | 'error') => void;
  onEnded: () => void;
  onTrackTransition: (incomingSong: Song) => void;
  peekNextTrack: () => Song | null;
  canCrossfade: () => boolean;
}

export interface CrossfadeEngineConfig {
  isBrowser: boolean;
  crossfadeDuration?: number;
  preloadOffset?: number;
}

export class CrossfadeEngine {
  private isBrowser: boolean;
  private deckA?: HTMLAudioElement;
  private deckB?: HTMLAudioElement;
  private activeDeckIndex: 'A' | 'B' = 'A';

  private preloadedTrack: Song | null = null;
  private isPreloaded = false;
  private isCrossfading = false;
  private isManualIntervention = false;
  private crossfadeInterval?: ReturnType<typeof setInterval>;
  private crossfadeStartTime = 0;
  private fadingOutgoingDeck?: HTMLAudioElement;
  private fadingIncomingDeck?: HTMLAudioElement;
  private visibilityHandler?: () => void;
  private timeTrackingAnimFrame?: number;

  private masterVolume = 0.8;
  private readonly crossfadeDuration: number;
  private readonly preloadOffset: number;

  private playbackHealth: 'idle' | 'buffering' | 'reconnecting' | 'error' = 'idle';
  private reconnectRetries = 0;
  private readonly maxReconnectRetries = 4;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;
  private lastKnownTime = 0;
  private wasPlayingBeforeDrop = false;
  private onlineHandler?: () => void;
  private offlineHandler?: () => void;

  private get activeAudio(): HTMLAudioElement | undefined {
    return this.activeDeckIndex === 'A' ? this.deckA : this.deckB;
  }

  private get idleAudio(): HTMLAudioElement | undefined {
    return this.activeDeckIndex === 'A' ? this.deckB : this.deckA;
  }

  constructor(
    private callbacks: CrossfadeEngineCallbacks,
    config: CrossfadeEngineConfig
  ) {
    this.isBrowser = config.isBrowser;
    this.crossfadeDuration = config.crossfadeDuration ?? 4;
    this.preloadOffset = config.preloadOffset ?? 15;

    if (this.isBrowser) {
      this.deckA = new Audio();
      this.deckB = new Audio();
      this.deckA.volume = this.masterVolume;
      this.deckB.volume = this.masterVolume;
      this.setupDeckListeners(this.deckA);
      this.setupDeckListeners(this.deckB);
      this.setupVisibilityListener();
      this.setupNetworkListeners();
    }
  }

  private setupVisibilityListener() {
    if (typeof document === 'undefined') return;
    this.visibilityHandler = () => {
      if (this.isCrossfading && this.fadingOutgoingDeck && this.fadingIncomingDeck) {
        const now = performance.now();
        const elapsed = now - this.crossfadeStartTime;
        const durationMs = this.crossfadeDuration * 1000;
        if (elapsed >= durationMs) {
          this.completeCrossfade(this.fadingOutgoingDeck, this.fadingIncomingDeck);
        } else {
          const progress = Math.min(Math.max(elapsed / durationMs, 0), 1);
          const theta = progress * (Math.PI / 2);
          this.fadingOutgoingDeck.volume = Math.cos(theta) * this.masterVolume;
          this.fadingIncomingDeck.volume = Math.sin(theta) * this.masterVolume;
        }
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private startTimeTracking() {
    if (this.timeTrackingAnimFrame) return;
    const tick = () => {
      if (!this.activeAudio || this.activeAudio.paused) {
        this.stopTimeTracking();
        return;
      }
      this.callbacks.onTimeUpdate(this.activeAudio.currentTime || 0);
      this.timeTrackingAnimFrame = requestAnimationFrame(tick);
    };
    this.timeTrackingAnimFrame = requestAnimationFrame(tick);
  }

  private stopTimeTracking() {
    if (this.timeTrackingAnimFrame) {
      cancelAnimationFrame(this.timeTrackingAnimFrame);
      this.timeTrackingAnimFrame = undefined;
    }
  }

  private setupDeckListeners(deck: HTMLAudioElement) {
    deck.ontimeupdate = () => {
      if (this.activeAudio === deck) {
        this.lastKnownTime = deck.currentTime || 0;
        this.callbacks.onTimeUpdate(this.lastKnownTime);
        this.checkPreloadAndCrossfade();
      }
    };

    deck.onloadedmetadata = () => {
      if (this.activeAudio === deck) {
        this.callbacks.onDurationChange(deck.duration || 0);
      }
    };

    deck.onwaiting = () => {
      if (this.activeAudio === deck && !this.isCrossfading) {
        this.setPlaybackHealth('buffering');
      }
    };

    deck.onplaying = () => {
      if (this.activeAudio === deck) {
        this.reconnectRetries = 0;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = undefined;
        }
        this.setPlaybackHealth('idle');
      }
    };

    deck.onerror = () => {
      if (this.activeAudio === deck) {
        this.handleMediaError();
      }
    };

    deck.onstalled = () => {
      if (this.activeAudio === deck && !deck.paused) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          this.handleMediaError();
        }
      }
    };

    deck.onplay = () => {
      if (this.activeAudio === deck) {
        this.callbacks.onPlayStateChange(true);
        this.startTimeTracking();
      }
    };

    deck.onpause = () => {
      if (this.activeAudio === deck && !this.isCrossfading) {
        this.callbacks.onPlayStateChange(false);
        this.stopTimeTracking();
      }
    };

    deck.onended = () => {
      if (this.isCrossfading && this.fadingIncomingDeck) {
        this.completeCrossfade(deck, this.fadingIncomingDeck);
        return;
      }
      if (this.activeAudio === deck) {
        this.stopTimeTracking();
        this.callbacks.onEnded();
      }
    };
  }

  private checkPreloadAndCrossfade() {
    if (!this.activeAudio || !this.callbacks.canCrossfade()) return;

    const cur = this.activeAudio.currentTime;
    const dur = this.activeAudio.duration;

    if (isNaN(dur) || dur < 10) return;

    if (
      !this.isPreloaded &&
      !this.isCrossfading &&
      (cur >= dur - this.preloadOffset || (dur > 0 && cur / dur >= 0.8))
    ) {
      const next = this.callbacks.peekNextTrack();
      if (next && next.src) {
        this.preloadIncomingTrack(next);
      }
    }

    if (
      !this.isCrossfading &&
      cur >= dur - this.crossfadeDuration
    ) {
      if (!this.isPreloaded || !this.preloadedTrack) {
        const next = this.callbacks.peekNextTrack();
        if (next && next.src) {
          this.preloadIncomingTrack(next);
        }
      }

      const idle = this.idleAudio;
      if (idle && this.preloadedTrack) {
        if (idle.readyState >= 2) {
          this.startCrossfade(this.preloadedTrack);
        } else {
          const onReady = () => {
            idle.removeEventListener('loadeddata', onReady);
            idle.removeEventListener('canplay', onReady);
            if (
              !this.isCrossfading &&
              this.preloadedTrack &&
              this.activeAudio &&
              this.activeAudio.currentTime >= this.activeAudio.duration - this.crossfadeDuration
            ) {
              this.startCrossfade(this.preloadedTrack);
            }
          };
          idle.addEventListener('loadeddata', onReady, { once: true });
          idle.addEventListener('canplay', onReady, { once: true });
        }
      }
    }
  }

  private preloadIncomingTrack(song: Song) {
    this.preloadedTrack = song;
    this.isPreloaded = true;
    const idle = this.idleAudio;
    if (idle && song.src) {
      idle.src = song.src;
      idle.preload = 'auto';
      idle.load();
    }
  }

  private startCrossfade(nextSong: Song) {
    if (this.isCrossfading) return;
    this.isCrossfading = true;
    const outgoing = this.activeAudio!;
    const incoming = this.idleAudio!;

    this.fadingOutgoingDeck = outgoing;
    this.fadingIncomingDeck = incoming;
    this.crossfadeStartTime = performance.now();

    this.activeDeckIndex = this.activeDeckIndex === 'A' ? 'B' : 'A';
    this.callbacks.onTrackTransition(nextSong);
    this.callbacks.onTimeUpdate(0);
    this.callbacks.onDurationChange(incoming.duration || 0);

    incoming.currentTime = 0;
    incoming.volume = 0;
    incoming.muted = false;
    incoming.play().catch((err) => console.warn('Audio play prevented:', err));
    this.startTimeTracking();

    const durationMs = this.crossfadeDuration * 1000;

    const tick = () => {
      if (!this.isCrossfading) return;
      const now = performance.now();
      const elapsed = now - this.crossfadeStartTime;
      const progress = Math.min(Math.max(elapsed / durationMs, 0), 1);
      const theta = progress * (Math.PI / 2);

      outgoing.volume = Math.cos(theta) * this.masterVolume;
      incoming.volume = Math.sin(theta) * this.masterVolume;

      if (progress >= 1) {
        this.completeCrossfade(outgoing, incoming);
      }
    };

    if (this.crossfadeInterval) {
      clearInterval(this.crossfadeInterval);
    }
    this.crossfadeInterval = setInterval(tick, 25);
  }

  private completeCrossfade(outgoing: HTMLAudioElement, incoming: HTMLAudioElement) {
    this.isCrossfading = false;
    if (this.crossfadeInterval) {
      clearInterval(this.crossfadeInterval);
      this.crossfadeInterval = undefined;
    }
    this.fadingOutgoingDeck = undefined;
    this.fadingIncomingDeck = undefined;
    this.teardownDeck(outgoing);
    incoming.volume = this.masterVolume;
    this.preloadedTrack = null;
    this.isPreloaded = false;
    this.isManualIntervention = false;
  }

  abort() {
    if (this.crossfadeInterval) {
      clearInterval(this.crossfadeInterval);
      this.crossfadeInterval = undefined;
    }
    if (this.isCrossfading) {
      this.isCrossfading = false;
      const fadingDeck = this.idleAudio;
      if (fadingDeck) {
        this.teardownDeck(fadingDeck);
      }
      if (this.activeAudio) {
        this.activeAudio.volume = this.masterVolume;
      }
    } else if (this.idleAudio && this.isPreloaded) {
      this.teardownDeck(this.idleAudio);
    }
    this.fadingOutgoingDeck = undefined;
    this.fadingIncomingDeck = undefined;
    this.preloadedTrack = null;
    this.isPreloaded = false;
  }

  private teardownDeck(deck: HTMLAudioElement) {
    deck.pause();
    deck.removeAttribute('src');
    deck.load();
    deck.currentTime = 0;
    deck.volume = 1;
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    this.onlineHandler = () => {
      if (this.playbackHealth === 'reconnecting' || this.playbackHealth === 'error') {
        this.reconnectRetries = 0;
        this.executeReconnect();
      }
    };

    this.offlineHandler = () => {
      if (this.activeAudio && !this.activeAudio.paused) {
        this.lastKnownTime = this.activeAudio.currentTime || 0;
        this.wasPlayingBeforeDrop = true;
        this.setPlaybackHealth('reconnecting');
      }
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  private handleMediaError() {
    if (!this.activeAudio) return;
    this.lastKnownTime = this.activeAudio.currentTime || this.lastKnownTime || 0;
    this.wasPlayingBeforeDrop = !this.activeAudio.paused || this.wasPlayingBeforeDrop;
    this.executeReconnect();
  }

  private executeReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setPlaybackHealth('reconnecting');
      return;
    }

    if (this.reconnectRetries >= this.maxReconnectRetries) {
      this.setPlaybackHealth('error');
      return;
    }

    this.setPlaybackHealth('reconnecting');
    this.reconnectRetries++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectRetries - 1), 6000);

    this.reconnectTimeout = setTimeout(() => {
      const active = this.activeAudio;
      if (!active || !active.src) return;

      const targetTime = this.lastKnownTime;
      const shouldPlay = this.wasPlayingBeforeDrop;
      const currentSrc = active.src;

      active.pause();
      active.src = currentSrc;
      active.load();

      const onCanPlay = () => {
        active.removeEventListener('canplay', onCanPlay);
        if (targetTime > 0) {
          try {
            active.currentTime = targetTime;
          } catch {}
        }
        if (shouldPlay) {
          active.play().catch((err) => {
            console.warn('Playback resume failed during reconnect:', err);
            this.handleMediaError();
          });
        }
      };

      active.addEventListener('canplay', onCanPlay, { once: true });
    }, delay);
  }

  retryPlayback() {
    this.reconnectRetries = 0;
    this.executeReconnect();
  }

  private setPlaybackHealth(health: 'idle' | 'buffering' | 'reconnecting' | 'error') {
    if (this.playbackHealth !== health) {
      this.playbackHealth = health;
      this.callbacks.onPlaybackHealthChange?.(health);
    }
  }

  load(src: string, autoPlay = true) {
    this.abort();
    this.isManualIntervention = false;
    this.reconnectRetries = 0;
    this.lastKnownTime = 0;
    this.wasPlayingBeforeDrop = autoPlay;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    this.setPlaybackHealth('idle');
    this.callbacks.onTimeUpdate(0);
    if (this.isBrowser && this.activeAudio && src) {
      this.activeAudio.src = src;
      try {
        this.activeAudio.currentTime = 0;
      } catch {}
      this.activeAudio.load();
      if (autoPlay) {
        this.play();
      }
    }
  }

  play(fallbackSrc?: string) {
    if (!this.activeAudio) return;
    if (!this.activeAudio.src && fallbackSrc) {
      this.activeAudio.src = fallbackSrc;
    }
    this.activeAudio.muted = false;
    this.activeAudio.volume = this.masterVolume;
    this.activeAudio.play().catch((err) => console.warn('Audio play prevented:', err));
    this.startTimeTracking();
  }

  pause() {
    this.abort();
    this.stopTimeTracking();
    this.wasPlayingBeforeDrop = false;
    this.setPlaybackHealth('idle');
    this.activeAudio?.pause();
  }

  seek(seconds: number) {
    if (this.activeAudio) {
      this.abort();
      this.activeAudio.currentTime = seconds;
      this.callbacks.onTimeUpdate(seconds);
      const dur = this.activeAudio.duration;
      if (dur > 0 && seconds >= dur - this.preloadOffset) {
        const next = this.callbacks.peekNextTrack();
        if (next && next.src) {
          this.preloadIncomingTrack(next);
        }
      }
    }
  }

  setVolume(val: number) {
    this.masterVolume = val;
    if (this.activeAudio && !this.isCrossfading) {
      this.activeAudio.volume = val;
    }
  }

  destroy() {
    this.abort();
    this.stopTimeTracking();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.onlineHandler && typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineHandler);
    }
    if (this.offlineHandler && typeof window !== 'undefined') {
      window.removeEventListener('offline', this.offlineHandler);
    }
    if (this.deckA) this.teardownDeck(this.deckA);
    if (this.deckB) this.teardownDeck(this.deckB);
  }
}
