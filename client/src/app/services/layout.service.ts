import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AlbumName } from '../models/song-model';
import { AudioPlayerService } from './audio-player.service';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private audioPlayerService = inject(AudioPlayerService);
  private platformId = inject(PLATFORM_ID);
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
  }
}
