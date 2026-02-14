import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FlowEditorStateService } from '../state/flow-editor-state.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPageComponent {
  private readonly state = inject(FlowEditorStateService);

  protected readonly storageDraft = signal(this.state.getDraftJson());
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected updateStorageDraft(value: string): void {
    this.storageDraft.set(value);
  }

  protected loadFromStorage(): void {
    const loaded = this.state.loadFromStorage();
    if (!loaded) {
      this.error.set('No hay información en localStorage para cargar.');
      this.message.set(null);
      return;
    }

    this.storageDraft.set(this.state.getDraftJson());
    this.message.set('Información cargada desde localStorage.');
    this.error.set(null);
  }

  protected saveStorageDraft(): void {
    const result = this.state.importFromJson(this.storageDraft());
    if (!result.success) {
      this.error.set(result.error);
      this.message.set(null);
      return;
    }

    this.storageDraft.set(this.state.getDraftJson());
    this.message.set('Cambios guardados en el editor y localStorage.');
    this.error.set(null);
  }

  protected clearStorage(): void {
    this.state.clearStorageAndRestoreDefault();
    this.storageDraft.set(this.state.getDraftJson());
    this.message.set('localStorage limpiado. Se restauró un flujo inicial.');
    this.error.set(null);
  }
}
