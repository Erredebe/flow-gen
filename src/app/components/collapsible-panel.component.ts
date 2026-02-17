import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-collapsible-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <details class="sidebar-card collapsible-panel" [attr.open]="open ? '' : null" [ngClass]="panelClass">
      <summary>
        <span class="panel-title">{{ title }}</span>
      </summary>
      <div class="panel-content">
        <ng-content />
      </div>
    </details>
  `
})
export class CollapsiblePanelComponent {
  @Input({ required: true }) title = '';
  @Input() open = true;
  @Input() panelClass = '';
}
