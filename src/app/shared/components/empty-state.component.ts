import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `<article class="empty-state"><h3>{{ title() }}</h3><p>{{ message() }}</p></article>`,
  styles: [
    `
      .empty-state {
        padding: 1rem;
        border: 1px dashed #94a3b8;
        border-radius: 0.5rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  public readonly title = input.required<string>();
  public readonly message = input.required<string>();
}
