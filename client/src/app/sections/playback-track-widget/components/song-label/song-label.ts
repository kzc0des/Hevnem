import { Component, computed, inject, signal } from '@angular/core';
import { AudioPlayerService } from '../../../../services/audio-player.service';

@Component({
  selector: 'app-song-label',
  imports: [],
  templateUrl: './song-label.html',
  styleUrl: './song-label.css',
})
export class SongLabel {
  private audioService = inject(AudioPlayerService);

  currentSong = this.audioService.currentSong;
  isLiked = signal<boolean>(false);

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