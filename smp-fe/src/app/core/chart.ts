import { afterRenderEffect, Component, DestroyRef, ElementRef, inject, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
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
      this.chart = new Chart(this.canvas().nativeElement, this.config());
    });
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}

/** Brand colours for chart datasets; they read well on both light and dark backgrounds. */
export const CHART_COLORS = { primary: '#6366f1', teal: '#14b8a6', amber: '#f59e0b' };
