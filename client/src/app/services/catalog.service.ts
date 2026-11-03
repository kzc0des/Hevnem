import { computed, Injectable, Signal, signal } from '@angular/core';
import { AlbumName, AlbumSummary, Song } from '../models/song-model';
import catalogData from '../data/hevabi-songs.json'

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  currentAlbum = signal<AlbumName>("Pautang ng Pag-ibig");
  albums = new Map<AlbumName, AlbumSummary>();

  currentSongs: Signal<Song[]> = computed<Song[]>(() => {
    const selectedAlbum = this.currentAlbum();
    return catalogData.songs
      .filter(s => s.album === selectedAlbum)
      .map(s => ({
        id: s.id,
        name: s.name,
        album: s.album as AlbumName,
        src: s.src,
        cover: s.cover,
        duration: s.durationFormatted,
      }));;
  })

  constructor() {
    this.initializeCatalog();
  }

  private initializeCatalog() {
    const rawAlbums = catalogData.albums;
    const rawSongs = catalogData.songs;

    for (const album of rawAlbums) {
      const trackCount = rawSongs.filter(s => s.album === album.name).length;

      this.albums.set(
        album.name as AlbumName, // key
        {
          id: album.id,
          name: album.name as AlbumName, // value
          tracks: trackCount,
          thumbnail: album.thumbnail
        }
      );
    }
  }

  onAlbumSelect(albumName: AlbumName) {
    this.currentAlbum.set(albumName);
  }
}
