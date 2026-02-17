import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { MarkdownDocument } from '../models/flow.model';

@Component({
  selector: 'app-markdown-studio-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './markdown-studio-modal.component.html'
})
export class MarkdownStudioModalComponent {
  @Input({ required: true }) showMarkdownStudio = false;
  @Input({ required: true }) markdownDraftTitle = '';
  @Input({ required: true }) markdownDraftContent = '';
  @Input({ required: true }) markdownPreviewHtml: SafeHtml = '';
  @Input({ required: true }) markdownLibrary: MarkdownDocument[] = [];

  @Output() toggleMarkdownStudio = new EventEmitter<void>();
  @Output() markdownDraftTitleChange = new EventEmitter<string>();
  @Output() markdownDraftContentChange = new EventEmitter<string>();
  @Output() generateMarkdownFromFlow = new EventEmitter<void>();
  @Output() saveMarkdownDraft = new EventEmitter<void>();
  @Output() exportSelectedMarkdown = new EventEmitter<void>();
  @Output() loadMarkdownForEditing = new EventEmitter<string>();
  @Output() deleteMarkdown = new EventEmitter<string>();
}
