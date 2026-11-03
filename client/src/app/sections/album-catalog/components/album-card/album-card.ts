import { Component, input } from '@angular/core';
import { AlbumSummary } from '../../../../models/song-model';

@Component({
  selector: 'app-album-card',
  imports: [],
  templateUrl: './album-card.html',
  styleUrl: './album-card.css',
})
export class AlbumCard {
  album = input.required<AlbumSummary>();
}
