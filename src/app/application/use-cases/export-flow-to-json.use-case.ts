import { Injectable } from '@angular/core';

import { Flow } from '../../domain/flow/flow.types';

@Injectable({
  providedIn: 'root'
})
export class ExportFlowToJsonUseCase {
  public execute(flow: Flow): string {
    return JSON.stringify(flow, null, 2);
  }
}
