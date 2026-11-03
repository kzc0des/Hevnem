import { Component, inject } from '@angular/core';
import { AudioPlayerService } from '../../../../services/audio-player.service';

@Component({
  selector: 'app-volume-control',
  imports: [],
  templateUrl: './volume-control.html',
  styleUrl: './volume-control.css',
})
export class VolumeControl {
  private audioService = inject(AudioPlayerService);

  volume = this.audioService.volume;

  onVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.audioService.setVolume(Number(input.value) / 100);
  }
}