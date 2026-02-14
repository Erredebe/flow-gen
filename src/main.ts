import { ENVIRONMENT_INITIALIZER, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { InMemoryNodeDefinitionRegistryService } from './app/core/flow/in-memory-node-definition-registry.service';
import { LocalRunRepository } from './app/core/storage/local-run.repository';
import { LocalStorageFlowRepository } from './app/core/storage/local-storage-flow.repository';
import { InMemoryToolRegistryAdapter } from './app/core/tools/in-memory-tool-registry.adapter';
import { LocalFunctionToolAdapter } from './app/core/tools/local-function-tool.adapter';
import { RegistryNodeExecutorAdapter } from './app/core/tools/registry-node-executor.adapter';
import { ToolExecutorAdapter } from './app/core/tools/tool-executor.adapter';
import { UuidIdGeneratorService } from './app/core/utils/uuid-id-generator.service';
import { FlowRepository } from './app/domain/ports/flow-repository.port';
import { IdGenerator } from './app/domain/ports/id-generator.port';
import { NodeDefinitionRegistry } from './app/domain/ports/node-definition-registry.port';
import { RunRepositoryPort } from './app/domain/ports/run-repository.port';
import { ToolExecutorPort } from './app/domain/ports/tool-executor.port';
import { ToolRegistryPort } from './app/domain/ports/tool-registry.port';
import { NodeExecutorPort } from './app/runtime/ports/node-executor.port';

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

  const executeJsonCommand = async (
    config: Record<string, unknown>,
    input: unknown
  ): Promise<Record<string, unknown>> => {
    const command = typeof config['command'] === 'string' ? config['command'] : '';
    const fn = typeof config['function'] === 'string' ? config['function'] : '';

    const context =
      typeof input === 'object' && input !== null
        ? (input as Record<string, unknown>)['context']
        : undefined;
    const upstreamOutputs =
      typeof input === 'object' && input !== null
        ? (input as Record<string, unknown>)['upstreamOutputs']
        : undefined;

    const run = async (source: string): Promise<unknown> => {
      const runnable = new Function(
        'input',
        'config',
        'context',
        'upstreamOutputs',
        `'use strict';\nreturn (async () => {\n${source}\n})();`
      );

      return runnable(input, config, context, upstreamOutputs);
    };

    if (!command && !fn) {
      throw {
        code: 'INVALID_JSON_COMMAND',
        message: 'La configuración debe incluir "command" (JS) o "function" (función JS en texto).',
        recoverable: false
      };
    }

    if (fn) {
      const evaluator = new Function(
        'input',
        'config',
        'context',
        'upstreamOutputs',
        `'use strict';\nconst userFn = (${fn});\nif (typeof userFn !== 'function') {\n  throw new Error('config.function no es una función válida');\n}\nreturn userFn({ input, config, context, upstreamOutputs });`
      );

      const output = await evaluator(input, config, context, upstreamOutputs);
      return {
        executed: true,
        mode: 'function',
        output: output as unknown
      };
    }

    const output = await run(command);
    return {
      executed: true,
      mode: 'command',
      output: output as unknown
    };
  };

  toolRegistry.register(
    new LocalFunctionToolAdapter({
      name: 'browser.json-command',
      description:
        'Ejecuta código JavaScript definido en config JSON (command/function) para el nodo.',
      inputSchema: { type: 'object', additionalProperties: true },
      outputSchema: { type: 'object', additionalProperties: true },
      capabilities: { sideEffectLevel: 'external' },
      handler: async ({ input }) => {
        const config = readConfig(input);
        const result = await executeJsonCommand(config, input);

        return {
          output: result
        };
      }
    })
  );

  toolRegistry.register(
    new LocalFunctionToolAdapter({
      name: 'browser.console.log',
      description: 'Imprime mensajes en consola durante la ejecución del flujo.',
      inputSchema: { type: 'object', additionalProperties: true },
      outputSchema: { type: 'object', additionalProperties: true },
      capabilities: { sideEffectLevel: 'write' },
      handler: ({ input }) => {
        const config = readConfig(input);
        const message =
          typeof config['message'] === 'string' ? config['message'] : 'Mensaje sin contenido';
        // eslint-disable-next-line no-console
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
        const message =
          typeof config['message'] === 'string' ? config['message'] : 'Alerta del flujo';

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
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => registerDefaultTools()
    },
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
