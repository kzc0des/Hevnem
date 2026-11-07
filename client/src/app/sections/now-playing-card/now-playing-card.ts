import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AudioPlayerService } from '../../services/audio-player.service';
import { LayoutService } from '../../services/layout.service';
import { TrackControl } from '../playback-track-widget/components/track-control/track-control';
import gsap from 'gsap';

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

  private readonly titleHeading = viewChild<ElementRef<HTMLElement>>('titleHeading');
  private readonly coverImg = viewChild<ElementRef<HTMLElement>>('coverImg');

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

      if (this.isBrowser) {
        const titleEl = this.titleHeading()?.nativeElement;
        const coverEl = this.coverImg()?.nativeElement;

        if (titleEl) {
          gsap.fromTo(
            titleEl,
            { opacity: 0.2, y: 4 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'sine.out', overwrite: true }
          );
        }
        if (coverEl) {
          gsap.fromTo(
            coverEl,
            { opacity: 0.85, scale: 1.03 },
            { opacity: 1, scale: 1, duration: 0.45, ease: 'sine.out', overwrite: true }
          );
        }
      }
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
