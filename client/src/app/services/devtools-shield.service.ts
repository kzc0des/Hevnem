import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class DevToolsShieldService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  init(): void {
    if (!this.isBrowser) return;
    this.printConsoleBanner();
  }

  private printConsoleBanner(): void {
    const titleStyle = `
      color: #F5E6C8;
      background: #070B0E;
      font-size: 15px;
      font-weight: 800;
      font-family: monospace;
      padding: 10px 16px;
      border-radius: 8px 8px 0 0;
      border: 1px solid #1F63D6;
      border-bottom: none;
      text-shadow: 0 0 10px rgba(245, 230, 200, 0.45);
    `;

    const bodyStyle = `
      color: #94A3B8;
      background: #0D1520;
      font-size: 12px;
      font-family: monospace;
      padding: 10px 16px;
      border-radius: 0 0 8px 8px;
      border: 1px solid #1F63D6;
      border-top: 1px dashed rgba(245, 230, 200, 0.25);
      line-height: 1.6;
    `;

    console.log(
      "%cOops, kz won’t let you do that, baby ( >ᴗ• )%c\nLooking under the hood? Hevnem is engineered by Kenzo Vidal.\nStack: Angular v21 · GSAP · Tailwind CSS v4 · Cloudflare R2 Streaming",
      titleStyle,
      bodyStyle
    );
  }
}
