import { afterRenderEffect, Component, DestroyRef, ElementRef, inject, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { clone } from 'chart.js/helpers';
import { Theme } from './ui';

Chart.register(...registerables);

/** chart.js canvas that follows the light/dark theme. `label` describes the chart for screen readers. */
@Component({
  selector: 'app-chart',
  host: { class: 'chart' },
  template: `<canvas #canvas role="img" [attr.aria-label]="label()"></canvas>`,
})
export class ChartView {
  readonly config = input.required<ChartConfiguration>();
  readonly label = input.required<string>();
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private theme = inject(Theme);
  private chart?: Chart;

  constructor() {
    afterRenderEffect(() => {
      this.theme.dark();
      const css = getComputedStyle(document.documentElement);
      Chart.defaults.color = css.getPropertyValue('--muted').trim();
      Chart.defaults.borderColor = css.getPropertyValue('--border').trim();
      Chart.defaults.font.family = css.getPropertyValue('--font').trim();
      Chart.defaults.maintainAspectRatio = false;
      this.chart?.destroy();
      // Chart.js writes resolved theme colours back into the config it is given, so hand it a fresh copy each time.
      this.chart = new Chart(this.canvas().nativeElement, clone(this.config()));
    });
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}

/** Colours for chart datasets that read well on both light and dark backgrounds (the palette colour is Theme.primary). */
export const CHART_COLORS = { teal: '#14b8a6', amber: '#f59e0b' };
