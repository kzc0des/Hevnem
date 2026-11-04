import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  viewChild,
  effect,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TopNavBar } from '../../sections/top-nav-bar/top-nav-bar';
import { AlbumCatalog } from '../../sections/album-catalog/album-catalog';
import { NowPlayingCard } from '../../sections/now-playing-card/now-playing-card';
import { TrackCatalog } from '../../sections/track-catalog/track-catalog';
import { PlaybackTrackWidget } from '../../sections/playback-track-widget/playback-track-widget';
import { IntroSequence } from '../../sections/intro-sequence/intro-sequence';
import { LayoutService } from '../../services/layout.service';
import gsap from 'gsap';

@Component({
  selector: 'app-hevnem-layout',
  imports: [TopNavBar, AlbumCatalog, NowPlayingCard, TrackCatalog, PlaybackTrackWidget, IntroSequence],
  templateUrl: './hevnem-layout.html',
  styleUrl: './hevnem-layout.css',
})
export class HevnemLayout {
  background = inject(LayoutService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  protected readonly isBrowser = isPlatformBrowser(this.platformId);

  private playbackDock = viewChild<ElementRef<HTMLElement>>('playbackDock');
  private stageContainer = viewChild<ElementRef<HTMLElement>>('stageContainer');

  constructor() {
    if (this.isBrowser) {
      this.destroyRef.onDestroy(() => {
        const dock = this.playbackDock()?.nativeElement;
        const stage = this.stageContainer()?.nativeElement;
        if (dock && stage) {
          gsap.killTweensOf([dock, stage]);
        }
      });
    }

    effect(() => {
      const isImmersive = this.background.isImmersive();
      if (!this.isBrowser) return;

      const dock = this.playbackDock()?.nativeElement;
      const stage = this.stageContainer()?.nativeElement;
      if (!dock || !stage) return;

      if (isImmersive) {
        gsap.to(dock, {
          yPercent: 120,
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power3.out',
          overwrite: true,
        });
        gsap.to(stage, {
          y: 35,
          duration: 0.6,
          ease: 'power3.out',
          overwrite: true,
        });
      } else {
        gsap.to(dock, {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.6,
          ease: 'power3.out',
          overwrite: true,
        });
        gsap.to(stage, {
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          overwrite: true,
        });
      }
    });
  }
}
