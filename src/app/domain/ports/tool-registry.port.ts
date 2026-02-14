import { ToolContract } from '../tools/tool.contract';

export abstract class ToolRegistryPort {
  public abstract register(tool: ToolContract): void;
  public abstract getByName(name: string): ToolContract | undefined;
  public abstract list(): ReadonlyArray<ToolContract>;
}
