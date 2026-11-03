import { Component, computed, inject, input } from '@angular/core';
import { AlbumSummary } from '../../../../models/song-model';
import { CatalogService } from '../../../../services/catalog.service';

@Component({
  selector: 'app-album-card',
  imports: [],
  templateUrl: './album-card.html',
  styleUrl: './album-card.css',
})
export class AlbumCard {
  private catalogService = inject(CatalogService);
  album = input.required<AlbumSummary>();

  isActive = computed(() => this.catalogService.currentAlbum() === this.album().name);
}
