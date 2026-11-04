import { computed, DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { AlbumName, RepeatMode, SelectedSong, Song } from '../models/song-model';
import { isPlatformBrowser } from '@angular/common';
import { CatalogService } from './catalog.service';
import { PlaybackSequencer } from '../helpers/playback-sequencer';
import { CrossfadeEngine } from '../helpers/crossfade-engine';

@Injectable({
  providedIn: 'root',
})
export class AudioPlayerService {
  private platformId = inject(PLATFORM_ID);
  private catalogService = inject(CatalogService);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(this.platformId);

  private sequencer: PlaybackSequencer;
  private engine: CrossfadeEngine;

  currentSong = signal<SelectedSong>(this.getInitialTrack());
  isPlaying = signal<boolean>(false);
  playbackHealth = signal<'idle' | 'buffering' | 'reconnecting' | 'error'>('idle');
  currentTime = signal<number>(0);
  duration = signal<number>(0);
  volume = signal<number>(0.8);
  private lastVolume = 0.8;

  repeatMode = signal<RepeatMode>('off');
  isShuffle = signal<boolean>(false);

  currentTimeFormatted = computed(() => this.formatTime(this.currentTime()));
  durationFormatted = computed(() => this.formatTime(this.duration()));

  progressPercent = computed(() => {
    const dur = this.duration();
    return dur > 0 ? (this.currentTime() / dur) * 100 : 0;
  });

  constructor() {
    this.sequencer = new PlaybackSequencer(this.catalogService);
    this.engine = new CrossfadeEngine(
      {
        onTimeUpdate: (t) => this.currentTime.set(t),
        onDurationChange: (d) => this.duration.set(d),
        onPlayStateChange: (p) => {
          this.isPlaying.set(p);
          this.persistTrack(this.currentSong(), p);
        },
        onPlaybackHealthChange: (h) => this.playbackHealth.set(h),
        onEnded: () => this.handleTrackEnded(),
        onTrackTransition: (incoming) => this.handleTrackTransition(incoming),
        peekNextTrack: () => this.sequencer.peekNextTrack(this.currentSong().name),
        canCrossfade: () => this.repeatMode() !== 'track',
      },
      { isBrowser: this.isBrowser }
    );

    this.engine.setVolume(this.volume());

    this.restoreInitialPlayback();

    this.destroyRef.onDestroy(() => {
      this.engine.destroy();
    });
  }

  private getInitialTrack(): SelectedSong {
    if (this.isBrowser) {
      try {
        const saved = localStorage.getItem('hevnem:last_selected_track');
        if (saved) {
          const parsed = JSON.parse(saved);
          const matched = this.catalogService.getAllSongs().find((s) => s.name === parsed.name);
          if (matched) {
            this.catalogService.onAlbumSelect(matched.album);
            return {
              name: matched.name,
              albumName: matched.album,
              cover: matched.cover,
              src: matched.src,
              duration: matched.duration,
            };
          }
        }
      } catch {}
    }

    const firstSong = this.catalogService.getSongsByAlbum(this.catalogService.currentAlbum())[0];
    if (firstSong) {
      return {
        name: firstSong.name,
        albumName: firstSong.album,
        cover: firstSong.cover,
        src: firstSong.src,
        duration: firstSong.duration,
      };
    }
    return {
      name: 'Balisa',
      albumName: 'Pautang ng Pag-ibig',
      cover: '',
      src: '',
    };
  }

  private restoreInitialPlayback() {
    if (!this.isBrowser) return;
    const song = this.currentSong();
    if (!song.src) return;

    this.currentTime.set(0);
    this.isPlaying.set(false);
    this.engine.load(song.src, false);
  }

  private persistTrack(song: { name: string; albumName?: string; album?: string }, isPlaying?: boolean) {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(
        'hevnem:last_selected_track',
        JSON.stringify({
          name: song.name,
          album: song.albumName || song.album,
          isPlaying: isPlaying !== undefined ? isPlaying : this.isPlaying(),
        })
      );
    } catch {}
  }

  onSongSelect(song: SelectedSong) {
    this.currentTime.set(0);
    this.persistTrack(song, true);
    this.currentSong.set(song);
    if (song.src) {
      this.engine.load(song.src, true);
    }
  }

  togglePlay() {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.persistTrack(this.currentSong(), true);
    this.engine.play(this.currentSong().src);
  }

  pause() {
    this.persistTrack(this.currentSong(), false);
    this.engine.pause();
  }

  retryPlayback() {
    this.engine.retryPlayback();
  }

  seek(seconds: number) {
    this.engine.seek(seconds);
    this.currentTime.set(seconds);
  }

  setVolume(val: number) {
    this.volume.set(val);
    this.engine.setVolume(val);
  }

  seekRelative(delta: number) {
    const dur = this.duration();
    const cur = this.currentTime();
    const target = Math.max(0, Math.min(dur, cur + delta));
    this.seek(target);
  }

  adjustVolume(delta: number) {
    const next = Math.max(0, Math.min(1, Math.round((this.volume() + delta) * 100) / 100));
    this.setVolume(next);
  }

  toggleMute() {
    if (this.volume() > 0) {
      this.lastVolume = this.volume();
      this.setVolume(0);
    } else {
      this.setVolume(this.lastVolume > 0 ? this.lastVolume : 0.8);
    }
  }

  toggleRepeat() {
    const next = this.sequencer.toggleRepeat();
    this.repeatMode.set(next);
    if (next === 'track') {
      this.engine.abort();
    }
  }

  toggleShuffle() {
    const next = this.sequencer.toggleShuffle(this.currentSong().name);
    this.isShuffle.set(next);
    this.engine.abort();
  }

  next(isAutoAdvance = false) {
    if (!isAutoAdvance) {
      this.engine.abort();
    }

    if (isAutoAdvance && this.repeatMode() === 'track') {
      this.seek(0);
      this.play();
      return;
    }

    const nextTrack = this.sequencer.getNextTrack(this.currentSong().name, isAutoAdvance);
    if (nextTrack) {
      this.playTrack(nextTrack);
    }
  }

  previous() {
    this.engine.abort();

    if (this.currentTime() > 3) {
      this.seek(0);
      return;
    }

    const prevTrack = this.sequencer.getPreviousTrack(this.currentSong().name);
    if (prevTrack) {
      this.playTrack(prevTrack);
    }
  }

  private handleTrackEnded() {
    this.currentTime.set(0);
    if (this.repeatMode() === 'track') {
      this.seek(0);
      this.play();
    } else {
      this.next(true);
    }
  }

  private handleTrackTransition(incomingSong: Song) {
    this.currentTime.set(0);
    this.persistTrack(incomingSong, true);
    this.sequencer.commitTrack(this.currentSong().name, incomingSong);
    this.currentSong.set({
      name: incomingSong.name,
      albumName: incomingSong.album,
      cover: incomingSong.cover,
      src: incomingSong.src,
      duration: incomingSong.duration,
    });
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
