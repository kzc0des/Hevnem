import {
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  computed,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../services/catalog.service';
import { AudioPlayerService } from '../../services/audio-player.service';

type Language = 'tl' | 'en';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFoundComponent implements OnInit {
  private router = inject(Router);
  private catalogService = inject(CatalogService);
  private audioPlayerService = inject(AudioPlayerService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private audio: HTMLAudioElement | null = null;

  readonly language = signal<Language>('tl');
  readonly isPlaying = signal<boolean>(false);
  readonly currentTime = signal<number>(0);
  readonly duration = signal<number>(0);

  readonly songInfo = computed(() => {
    const all = this.catalogService.getAllSongs();
    const walangMakapa = all.find(
      (s) => s.name.toLowerCase() === 'walang makapa'
    );
    return (
      walangMakapa ?? {
        name: 'Walang Makapa',
        album: 'Sakred Boy',
        src: '/songs/Sakred Boy/Hev Abi - Walang Makapa (Official Music Video).mp3',
        cover: '/assets/baliko-asinta.jpg',
        duration: '3:45',
      }
    );
  });

  readonly progressPercent = computed(() => {
    const d = this.duration();
    if (!d || d <= 0) return 0;
    return Math.min(100, Math.max(0, (this.currentTime() / d) * 100));
  });

  readonly formattedCurrentTime = computed(() =>
    this.formatSeconds(this.currentTime())
  );
  readonly formattedDuration = computed(() =>
    this.formatSeconds(this.duration())
  );

  readonly copy = computed(() => {
    if (this.language() === 'tl') {
      return {
        badge: 'ERROR 404 · PAGE NOT FOUND',
        title: 'Walang Makapa.',
        description:
          "Hinanap namin kahit saan, pero wala talaga ang page na 'to. Baka lumipat na sa ibang track.",
        backBtn: 'Balik sa player',
        randomBtn: 'Play random track',
        escHint: 'Pindutin ang Esc para bumalik',
        toggleHint: 'Switch to English',
        toggleLabel: 'EN',
      };
    }
    return {
      badge: 'ERROR 404 · PAGE NOT FOUND',
      title: 'Walang Makapa.',
      description:
        "We searched everywhere, but this page truly couldn't be found. Maybe it skipped to another track.",
      backBtn: 'Back to player',
      randomBtn: 'Play random track',
      escHint: 'Press Esc to go back',
      toggleHint: 'Lumipat sa Filipino',
      toggleLabel: 'TL',
    };
  });

  ngOnInit() {
    if (!this.isBrowser) return;

    if (this.audioPlayerService.isPlaying()) {
      this.audioPlayerService.pause();
    }

    const targetSrc = this.songInfo().src;
    this.audio = new Audio(targetSrc);
    this.audio.preload = 'auto';

    const onPlay = () => this.isPlaying.set(true);
    const onPause = () => this.isPlaying.set(false);
    const onTimeUpdate = () => {
      if (this.audio) {
        this.currentTime.set(this.audio.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      if (this.audio && this.audio.duration && !isNaN(this.audio.duration)) {
        this.duration.set(this.audio.duration);
      }
    };
    const onEnded = () => {
      this.isPlaying.set(false);
      this.currentTime.set(0);
    };

    this.audio.addEventListener('play', onPlay);
    this.audio.addEventListener('pause', onPause);
    this.audio.addEventListener('timeupdate', onTimeUpdate);
    this.audio.addEventListener('loadedmetadata', onLoadedMetadata);
    this.audio.addEventListener('ended', onEnded);

    const unmute = () => {
      if (this.audio) {
        this.audio.muted = false;
      }
      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener('pointerdown', unmute);
      window.removeEventListener('keydown', unmute);
      window.removeEventListener('touchstart', unmute);
      window.removeEventListener('click', unmute);
    };

    window.addEventListener('pointerdown', unmute, { once: true });
    window.addEventListener('keydown', unmute, { once: true });
    window.addEventListener('touchstart', unmute, { once: true });
    window.addEventListener('click', unmute, { once: true });

    this.audio.play().then(() => {
      this.isPlaying.set(true);
    }).catch(() => {
      if (this.audio) {
        this.audio.muted = true;
        this.audio.play().then(() => {
          this.isPlaying.set(true);
        }).catch(() => {});
      }
    });

    this.destroyRef.onDestroy(() => {
      cleanupListeners();
      if (this.audio) {
        this.audio.pause();
        this.audio.removeEventListener('play', onPlay);
        this.audio.removeEventListener('pause', onPause);
        this.audio.removeEventListener('timeupdate', onTimeUpdate);
        this.audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        this.audio.removeEventListener('ended', onEnded);
        this.audio.src = '';
        this.audio = null;
      }
    });
  }

  togglePlay() {
    if (!this.audio) return;
    if (this.audio.muted) {
      this.audio.muted = false;
    }
    if (this.isPlaying()) {
      this.audio.pause();
    } else {
      this.audio.play().then(() => {
        this.isPlaying.set(true);
      }).catch(() => {});
    }
  }

  seek(event: Event) {
    const input = event.target as HTMLInputElement;
    const targetSeconds = parseFloat(input.value);
    if (this.audio && !isNaN(targetSeconds)) {
      this.audio.currentTime = targetSeconds;
      this.currentTime.set(targetSeconds);
    }
  }

  toggleLanguage() {
    this.language.update((lang) => (lang === 'tl' ? 'en' : 'tl'));
  }

  @HostListener('window:keydown.escape')
  navigateHome() {
    this.router.navigate(['/']);
  }

  playRandom() {
    const all = this.catalogService.getAllSongs();
    if (all.length > 0) {
      const randomIdx = Math.floor(Math.random() * all.length);
      const chosen = all[randomIdx];
      this.audioPlayerService.onSongSelect({
        name: chosen.name,
        albumName: chosen.album,
        cover: chosen.cover,
        src: chosen.src,
        duration: chosen.duration,
      });
      this.audioPlayerService.play();
    }
    this.router.navigate(['/']);
  }

  private formatSeconds(totalSeconds: number): string {
    if (isNaN(totalSeconds) || totalSeconds <= 0) return '0:00';
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
