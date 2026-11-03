import { Component, computed, effect, ElementRef, inject, input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Song } from '../../../../models/song-model';
import { AudioPlayerService } from '../../../../services/audio-player.service';
import { LayoutService } from '../../../../services/layout.service';

@Component({
  selector: 'app-track-card',
  imports: [],
  templateUrl: './track-card.html',
  styleUrl: './track-card.css',
  standalone: true,
})
export class TrackCard {
  audioService = inject(AudioPlayerService);
  private layout = inject(LayoutService);
  private elementRef = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  song = input.required<Song>();
  index = input.required<number>();

  trackNumber = computed(() => this.index().toString().padStart(2, '0'));
  isActive = computed(() => this.audioService.currentSong().name === this.song().name);

  constructor() {
    effect(() => {
      if (this.isBrowser && this.isActive()) {
        const el = this.elementRef.nativeElement as HTMLElement;
        const container = el.closest('.overflow-y-auto') as HTMLElement | null;
        if (container) {
          const itemRect = el.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const relativeTop = itemRect.top - containerRect.top + container.scrollTop;
          const targetTop = relativeTop - (container.clientHeight / 2) + (el.clientHeight / 2);

          container.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth',
          });
        }
      }
    });
  }

  playTrack() {
    this.audioService.onSongSelect({
      name: this.song().name,
      albumName: this.song().album,
      cover: this.song().cover,
      src: this.song().src,
      duration: this.song().duration,
    });
    this.layout.closeDrawer();
  }
}
