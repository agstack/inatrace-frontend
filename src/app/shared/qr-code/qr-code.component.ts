import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import * as QRCode from 'qrcode';

/**
 * Small wrapper around the maintained `qrcode` package.
 *
 * It keeps the old `qr-code` selector and the inputs used by the templates, so
 * the application is not tied to an Angular-specific QR library.
 */
@Component({
    selector: 'qr-code',
    template: `
    @if (dataUrl) {
      <img
        [src]="dataUrl"
        [width]="size"
        [height]="size"
        [attr.alt]="value"
        role="img">
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class QrCodeComponent implements OnChanges {

  @Input() value: string;
  @Input() size = 200;
  @Input() foreground = '#000000';
  @Input() background = '#ffffff';
  @Input() margin = 4;

  dataUrl: string = null;
  private renderToken = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value || changes.size || changes.foreground || changes.background || changes.margin) {
      this.render();
    }
  }

  private async render(): Promise<void> {
    const token = ++this.renderToken;
    if (!this.value) {
      this.dataUrl = null;
      return;
    }

    try {
      const dataUrl = await QRCode.toDataURL(this.value, {
        width: this.size,
        margin: this.margin,
        color: {
          dark: this.foreground,
          light: this.background
        }
      });
      if (token === this.renderToken) {
        this.dataUrl = dataUrl;
      }
    } catch {
      if (token === this.renderToken) {
        this.dataUrl = null;
      }
    }
  }
}
