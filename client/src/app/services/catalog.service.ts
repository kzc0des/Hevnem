import { computed, Injectable, Signal, signal } from '@angular/core';
import { AlbumName, AlbumSummary, Song } from '../models/song-model';
import catalogData from '../data/hevabi-songs.json';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  currentAlbum = signal<AlbumName>("Pautang ng Pag-ibig");
  albums = new Map<AlbumName, AlbumSummary>();

  currentSongs: Signal<Song[]> = computed<Song[]>(() => {
    return this.getSongsByAlbum(this.currentAlbum());
  });

  constructor() {
    this.initializeCatalog();
  }

  private mapSong(s: (typeof catalogData.songs)[number]): Song {
    return {
      id: s.id,
      name: s.name,
      album: s.album as AlbumName,
      src: this.resolveMediaUrl(s.src),
      cover: s.cover,
      duration: s.durationFormatted,
    };
  }

  getAlbumList(): AlbumName[] {
    return catalogData.albums.map((a) => a.name as AlbumName);
  }

  getSongsByAlbum(albumName: AlbumName): Song[] {
    return catalogData.songs
      .filter((s) => s.album === albumName)
      .map((s) => this.mapSong(s));
  }

  getAllSongs(): Song[] {
    return catalogData.songs.map((s) => this.mapSong(s));
  }

  private initializeCatalog() {
    const rawAlbums = catalogData.albums;
    const rawSongs = catalogData.songs;

    for (const album of rawAlbums) {
      const trackCount = rawSongs.filter((s) => s.album === album.name).length;

      this.albums.set(
        album.name as AlbumName,
        {
          id: album.id,
          name: album.name as AlbumName,
          tracks: trackCount,
          thumbnail: album.thumbnail,
        }
      );
    }
  }

  onAlbumSelect(albumName: AlbumName) {
    this.currentAlbum.set(albumName);
  }

  private resolveMediaUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const base = environment.cdnBaseUrl?.replace(/\/$/, '') || '';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base}${cleanPath}` : cleanPath;
  }
}
