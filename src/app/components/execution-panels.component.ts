import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CollapsiblePanelComponent } from './collapsible-panel.component';

@Component({
  selector: 'app-execution-panels',
  standalone: true,
  imports: [CommonModule, CollapsiblePanelComponent],
  templateUrl: './execution-panels.component.html'
})
export class ExecutionPanelsComponent {
  @Input({ required: true }) validationErrors: string[] = [];
  @Input({ required: true }) logs: string[] = [];
  @Input({ required: true }) logsFirst = false;

  @Output() resetConsole = new EventEmitter<void>();
}
