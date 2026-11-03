import { Component, ElementRef, inject, PLATFORM_ID, viewChild, viewChildren, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CatalogService } from '../../services/catalog.service';
import { AlbumCard } from './components/album-card/album-card';
import { AlbumName } from '../../models/song-model';

@Component({
  selector: 'app-album-catalog',
  imports: [AlbumCard],
  templateUrl: './album-catalog.html',
  styleUrl: './album-catalog.css',
})
export class AlbumCatalog {
  catalogService = inject(CatalogService);
  scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  albumItems = viewChildren<ElementRef<HTMLElement>>('albumItem');
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  albums = Array.from(this.catalogService.albums.values());

  constructor() {
    effect(() => {
      const activeAlbum = this.catalogService.currentAlbum();
      if (!this.isBrowser) return;

      const items = this.albumItems();
      const albumIdx = this.albums.findIndex((a) => a.name === activeAlbum);
      if (albumIdx !== -1 && items && items[albumIdx]) {
        this.scrollToItem(items[albumIdx].nativeElement);
      }
    });
  }

  albumClick(albumName: AlbumName) {
    this.catalogService.onAlbumSelect(albumName);
  }

  private scrollToItem(itemElement: HTMLElement) {
    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;

    const itemTop = itemElement.offsetTop;
    const itemHeight = itemElement.offsetHeight;
    const containerHeight = container.clientHeight;

    const targetScrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2);

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });
  }
}
