import { RepeatMode, Song } from '../models/song-model';
import { CatalogService } from '../services/catalog.service';

export class PlaybackSequencer {
  private repeatMode: RepeatMode = 'off';
  private isShuffle = false;
  private shufflePool: Song[] = [];
  private playedHistory: Song[] = [];

  constructor(private catalog: CatalogService) {}

  peekNextTrack(currentTrackName: string): Song | null {
    if (this.repeatMode === 'track') return null;

    if (this.isShuffle) {
      if (this.shufflePool.length === 0) {
        this.buildShufflePool(currentTrackName);
      }
      return this.shufflePool[0] ?? null;
    }

    const albumSongs = this.catalog.currentSongs();
    const currentIndex = albumSongs.findIndex((s) => s.name === currentTrackName);

    if (currentIndex !== -1 && currentIndex < albumSongs.length - 1) {
      return albumSongs[currentIndex + 1];
    }

    if (this.repeatMode === 'album') {
      return albumSongs[0] ?? null;
    }

    const albums = this.catalog.getAlbumList();
    const currentAlbumIdx = albums.indexOf(this.catalog.currentAlbum());
    const nextAlbum = albums[(currentAlbumIdx + 1) % albums.length];
    const nextAlbumSongs = this.catalog.getSongsByAlbum(nextAlbum);
    return nextAlbumSongs[0] ?? null;
  }

  getNextTrack(currentTrackName: string, isAutoAdvance = false): Song | null {
    if (isAutoAdvance && this.repeatMode === 'track') {
      return this.catalog.getAllSongs().find((s) => s.name === currentTrackName) ?? null;
    }

    const currentTrack = this.catalog.getAllSongs().find((s) => s.name === currentTrackName);
    if (currentTrack) {
      this.playedHistory.push(currentTrack);
    }

    if (this.isShuffle) {
      if (this.shufflePool.length === 0) {
        this.buildShufflePool(currentTrackName);
      }
      const nextTrack = this.shufflePool.shift();
      if (nextTrack) {
        this.catalog.onAlbumSelect(nextTrack.album);
        return nextTrack;
      }
      return null;
    }

    const albumSongs = this.catalog.currentSongs();
    const currentIndex = albumSongs.findIndex((s) => s.name === currentTrackName);

    if (currentIndex !== -1 && currentIndex < albumSongs.length - 1) {
      return albumSongs[currentIndex + 1];
    }

    if (this.repeatMode === 'album') {
      return albumSongs[0] ?? null;
    }

    const albums = this.catalog.getAlbumList();
    const currentAlbumIdx = albums.indexOf(this.catalog.currentAlbum());
    const nextAlbum = albums[(currentAlbumIdx + 1) % albums.length];
    this.catalog.onAlbumSelect(nextAlbum);
    const nextAlbumSongs = this.catalog.getSongsByAlbum(nextAlbum);
    return nextAlbumSongs[0] ?? null;
  }

  getPreviousTrack(currentTrackName: string): Song | null {
    if (this.isShuffle && this.playedHistory.length > 0) {
      const prevTrack = this.playedHistory.pop()!;
      this.catalog.onAlbumSelect(prevTrack.album);
      return prevTrack;
    }

    const albumSongs = this.catalog.currentSongs();
    const currentIndex = albumSongs.findIndex((s) => s.name === currentTrackName);

    if (currentIndex > 0) {
      return albumSongs[currentIndex - 1];
    }

    if (this.repeatMode === 'album') {
      return albumSongs[albumSongs.length - 1] ?? null;
    }

    const albums = this.catalog.getAlbumList();
    const currentAlbumIdx = albums.indexOf(this.catalog.currentAlbum());
    const prevAlbum = albums[(currentAlbumIdx - 1 + albums.length) % albums.length];
    this.catalog.onAlbumSelect(prevAlbum);
    const prevAlbumSongs = this.catalog.getSongsByAlbum(prevAlbum);
    return prevAlbumSongs[prevAlbumSongs.length - 1] ?? null;
  }

  commitTrack(outgoingTrackName: string, incomingTrack: Song) {
    const currentTrack = this.catalog.getAllSongs().find((s) => s.name === outgoingTrackName);
    if (currentTrack) {
      this.playedHistory.push(currentTrack);
    }

    if (this.isShuffle && this.shufflePool.length > 0 && this.shufflePool[0].name === incomingTrack.name) {
      this.shufflePool.shift();
    }

    this.catalog.onAlbumSelect(incomingTrack.album);
  }

  toggleRepeat(): RepeatMode {
    const modes: RepeatMode[] = ['off', 'album', 'track'];
    const nextIndex = (modes.indexOf(this.repeatMode) + 1) % modes.length;
    this.repeatMode = modes[nextIndex];
    return this.repeatMode;
  }

  getRepeatMode(): RepeatMode {
    return this.repeatMode;
  }

  setRepeatMode(mode: RepeatMode) {
    this.repeatMode = mode;
  }

  toggleShuffle(currentTrackName: string): boolean {
    this.isShuffle = !this.isShuffle;
    if (this.isShuffle) {
      this.buildShufflePool(currentTrackName);
    } else {
      this.shufflePool = [];
    }
    return this.isShuffle;
  }

  isShuffleEnabled(): boolean {
    return this.isShuffle;
  }

  private buildShufflePool(currentTrackName: string) {
    const all = this.catalog
      .getAllSongs()
      .filter((s) => s.name !== currentTrackName);

    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    this.shufflePool = all;
  }
}

