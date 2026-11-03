import { Component, computed, inject } from '@angular/core';
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

  formattedTitle = computed(() => {
    const raw = this.currentSong().name;
    return raw
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });
}