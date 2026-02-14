import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { ClearFlowStorageUseCase } from '../../../application/flow/clear-flow-storage.use-case';
import { ConnectNodesUseCase } from '../../../application/flow/connect-nodes.use-case';
import { CreateNodeUseCase } from '../../../application/flow/create-node.use-case';
import { DeleteNodeUseCase } from '../../../application/flow/delete-node.use-case';
import { ExportFlowJsonUseCase } from '../../../application/flow/export-flow-json.use-case';
import { LoadFlowUseCase } from '../../../application/flow/load-flow.use-case';
import { SaveFlowUseCase } from '../../../application/flow/save-flow.use-case';
import { ValidateFlowUseCase } from '../../../application/flow/validate-flow.use-case';
import {
  ImportFlowFailure,
  ImportFlowFromJsonUseCase,
  ImportFlowSuccess
} from '../../../application/use-cases/import-flow-from-json.use-case';
import { InitializeFlowUseCase } from '../../../application/use-cases/initialize-flow.use-case';
import { AnyFlowNode, Flow, FlowNodeType, NodePosition } from '../../../domain/flow/flow.types';

@Injectable({
  providedIn: 'root'
})
export class FlowEditorStateService {
  private readonly initializeFlowUseCase = inject(InitializeFlowUseCase);
  private readonly importFlowFromJsonUseCase = inject(ImportFlowFromJsonUseCase);
  private readonly exportFlowJsonUseCase = inject(ExportFlowJsonUseCase);
  private readonly saveFlowUseCase = inject(SaveFlowUseCase);
  private readonly loadFlowUseCase = inject(LoadFlowUseCase);
  private readonly clearFlowStorageUseCase = inject(ClearFlowStorageUseCase);
  private readonly validateFlowUseCase = inject(ValidateFlowUseCase);
  private readonly createNodeUseCase = inject(CreateNodeUseCase);
  private readonly connectNodesUseCase = inject(ConnectNodesUseCase);
  private readonly deleteNodeUseCase = inject(DeleteNodeUseCase);

  private readonly draft = signal<Flow>(this.normalizeFlow(this.initializeFlowUseCase.execute()));
  private readonly validationErrors = computed(() =>
    this.validateFlowUseCase.execute(this.draft(), { allowCycles: false })
  );

  public constructor() {
    effect(() => {
      this.saveFlowUseCase.execute(this.draft());
    });
  }

  public getDraft(): Flow {
    return this.draft();
  }

  public getValidationErrors() {
    return this.validationErrors();
  }

  public getDraftJson(): string {
    return this.exportFlowJsonUseCase.execute(this.draft());
  }

  public renameFlow(name: string): void {
    this.draft.update((flow) => ({
      ...flow,
      name
    }));
  }

  public createNode(nodeType: FlowNodeType): string {
    const result = this.createNodeUseCase.execute(this.draft(), nodeType);
    this.draft.set(result.flow);
    return result.nodeId;
  }

  public ensureStartNode(): string {
    const existingStart = this.draft().nodes.find((node) => node.nodeType === 'start');
    if (existingStart) {
      return existingStart.id;
    }

    return this.createNode('start');
  }

  public markNodeAsStart(nodeId: string): void {
    this.draft.update((flow) => ({
      ...flow,
      nodes: flow.nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, nodeType: 'start' };
        }

        if (node.nodeType === 'start') {
          return { ...node, nodeType: 'action' };
        }

        return node;
      })
    }));
  }

  public moveNode(nodeId: string, position: NodePosition): void {
    this.updateNode(nodeId, {
      position: {
        x: Math.max(0, Math.round(position.x)),
        y: Math.max(0, Math.round(position.y))
      }
    });
  }

  public updateNode(nodeId: string, patch: Partial<AnyFlowNode>): void {
    this.draft.update((flow) => ({
      ...flow,
      nodes: flow.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node))
    }));
  }

  public removeNode(nodeId: string): void {
    this.draft.update((flow) => this.deleteNodeUseCase.execute(flow, nodeId));
  }

  public createEdge(sourceNodeId: string, targetNodeId: string): void {
    this.draft.update((flow) => this.connectNodesUseCase.execute(flow, sourceNodeId, targetNodeId));
  }

  public removeEdge(edgeId: string): void {
    this.draft.update((flow) => ({
      ...flow,
      edges: flow.edges.filter((edge) => edge.id !== edgeId)
    }));
  }

  public findNodeById(nodeId: string): AnyFlowNode | undefined {
    return this.draft().nodes.find((node) => node.id === nodeId);
  }

  public replaceFlow(flow: Flow): void {
    this.draft.set(this.normalizeFlow(flow));
  }

  public importFromJson(payload: string): ImportFlowSuccess | ImportFlowFailure {
    const result = this.importFlowFromJsonUseCase.execute(payload);
    if (result.success) {
      this.draft.set(this.normalizeFlow(result.flow));
    }

    return result;
  }

  public loadFromStorage(): boolean {
    const storedFlow = this.loadFlowUseCase.execute();
    if (!storedFlow) {
      return false;
    }

    this.draft.set(this.normalizeFlow(storedFlow));
    return true;
  }

  public clearStorageAndRestoreDefault(): void {
    this.clearFlowStorageUseCase.execute();
    this.draft.set(this.normalizeFlow(this.initializeFlowUseCase.execute()));
  }

  private normalizeFlow(flow: Flow): Flow {
    return {
      ...flow,
      nodes: flow.nodes.map((node, index) => {
        const currentNodeType = node.nodeType ?? (node as AnyFlowNode & { type?: string }).type ?? 'action';

        return {
          ...node,
          nodeType: currentNodeType,
          version: node.version ?? '1.0.0',
          config: node.config ?? {},
          condition: node.condition ?? '',
          metadata: node.metadata ?? {},
          position: node.position ?? { x: 100 + index * 200, y: 120 }
        };
      })
    };
  }
}
