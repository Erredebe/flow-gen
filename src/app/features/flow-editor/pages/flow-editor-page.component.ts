import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FlowEditorComponent } from '../ui/flow-editor.component';

@Component({
  selector: 'app-flow-editor-page',
  standalone: true,
  imports: [FlowEditorComponent],
  templateUrl: './flow-editor-page.component.html',
  styleUrl: './flow-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowEditorPageComponent {}
