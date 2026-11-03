import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { AlbumName, RepeatMode, SelectedSong, Song } from '../models/song-model';
import { isPlatformBrowser } from '@angular/common';
import { CatalogService } from './catalog.service';

@Injectable({
  providedIn: 'root',
})
export class AudioPlayerService {
  private platformId = inject(PLATFORM_ID);
  private catalogService = inject(CatalogService);
  private isBrowser = isPlatformBrowser(this.platformId);
  private audio?: HTMLAudioElement;

  currentSong = signal<SelectedSong>({
    name: 'Balisa',
    albumName: 'Pautang ng Pag-ibig',
    cover: '/assets/cover_1.jpg',
    src: '/songs/Pautang ng Pagibig/Hev Abi - BALISA.mp3',
  });

  isPlaying = signal<boolean>(false);
  currentTime = signal<number>(0);
  duration = signal<number>(0);
  volume = signal<number>(0.8);

  repeatMode = signal<RepeatMode>('off');
  isShuffle = signal<boolean>(false);

  private shufflePool: Song[] = [];
  private playedHistory: Song[] = [];

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
      this.currentTime.set(0);
      if (this.repeatMode() === 'track') {
        this.audio?.play().catch((err) => console.warn('Audio play prevented:', err));
      } else {
        this.next(true);
      }
    };
    this.audio.onplay = () => this.isPlaying.set(true);
    this.audio.onpause = () => this.isPlaying.set(false);
  }

  onSongSelect(song: SelectedSong) {
    this.currentSong.set(song);
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

  toggleRepeat() {
    const modes: RepeatMode[] = ['off', 'album', 'track'];
    const nextIndex = (modes.indexOf(this.repeatMode()) + 1) % modes.length;
    this.repeatMode.set(modes[nextIndex]);
  }

  toggleShuffle() {
    this.isShuffle.update((prev) => !prev);
    if (this.isShuffle()) {
      this.buildShufflePool();
    } else {
      this.shufflePool = [];
    }
  }

  private buildShufflePool() {
    const all = this.catalogService
      .getAllSongs()
      .filter((s) => s.name !== this.currentSong().name);

    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    this.shufflePool = all;
  }

  next(isAutoAdvance = false) {
    if (isAutoAdvance && this.repeatMode() === 'track') {
      this.seek(0);
      this.play();
      return;
    }

    const currentTrack = this.catalogService
      .getAllSongs()
      .find((s) => s.name === this.currentSong().name);
    if (currentTrack) {
      this.playedHistory.push(currentTrack);
    }

    if (this.isShuffle()) {
      if (this.shufflePool.length === 0) {
        this.buildShufflePool();
      }
      const nextTrack = this.shufflePool.shift();
      if (nextTrack) {
        this.catalogService.onAlbumSelect(nextTrack.album);
        this.playTrack(nextTrack);
      }
      return;
    }

    const albumSongs = this.catalogService.currentSongs();
    const currentIndex = albumSongs.findIndex((s) => s.name === this.currentSong().name);

    if (currentIndex !== -1 && currentIndex < albumSongs.length - 1) {
      this.playTrack(albumSongs[currentIndex + 1]);
    } else {
      if (this.repeatMode() === 'album') {
        this.playTrack(albumSongs[0]);
      } else {
        const albums = this.catalogService.getAlbumList();
        const currentAlbumIdx = albums.indexOf(this.catalogService.currentAlbum());
        const nextAlbum = albums[(currentAlbumIdx + 1) % albums.length];
        this.catalogService.onAlbumSelect(nextAlbum);
        const nextAlbumSongs = this.catalogService.getSongsByAlbum(nextAlbum);
        if (nextAlbumSongs.length > 0) {
          this.playTrack(nextAlbumSongs[0]);
        }
      }
    }
  }

  previous() {
    if (this.currentTime() > 3) {
      this.seek(0);
      return;
    }

    if (this.isShuffle() && this.playedHistory.length > 0) {
      const prevTrack = this.playedHistory.pop()!;
      this.catalogService.onAlbumSelect(prevTrack.album);
      this.playTrack(prevTrack);
      return;
    }

    const albumSongs = this.catalogService.currentSongs();
    const currentIndex = albumSongs.findIndex((s) => s.name === this.currentSong().name);

    if (currentIndex > 0) {
      this.playTrack(albumSongs[currentIndex - 1]);
    } else {
      if (this.repeatMode() === 'album') {
        this.playTrack(albumSongs[albumSongs.length - 1]);
      } else {
        const albums = this.catalogService.getAlbumList();
        const currentAlbumIdx = albums.indexOf(this.catalogService.currentAlbum());
        const prevAlbum = albums[(currentAlbumIdx - 1 + albums.length) % albums.length];
        this.catalogService.onAlbumSelect(prevAlbum);
        const prevAlbumSongs = this.catalogService.getSongsByAlbum(prevAlbum);
        if (prevAlbumSongs.length > 0) {
          this.playTrack(prevAlbumSongs[prevAlbumSongs.length - 1]);
        }
      }
    }
  }

  private playTrack(song: Song) {
    this.onSongSelect({
      name: song.name,
      albumName: song.album,
      cover: song.cover,
      src: song.src,
      duration: song.duration,
    });
  }

  private formatTime(totalSeconds: number): string {
    if (isNaN(totalSeconds) || totalSeconds <= 0) return '0:00';
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
