import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlowDefinition } from '../models/flow.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-header.component.html'
})
export class AppHeaderComponent {
  @Input({ required: true }) flowName = '';
  @Input({ required: true }) running = false;
  @Input({ required: true }) darkMode = false;
  @Input({ required: true }) showTutorial = false;
  @Input({ required: true }) tutorialText = '';
  @Input({ required: true }) demos: { name: string; flow: FlowDefinition }[] = [];

  @Output() flowNameChange = new EventEmitter<string>();
  @Output() newFlow = new EventEmitter<void>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() validateFlow = new EventEmitter<void>();
  @Output() runFlow = new EventEmitter<void>();
  @Output() saveFlow = new EventEmitter<void>();
  @Output() toggleContentManager = new EventEmitter<void>();
  @Output() toggleMarkdownStudio = new EventEmitter<void>();
  @Output() toggleDarkMode = new EventEmitter<void>();
  @Output() exportFlow = new EventEmitter<void>();
  @Output() exportFlowAsMarkdown = new EventEmitter<void>();
  @Output() importFlow = new EventEmitter<Event>();
  @Input({ required: true }) panelSwapMode = false;

  @Output() togglePanelSwapMode = new EventEmitter<void>();
  @Output() nextTutorialStep = new EventEmitter<void>();
  @Output() loadDemo = new EventEmitter<number>();
  @Output() closeTutorial = new EventEmitter<void>();
  @Output() openTutorial = new EventEmitter<void>();
}
