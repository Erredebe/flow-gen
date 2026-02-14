import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';

import { ExportFlowToJsonUseCase } from '../../../application/use-cases/export-flow-to-json.use-case';

@Component({
  selector: 'app-json-view-page',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './json-view-page.component.html',
  styleUrl: './json-view-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonViewPageComponent {
  private readonly exportFlowToJson = inject(ExportFlowToJsonUseCase);

  protected readonly flowJson = this.exportFlowToJson.execute();
}
