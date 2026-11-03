import { Component, computed, effect, inject, signal } from '@angular/core';
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
  layout = inject(LayoutService);

  currentSong = this.audioService.currentSong;
  isFlipped = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.currentSong();
      this.isFlipped.set(false);
    });
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
