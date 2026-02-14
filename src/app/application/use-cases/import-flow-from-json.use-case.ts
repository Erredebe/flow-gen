import { Injectable, inject } from '@angular/core';

import { safeParseJson } from '../../core/utils/json.utils';
import { Flow } from '../../domain/flow/flow.types';
import { FlowMigrationPipeline } from '../../domain/flow/migrations/flow-migration.pipeline';
import { validateFlowSchema } from '../../domain/services/flow-schema-validator.service';
import { SaveFlowUseCase } from '../flow/save-flow.use-case';
import { ValidateFlowUseCase } from '../flow/validate-flow.use-case';

export interface ImportFlowSuccess {
  success: true;
  flow: Flow;
}

export interface ImportFlowFailure {
  success: false;
  error: string;
}

export type ImportFlowResult = ImportFlowSuccess | ImportFlowFailure;

@Injectable({
  providedIn: 'root'
})
export class ImportFlowFromJsonUseCase {
  private readonly validateFlowUseCase = inject(ValidateFlowUseCase);
  private readonly saveFlowUseCase = inject(SaveFlowUseCase);
  private readonly flowMigrationPipeline = inject(FlowMigrationPipeline);

  public execute(payload: string): ImportFlowResult {
    const parsedFlow = safeParseJson<unknown>(payload);
    if (!parsedFlow) {
      return {
        success: false,
        error: 'JSON inválido. Verifica la sintaxis del archivo o textarea.'
      };
    }

    const migratedFlow = this.flowMigrationPipeline.migrate(parsedFlow);

    const schemaValidationError = validateFlowSchema(migratedFlow);
    if (schemaValidationError) {
      return { success: false, error: schemaValidationError };
    }

    const flow = migratedFlow;

    const domainErrors = this.validateFlowUseCase.execute(flow);
    if (domainErrors.length > 0) {
      const details = domainErrors.map((error) => `• ${error.message}`).join('\n');
      return {
        success: false,
        error: `El flujo no cumple las reglas del dominio:\n${details}`
      };
    }

    this.saveFlowUseCase.execute(flow);
    return { success: true, flow };
  }
}
