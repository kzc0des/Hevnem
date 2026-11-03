import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { AlbumName, SelectedSong } from '../models/song-model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AudioPlayerService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private audio?: HTMLAudioElement;

  currentSong = signal<SelectedSong>({
    name: 'Balisa',
    albumName: 'Pautang ng Pag-ibig',
    cover: '/assets/cover_1.jpg',
    src: '/songs/Pautang ng Pagibig/Hev Abi - BALISA.mp3'
  });

  isPlaying = signal<boolean>(false);
  currentTime = signal<number>(0);
  duration = signal<number>(0);
  volume = signal<number>(0.8);

  currentTimeFormatted = computed(() => this.formatTime(this.currentTime()));
  durationFormatted = computed(() => this.formatTime(this.duration()));

  progressPercent = computed(() => {
    const dur = this.duration();
    return dur > 0 ? (this.currentTime() / dur) * 100 : 0;
  });

  constructor() {
    if (this.isBrowser) {
      this.audio = new Audio();
      this.audio.volume = this.volume();
      this.setupAudioListeners();
    }
  }

  private setupAudioListeners() {
    if (!this.audio) return;
    this.audio.ontimeupdate = () => {
      this.currentTime.set(this.audio?.currentTime || 0);
    };
    this.audio.onloadedmetadata = () => {
      this.duration.set(this.audio?.duration || 0);
    };
    this.audio.onended = () => {
      this.isPlaying.set(false);
      this.currentTime.set(0);
    };
    this.audio.onplay = () => this.isPlaying.set(true);
    this.audio.onpause = () => this.isPlaying.set(false);
  }

  onSongSelect(song: SelectedSong) {
    this.currentSong.set(song)
    if (this.isBrowser && this.audio && song.src) {
      this.audio.src = song.src;
      this.audio.load();
      this.play();
    }
  }

  togglePlay() {
    if (!this.audio) return;
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.audio) return;
    if (!this.audio.src && this.currentSong().src) {
      this.audio.src = this.currentSong().src!;
    }
    this.audio.play().catch((err) => console.warn('Audio play prevented:', err));
  }
  pause() {
    this.audio?.pause();
  }
  seek(seconds: number) {
    if (this.audio) {
      this.audio.currentTime = seconds;
      this.currentTime.set(seconds);
    }
  }
  setVolume(val: number) {
    this.volume.set(val);
    if (this.audio) {
      this.audio.volume = val;
    }
  }
  private formatTime(totalSeconds: number): string {
    if (isNaN(totalSeconds) || totalSeconds <= 0) return '0:00';
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
