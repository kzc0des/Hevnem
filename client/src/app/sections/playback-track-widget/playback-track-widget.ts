import { Component } from '@angular/core';
import { SongLabel } from './components/song-label/song-label';
import { TrackControl } from './components/track-control/track-control';
import { VolumeControl } from './components/volume-control/volume-control';

@Component({
  selector: 'app-playback-track-widget',
  imports: [SongLabel, TrackControl, VolumeControl],
  templateUrl: './playback-track-widget.html',
  styleUrl: './playback-track-widget.css',
})
export class PlaybackTrackWidget { }