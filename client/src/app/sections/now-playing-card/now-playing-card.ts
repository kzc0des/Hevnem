import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AudioPlayerService } from '../../services/audio-player.service';
import { LayoutService } from '../../services/layout.service';
import { TrackControl } from '../playback-track-widget/components/track-control/track-control';

@Component({
  selector: 'app-now-playing-card',
  imports: [TrackControl],
  templateUrl: './now-playing-card.html',
  styleUrl: './now-playing-card.css',
})
export class NowPlayingCard {
  private audioService = inject(AudioPlayerService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  layout = inject(LayoutService);

  currentSong = this.audioService.currentSong;
  isFlipped = signal<boolean>(false);
  imageRetryKey = signal<number>(0);
  hasImageError = signal<boolean>(false);

  resolvedCover = computed(() => {
    const raw = this.currentSong().cover;
    if (!raw) return '';
    const key = this.imageRetryKey();
    return key > 0 ? `${raw}?v=${key}` : raw;
  });

  constructor() {
    effect(() => {
      this.currentSong();
      this.isFlipped.set(false);
      this.hasImageError.set(false);
    });

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

  toggleFlip(): void {
    this.isFlipped.update((flipped) => !flipped);
  }

  formattedTitle = computed(() => {
    const raw = this.currentSong().name;
    return raw
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });

  displayAlbum = computed(() => {
    const album = this.currentSong().albumName;
    return album === 'Featuring' ? 'Single Tracks' : album;
  });
}
