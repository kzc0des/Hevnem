import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LayoutService } from '../../services/layout.service';
import { TabSessionCoordinator } from '../../helpers/tab-session-coordinator';
import gsap from 'gsap';

@Component({
  selector: 'app-intro-sequence',
  imports: [],
  templateUrl: './intro-sequence.html',
  styleUrl: './intro-sequence.css',
})
export class IntroSequence implements AfterViewInit {
  protected readonly layout = inject(LayoutService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly rootRef = viewChild<ElementRef<HTMLElement>>('introRoot');
  private readonly sessionCoordinator = new TabSessionCoordinator({ isBrowser: this.isBrowser });

  hasSeenIntro = signal<boolean>(!this.sessionCoordinator.shouldShowIntro());
  protected readonly isDismissing = signal(false);

  private ctx?: gsap.Context;
  private timeline?: gsap.core.Timeline;

  constructor() {
    this.sessionCoordinator.onIntroSeen(() => {
      if (this.isBrowser) {
        document.documentElement.classList.remove('intro-pending');
      }
      this.hasSeenIntro.set(true);
      this.dismiss();
    });

    this.destroyRef.onDestroy(() => {
      this.sessionCoordinator.destroy();
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || this.hasSeenIntro()) return;

    const rootEl = this.rootRef()?.nativeElement;
    if (!rootEl) return;

    this.ctx = gsap.context(() => {
      this.timeline = gsap.timeline({
        onComplete: () => {
          this.markIntroSeen();
          this.dismiss();
        },
      });

      this.timeline.fromTo(
        '.intro-backdrop',
        { opacity: 0, scale: 0.9 },
        { opacity: 0.55, scale: 1, duration: 2.2, ease: 'sine.out' },
        0
      );

      this.timeline.fromTo(
        '.intro-base',
        { opacity: 0, y: 14, scale: 0.94, filter: 'blur(10px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'sine.out' },
        0
      );

      this.timeline.fromTo(
        '.intro-accents',
        { opacity: 0, y: 10, scale: 0.96, filter: 'blur(8px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'sine.out' },
        0.35
      );

      this.timeline.fromTo(
        '.intro-tagline',
        { opacity: 0, y: 8, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'sine.out' },
        0.5
      );

      this.timeline.fromTo(
        '.intro-sheen',
        { xPercent: -160 },
        { xPercent: 160, duration: 1.35, ease: 'power2.inOut' },
        0.95
      );

      this.timeline.fromTo(
        '.intro-glint',
        { scale: 0, rotation: 0, opacity: 0 },
        { scale: 1.3, rotation: 45, opacity: 1, duration: 0.35, ease: 'back.out(2)' },
        1.4
      );
      this.timeline.to(
        '.intro-glint',
        { scale: 0, rotation: 90, opacity: 0, duration: 0.45, ease: 'power2.in' },
        1.75
      );

      this.timeline.fromTo(
        '.intro-tagline',
        { backgroundPosition: '100% 0' },
        { backgroundPosition: '-60% 0', duration: 1.3, ease: 'power2.inOut' },
        1.1
      );

      this.timeline.to({}, { duration: 0.4 });

      this.timeline.to(
        rootEl,
        {
          opacity: 0,
          scale: 1.05,
          duration: 0.8,
          ease: 'sine.inOut',
          onComplete: () => {
            rootEl.style.display = 'none';
          },
        }
      );
    }, rootEl);

    this.destroyRef.onDestroy(() => {
      this.ctx?.revert();
    });
  }

  private markIntroSeen(): void {
    this.sessionCoordinator.markIntroSeen();
  }

  @HostListener('window:keydown')
  @HostListener('click')
  dismiss(): void {
    if (this.isBrowser) {
      document.documentElement.classList.remove('intro-pending');
    }
    this.markIntroSeen();
    if (this.isDismissing()) return;
    this.isDismissing.set(true);

    const rootEl = this.rootRef()?.nativeElement;
    this.timeline?.kill();

    if (rootEl) {
      gsap.to(rootEl, {
        opacity: 0,
        scale: 1.05,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          rootEl.style.display = 'none';
        },
      });
    }
  }
}
