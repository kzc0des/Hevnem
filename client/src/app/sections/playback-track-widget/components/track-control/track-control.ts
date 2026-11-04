import { Component, inject } from '@angular/core';
import { AudioPlayerService } from '../../../../services/audio-player.service';

@Component({
  selector: 'app-track-control',
  imports: [],
  templateUrl: './track-control.html',
  styleUrl: './track-control.css',
})
export class TrackControl {
  audioService = inject(AudioPlayerService);

  isPlaying = this.audioService.isPlaying;
  playbackHealth = this.audioService.playbackHealth;
  currentTimeFormatted = this.audioService.currentTimeFormatted;
  durationFormatted = this.audioService.durationFormatted;
  progressPercent = this.audioService.progressPercent;
  isShuffle = this.audioService.isShuffle;
  repeatMode = this.audioService.repeatMode;

  onPlayClick() {
    if (this.playbackHealth() === 'error') {
      this.audioService.retryPlayback();
    } else {
      this.audioService.togglePlay();
    }
  }

  onSeek(event: Event) {
    const input = event.target as HTMLInputElement;
    const seekTime = (Number(input.value) / 100) * this.audioService.duration();
    this.audioService.seek(seekTime);
  }
}
