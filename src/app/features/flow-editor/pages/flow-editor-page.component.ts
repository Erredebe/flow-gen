import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';

import { FlowEditorStateService } from '../state/flow-editor-state.service';

@Component({
  selector: 'app-flow-editor-page',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './flow-editor-page.component.html',
  styleUrl: './flow-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowEditorPageComponent {
  protected readonly state = inject(FlowEditorStateService);
}
