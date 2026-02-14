import { JsonObject } from '../../domain/flow/flow.types';
import { ToolContract, ToolExecutionRequest, ToolExecutionResult } from '../../domain/tools/tool.contract';
import { ToolCapabilities } from '../../domain/tools/tool-capabilities.types';

export interface HttpToolAdapterOptions {
  name: string;
  description: string;
  inputSchema: JsonObject;
  outputSchema: JsonObject;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  capabilities?: Partial<ToolCapabilities>;
}

export class HttpToolAdapter implements ToolContract {
  public readonly name: string;
  public readonly description: string;
  public readonly inputSchema: JsonObject;
  public readonly outputSchema: JsonObject;
  public readonly capabilities: ToolCapabilities;

  private readonly endpoint: string;
  private readonly method: HttpToolAdapterOptions['method'];
  private readonly headers: Record<string, string>;

  public constructor(options: HttpToolAdapterOptions) {
    this.name = options.name;
    this.description = options.description;
    this.inputSchema = options.inputSchema;
    this.outputSchema = options.outputSchema;
    this.endpoint = options.endpoint;
    this.method = options.method ?? 'POST';
    this.headers = options.headers ?? {};
    this.capabilities = {
      executionMode: options.capabilities?.executionMode ?? 'async',
      streaming: options.capabilities?.streaming ?? 'none',
      sideEffectLevel: options.capabilities?.sideEffectLevel ?? 'external'
    };
  }

  public async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const response = await fetch(this.endpoint, {
      method: this.method,
      headers: {
        'content-type': 'application/json',
        ...this.headers
      },
      body: JSON.stringify(request.input)
    });

    if (!response.ok) {
      throw {
        code: 'TOOL_HTTP_ERROR',
        message: `HTTP tool ${this.name} failed with status ${response.status}.`,
        recoverable: response.status >= 500,
        details: { status: response.status }
      };
    }

    const output = (await response.json()) as unknown;
    return { output, metadata: { status: response.status } };
  }
}
