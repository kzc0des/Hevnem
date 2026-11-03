import { Component, inject } from '@angular/core';
import { TopNavBar } from '../../sections/top-nav-bar/top-nav-bar';
import { AlbumCatalog } from '../../sections/album-catalog/album-catalog';
import { NowPlayingCard } from '../../sections/now-playing-card/now-playing-card';
import { TrackCatalog } from '../../sections/track-catalog/track-catalog';
import { PlaybackTrackWidget } from '../../sections/playback-track-widget/playback-track-widget';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-hevnem-layout',
  imports: [TopNavBar, AlbumCatalog, NowPlayingCard, TrackCatalog, PlaybackTrackWidget],
  templateUrl: './hevnem-layout.html',
  styleUrl: './hevnem-layout.css',
})
export class HevnemLayout {
  background = inject(LayoutService);;

}
