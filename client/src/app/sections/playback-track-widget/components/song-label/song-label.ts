import {
  Component,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AudioPlayerService } from '../../../../services/audio-player.service';

@Component({
  selector: 'app-song-label',
  imports: [],
  templateUrl: './song-label.html',
  styleUrl: './song-label.css',
})
export class SongLabel {
  private audioService = inject(AudioPlayerService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  currentSong = this.audioService.currentSong;
  isLiked = signal<boolean>(false);
  imageRetryKey = signal<number>(0);
  hasImageError = signal<boolean>(false);

  resolvedCover = computed(() => {
    const raw = this.currentSong().cover;
    if (!raw) return '';
    const key = this.imageRetryKey();
    return key > 0 ? `${raw}?v=${key}` : raw;
  });

  constructor() {
    if (this.isBrowser) {
      const onOnline = () => {
        if (this.hasImageError()) {
          this.hasImageError.set(false);
          this.imageRetryKey.update((k) => k + 1);
        }
      };
      window.addEventListener('online', onOnline);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('online', onOnline);
      });
    }
  }

  handleImageError() {
    this.hasImageError.set(true);
  }

  songTitle = computed(() => {
    const raw = this.currentSong().name;
    return raw
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  });

  toggleLike() {
    this.isLiked.update((prev) => !prev);
  }
}
