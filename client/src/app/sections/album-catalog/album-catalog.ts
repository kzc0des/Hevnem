import { Component, ElementRef, inject, PLATFORM_ID, viewChildren, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CatalogService } from '../../services/catalog.service';
import { AlbumCard } from './components/album-card/album-card';
import { AlbumName } from '../../models/song-model';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-album-catalog',
  imports: [AlbumCard],
  templateUrl: './album-catalog.html',
  styleUrl: './album-catalog.css',
  standalone: true,
})
export class AlbumCatalog {
  catalogService = inject(CatalogService);
  private layout = inject(LayoutService);
  albumItems = viewChildren<ElementRef<HTMLElement>>('albumItem');
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  albums = Array.from(this.catalogService.albums.values());

  constructor() {
    effect(() => {
      const activeAlbum = this.catalogService.currentAlbum();
      const activeDrawer = this.layout.activeDrawer();
      if (!this.isBrowser) return;

      const items = this.albumItems();
      const albumIdx = this.albums.findIndex((a) => a.name === activeAlbum);
      if (albumIdx !== -1 && items && items[albumIdx]) {
        setTimeout(() => {
          this.scrollToItem(items[albumIdx].nativeElement);
        }, 50);
      }
    });
  }

  albumClick(albumName: AlbumName) {
    this.catalogService.onAlbumSelect(albumName);
    if (this.layout.activeDrawer() === 'albums') {
      this.layout.openDrawer('tracks');
    }
  }

  private scrollToItem(itemElement: HTMLElement) {
    const container = itemElement.closest('.overflow-y-auto') as HTMLElement | null;
    if (!container) return;

    const itemRect = itemElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const relativeTop = itemRect.top - containerRect.top + container.scrollTop;
    const targetTop = relativeTop - (container.clientHeight / 2) + (itemElement.clientHeight / 2);

    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    });
  }
}
