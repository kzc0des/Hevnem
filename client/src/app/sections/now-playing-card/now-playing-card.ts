import { Component, computed, inject } from '@angular/core';
import { AudioPlayerService } from '../../services/audio-player.service';
import catalogData from '../../data/hevabi-songs.json';

@Component({
  selector: 'app-now-playing-card',
  imports: [],
  templateUrl: './now-playing-card.html',
  styleUrl: './now-playing-card.css',
})
export class NowPlayingCard {
  private audioService = inject(AudioPlayerService);

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