import { Injectable, inject } from '@angular/core';

import { Flow } from '../../domain/flow/flow.types';
import { ExportFlowJsonUseCase } from '../flow/export-flow-json.use-case';

@Injectable({
  providedIn: 'root'
})
export class ExportFlowToJsonUseCase {
  private readonly exportFlowJsonUseCase = inject(ExportFlowJsonUseCase);

  public execute(flow: Flow): string {
    return this.exportFlowJsonUseCase.execute(flow);
  }
}
