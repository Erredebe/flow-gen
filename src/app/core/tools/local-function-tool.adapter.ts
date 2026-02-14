import { ToolContract, ToolExecutionRequest, ToolExecutionResult } from '../../domain/tools/tool.contract';
import { ToolCapabilities } from '../../domain/tools/tool-capabilities.types';
import { JsonObject } from '../../domain/flow/flow.types';

export interface LocalFunctionToolAdapterOptions {
  name: string;
  description: string;
  inputSchema: JsonObject;
  outputSchema: JsonObject;
  capabilities?: Partial<ToolCapabilities>;
  handler: (request: ToolExecutionRequest) => Promise<ToolExecutionResult> | ToolExecutionResult;
}

export class LocalFunctionToolAdapter implements ToolContract {
  public readonly name: string;
  public readonly description: string;
  public readonly inputSchema: JsonObject;
  public readonly outputSchema: JsonObject;
  public readonly capabilities: ToolCapabilities;
  private readonly handler: LocalFunctionToolAdapterOptions['handler'];

  public constructor(options: LocalFunctionToolAdapterOptions) {
    this.name = options.name;
    this.description = options.description;
    this.inputSchema = options.inputSchema;
    this.outputSchema = options.outputSchema;
    this.handler = options.handler;
    this.capabilities = {
      executionMode: options.capabilities?.executionMode ?? 'sync',
      streaming: options.capabilities?.streaming ?? 'none',
      sideEffectLevel: options.capabilities?.sideEffectLevel ?? 'none'
    };
  }

  public async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    return this.handler(request);
  }
}
