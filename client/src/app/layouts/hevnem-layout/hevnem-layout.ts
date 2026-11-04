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

  private navBar = viewChild<ElementRef<HTMLElement>>('navBar');
  private albumCatalog = viewChild<ElementRef<HTMLElement>>('albumCatalog');
  private nowPlayingCard = viewChild<ElementRef<HTMLElement>>('nowPlayingCard');
  private trackCatalog = viewChild<ElementRef<HTMLElement>>('trackCatalog');
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
      const dismissed = this.background.introDismissed();
      if (!this.isBrowser || !dismissed) return;
      this.playEntranceSequence();
    });

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

  private playEntranceSequence(): void {
    if (!this.isBrowser) return;
    const nav = this.navBar()?.nativeElement;
    const card = this.nowPlayingCard()?.nativeElement;
    const albums = this.albumCatalog()?.nativeElement;
    const tracks = this.trackCatalog()?.nativeElement;
    const dock = this.playbackDock()?.nativeElement;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (nav) {
      tl.fromTo(nav, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65 }, 0);
    }
    if (card) {
      tl.fromTo(card, { y: 24, scale: 0.95, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.75 }, 0.05);
    }
    if (albums) {
      tl.fromTo(albums, { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.65 }, 0.1);
    }
    if (tracks) {
      tl.fromTo(tracks, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.65 }, 0.1);
    }
    if (dock) {
      tl.fromTo(dock, { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65 }, 0.12);
    }
  }
}