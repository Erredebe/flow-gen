import { Injectable, inject } from '@angular/core';

import { Flow } from '../../domain/flow/flow.types';
import { ExecutionContext, ExecutionResult } from '../../runtime/engine/execution-state';
import { FlowExecutionEngine } from '../../runtime/engine/flow-execution-engine';

@Injectable({
  providedIn: 'root'
})
export class RunFlowUseCase {
  private readonly flowExecutionEngine = inject(FlowExecutionEngine);

  public execute(flow: Flow, context: ExecutionContext): Promise<ExecutionResult> {
    return this.flowExecutionEngine.run(flow, context);
  }
}
