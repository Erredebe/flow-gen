import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FlowEditorStateService } from '../state/flow-editor-state.service';

@Component({
  selector: 'app-json-view-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './json-view-page.component.html',
  styleUrl: './json-view-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonViewPageComponent {
  private readonly state = inject(FlowEditorStateService);

  @ViewChild('fileInput')
  private readonly fileInput?: ElementRef<HTMLInputElement>;

  protected readonly jsonDraft = signal(this.state.getDraftJson());
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected downloadJson(): void {
    const content = this.state.getDraftJson();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.state.getDraft().id}.json`;
    anchor.click();

    URL.revokeObjectURL(url);
    this.message.set('Flujo exportado correctamente.');
    this.error.set(null);
  }

  protected onJsonDraftChange(value: string): void {
    this.jsonDraft.set(value);
  }

  protected loadFromTextarea(): void {
    this.importJson(this.jsonDraft());
  }

  protected onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) {
      return;
    }

    file
      .text()
      .then((content) => {
        this.jsonDraft.set(content);
        this.importJson(content);
      })
      .catch(() => {
        this.error.set('No se pudo leer el archivo seleccionado.');
        this.message.set(null);
      })
      .finally(() => {
        if (this.fileInput?.nativeElement) {
          this.fileInput.nativeElement.value = '';
        }
      });
  }

  private importJson(payload: string): void {
    const result = this.state.importFromJson(payload);

    if (!result.success) {
      this.error.set(result.error);
      this.message.set(null);
      return;
    }

    this.jsonDraft.set(this.state.getDraftJson());
    this.message.set('Flujo cargado correctamente.');
    this.error.set(null);
  }
}
