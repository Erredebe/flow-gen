import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-execution-panels',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './execution-panels.component.html'
})
export class ExecutionPanelsComponent {
  @Input({ required: true }) validationErrors: string[] = [];
  @Input({ required: true }) logs: string[] = [];

  @Output() resetConsole = new EventEmitter<void>();
}
