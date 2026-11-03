import { Component, computed, inject, input } from '@angular/core';
import { Song } from '../../../../models/song-model';
import { AudioPlayerService } from '../../../../services/audio-player.service';

@Component({
  selector: 'app-track-card',
  imports: [],
  templateUrl: './track-card.html',
  styleUrl: './track-card.css',
})
export class TrackCard {
  audioService = inject(AudioPlayerService);

  song = input.required<Song>();
  index = input.required<number>();

  trackNumber = computed(() => this.index().toString().padStart(2, '0'));
  isActive = computed(() => this.audioService.currentSong().name === this.song().name);

  playTrack() {
    this.audioService.onSongSelect({
      name: this.song().name,
      albumName: this.song().album,
      cover: this.song().cover,
      src: this.song().src,
      duration: this.song().duration,
    });
  }
}