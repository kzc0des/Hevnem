import { DestroyRef, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AlbumName } from '../models/song-model';
import { AudioPlayerService } from './audio-player.service';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private audioPlayerService = inject(AudioPlayerService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(this.platformId);

  readonly ALBUM_BACKGROUNDS: Record<AlbumName, string> = {
    "Maduming Timog":
      "linear-gradient(180deg, var(--color-maduming-timog-1) 0%, var(--color-maduming-timog-2) 83%, var(--color-maduming-timog-3) 100%)",
    "Kung Alam Mo Lang":
      "linear-gradient(180deg, var(--color-kung-alam-mo-lang-1) 0%, var(--color-kung-alam-mo-lang-2) 55%, var(--color-kung-alam-mo-lang-3) 100%)",
    "Pautang ng Pag-ibig":
      "linear-gradient(180deg, var(--color-pautang-ng-pag-ibig-1) 0%, var(--color-pautang-ng-pag-ibig-2) 60%, var(--color-pautang-ng-pag-ibig-3) 100%)",
    "Kwentong Jimenez":
      "linear-gradient(180deg, var(--color-kwentong-jimenez-1) 0%, var(--color-kwentong-jimenez-2) 60%, var(--color-kwentong-jimenez-3) 100%)",
    "Sakred Boy":
      "linear-gradient(180deg, var(--color-sakred-boy-1) 0%, var(--color-sakred-boy-2) 62%, var(--color-sakred-boy-3) 100%)",
    "Featuring":
      "linear-gradient(180deg, var(--color-featuring-1) 0%, var(--color-featuring-2) 62%, var(--color-featuring-3) 100%)",
    "Gang Mobile":
      "linear-gradient(180deg, var(--color-gang-mobile-1) 0%, var(--color-gang-mobile-2) 62%, var(--color-gang-mobile-3) 100%)",
    "Bahay Namin Maliit Lamang":
      "linear-gradient(180deg, var(--color-bahay-namin-maliit-lamang-1) 0%, var(--color-bahay-namin-maliit-lamang-2) 62%, var(--color-bahay-namin-maliit-lamang-3) 100%)",
  };

  readonly ALBUM_ACCENTS: Record<AlbumName, string> = {
    "Maduming Timog": "var(--color-maduming-timog-1)",
    "Kung Alam Mo Lang": "var(--color-kung-alam-mo-lang-1)",
    "Pautang ng Pag-ibig": "var(--color-pautang-ng-pag-ibig-1)",
    "Kwentong Jimenez": "var(--color-kwentong-jimenez-1)",
    "Sakred Boy": "var(--color-sakred-boy-1)",
    "Featuring": "var(--color-featuring-1)",
    "Gang Mobile": "var(--color-gang-mobile-1)",
    "Bahay Namin Maliit Lamang": "var(--color-bahay-namin-maliit-lamang-1)",
  };

  baseBackground = signal<string>(this.ALBUM_BACKGROUNDS["Pautang ng Pag-ibig"]);
  incomingBackground = signal<string>('');
  isFading = signal<boolean>(false);
  currentAccent = signal<string>(this.ALBUM_ACCENTS["Pautang ng Pag-ibig"]);
  private fadeTimeout?: ReturnType<typeof setTimeout>;

  isImmersive = signal<boolean>(false);
  isIdle = signal<boolean>(false);

  private autoEnterTimeout?: ReturnType<typeof setTimeout>;
  private idleDimTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const currentAlbum = this.audioPlayerService.currentSong().albumName;
      const nextGradient = this.ALBUM_BACKGROUNDS[currentAlbum] ?? this.ALBUM_BACKGROUNDS["Pautang ng Pag-ibig"];
      this.currentAccent.set(this.ALBUM_ACCENTS[currentAlbum] ?? 'rgba(255, 255, 255, 0.3)');

      if (!this.isBrowser) {
        this.baseBackground.set(nextGradient);
        return;
      }

      if (this.baseBackground() !== nextGradient) {
        if (this.fadeTimeout) clearTimeout(this.fadeTimeout);
        this.incomingBackground.set(nextGradient);
        this.isFading.set(true);

        this.fadeTimeout = setTimeout(() => {
          this.baseBackground.set(nextGradient);
          this.isFading.set(false);
        }, 800);
      }
    });

    effect(() => {
      const isPlaying = this.audioPlayerService.isPlaying();
      const immersive = this.isImmersive();

      if (!this.isBrowser) return;

      if (isPlaying && !immersive) {
        this.resetAutoEnterTimer();
      } else {
        this.clearAutoEnterTimer();
      }
    });

    if (this.isBrowser) {
      this.setupGlobalListeners();
    }
  }

  enterImmersive(): void {
    this.isImmersive.set(true);
    this.clearAutoEnterTimer();
    this.resetIdleDimTimer();
  }

  exitImmersive(): void {
    this.isImmersive.set(false);
    this.isIdle.set(false);
    this.clearIdleDimTimer();
    if (this.audioPlayerService.isPlaying()) {
      this.resetAutoEnterTimer();
    }
  }

  toggleImmersive(): void {
    if (this.isImmersive()) {
      this.exitImmersive();
    } else {
      this.enterImmersive();
    }
  }

  private resetAutoEnterTimer(): void {
    this.clearAutoEnterTimer();
    if (!this.audioPlayerService.isPlaying() || this.isImmersive()) return;

    this.autoEnterTimeout = setTimeout(() => {
      this.enterImmersive();
    }, 5000);
  }

  private clearAutoEnterTimer(): void {
    if (this.autoEnterTimeout) {
      clearTimeout(this.autoEnterTimeout);
      this.autoEnterTimeout = undefined;
    }
  }

  private resetIdleDimTimer(): void {
    this.clearIdleDimTimer();
    this.isIdle.set(false);

    if (!this.isImmersive()) return;

    this.idleDimTimeout = setTimeout(() => {
      this.isIdle.set(true);
    }, 3000);
  }

  private clearIdleDimTimer(): void {
    if (this.idleDimTimeout) {
      clearTimeout(this.idleDimTimeout);
      this.idleDimTimeout = undefined;
    }
  }

  private setupGlobalListeners(): void {
    const onUserActivity = () => {
      if (this.isImmersive()) {
        this.resetIdleDimTimer();
      } else if (this.audioPlayerService.isPlaying()) {
        this.resetAutoEnterTimer();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      if ((event.key === 'f' || event.key === 'F') && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        this.toggleImmersive();
        return;
      }

      if (event.key === 'Escape' && this.isImmersive()) {
        event.preventDefault();
        this.exitImmersive();
        return;
      }

      onUserActivity();
    };

    window.addEventListener('pointermove', onUserActivity, { passive: true });
    window.addEventListener('touchstart', onUserActivity, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    this.destroyRef.onDestroy(() => {
      this.clearAutoEnterTimer();
      this.clearIdleDimTimer();
      if (this.fadeTimeout) clearTimeout(this.fadeTimeout);
      window.removeEventListener('pointermove', onUserActivity);
      window.removeEventListener('touchstart', onUserActivity);
      window.removeEventListener('keydown', onKeyDown);
    });
  }
}