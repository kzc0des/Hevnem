import { Component, inject } from '@angular/core';
import { CatalogService } from '../../services/catalog.service';
import { TrackCard } from './components/track-card/track-card';

@Component({
  selector: 'app-track-catalog',
  imports: [TrackCard],
  templateUrl: './track-catalog.html',
  styleUrl: './track-catalog.css',
})
export class TrackCatalog {
  catalogService = inject(CatalogService);
}
