import { Component, inject } from '@angular/core';
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

  albums = Array.from(this.catalogService.albums.values());

  albumClick(albumName: AlbumName) {
    this.catalogService.onAlbumSelect(albumName);
  }
}
