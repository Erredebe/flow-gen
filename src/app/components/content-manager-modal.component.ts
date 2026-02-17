import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FlowDefinition, FlowNode, MarkdownDocument, ScriptSnippet } from '../models/flow.model';

@Component({
  selector: 'app-content-manager-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-manager-modal.component.html'
})
export class ContentManagerModalComponent {
  @Input({ required: true }) showContentManager = false;
  @Input({ required: true }) savedFlows: FlowDefinition[] = [];
  @Input({ required: true }) markdownLibrary: MarkdownDocument[] = [];
  @Input({ required: true }) scriptLibrary: ScriptSnippet[] = [];
  @Input({ required: true }) selectedNode?: FlowNode;

  @Output() toggleContentManager = new EventEmitter<void>();
  @Output() loadFlow = new EventEmitter<string>();
  @Output() deleteFlow = new EventEmitter<string>();
  @Output() openMarkdownStudio = new EventEmitter<string>();
  @Output() deleteMarkdown = new EventEmitter<string>();
  @Output() applySavedScript = new EventEmitter<string>();
  @Output() deleteSavedScript = new EventEmitter<string>();
}
