import { AnyFlowNode } from '../../domain/flow/flow.types';
import { NodeExecutionData, NodeExecutionOutcome } from '../engine/execution-state';

export abstract class NodeExecutorPort {
  public abstract canExecute(node: AnyFlowNode): boolean;

  public abstract execute(data: NodeExecutionData): Promise<NodeExecutionOutcome>;
}
