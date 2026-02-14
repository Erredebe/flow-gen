import { ENVIRONMENT_INITIALIZER, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { InMemoryNodeDefinitionRegistryService } from './app/core/flow/in-memory-node-definition-registry.service';
import { RegistryNodeExecutorAdapter } from './app/core/tools/registry-node-executor.adapter';
import { InMemoryToolRegistryAdapter } from './app/core/tools/in-memory-tool-registry.adapter';
import { LocalFunctionToolAdapter } from './app/core/tools/local-function-tool.adapter';
import { ToolExecutorAdapter } from './app/core/tools/tool-executor.adapter';
import { LocalStorageFlowRepository } from './app/core/storage/local-storage-flow.repository';
import { UuidIdGeneratorService } from './app/core/utils/uuid-id-generator.service';
import { LocalRunRepository } from './app/core/storage/local-run.repository';
import { FlowRepository } from './app/domain/ports/flow-repository.port';
import { IdGenerator } from './app/domain/ports/id-generator.port';
import { NodeDefinitionRegistry } from './app/domain/ports/node-definition-registry.port';
import { ToolExecutorPort } from './app/domain/ports/tool-executor.port';
import { ToolRegistryPort } from './app/domain/ports/tool-registry.port';
import { NodeExecutorPort } from './app/runtime/ports/node-executor.port';
import { RunRepositoryPort } from './app/domain/ports/run-repository.port';

const registerDefaultTools = (): void => {
  const toolRegistry = inject(ToolRegistryPort);

  const readConfig = (input: unknown): Record<string, unknown> => {
    if (typeof input !== 'object' || input === null) {
      return {};
    }

    const payload = input as Record<string, unknown>;
    if (typeof payload['config'] === 'object' && payload['config'] !== null) {
      return payload['config'] as Record<string, unknown>;
    }

    return payload;
  };

  toolRegistry.register(
    new LocalFunctionToolAdapter({
      name: 'browser.console.log',
      description: 'Imprime mensajes en consola durante la ejecución del flujo.',
      inputSchema: { type: 'object', additionalProperties: true },
      outputSchema: { type: 'object', additionalProperties: true },
      capabilities: { sideEffectLevel: 'write' },
      handler: ({ input }) => {
        const config = readConfig(input);
        const message = typeof config['message'] === 'string' ? config['message'] : 'Mensaje sin contenido';
        console.log(`[flow-gen:console.log] ${message}`);

        return {
          output: {
            logged: true,
            message
          }
        };
      }
    })
  );

  toolRegistry.register(
    new LocalFunctionToolAdapter({
      name: 'browser.alert',
      description: 'Muestra una alerta nativa del navegador.',
      inputSchema: { type: 'object', additionalProperties: true },
      outputSchema: { type: 'object', additionalProperties: true },
      capabilities: { sideEffectLevel: 'external' },
      handler: ({ input }) => {
        const config = readConfig(input);
        const message = typeof config['message'] === 'string' ? config['message'] : 'Alerta del flujo';

        if (typeof globalThis.alert === 'function') {
          globalThis.alert(message);
        }

        return {
          output: {
            alerted: true,
            message
          }
        };
      }
    })
  );

  toolRegistry.register(
    new LocalFunctionToolAdapter({
      name: 'helpers.to-upper-case',
      description: 'Convierte un texto a mayúsculas.',
      inputSchema: { type: 'object', additionalProperties: true },
      outputSchema: { type: 'object', additionalProperties: true },
      handler: ({ input }) => {
        const config = readConfig(input);
        const rawText = typeof config['text'] === 'string' ? config['text'] : '';

        return {
          output: {
            original: rawText,
            transformed: rawText.toUpperCase()
          }
        };
      }
    })
  );
};

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    { provide: FlowRepository, useClass: LocalStorageFlowRepository },
    { provide: IdGenerator, useClass: UuidIdGeneratorService },
    { provide: NodeDefinitionRegistry, useClass: InMemoryNodeDefinitionRegistryService },
    { provide: NodeExecutorPort, useClass: RegistryNodeExecutorAdapter },
    { provide: ToolRegistryPort, useClass: InMemoryToolRegistryAdapter },
    { provide: ToolExecutorPort, useClass: ToolExecutorAdapter },
    { provide: RunRepositoryPort, useClass: LocalRunRepository }
  ]
}).catch((error: unknown) => {
  console.error('Error bootstrapping application', error);
});
