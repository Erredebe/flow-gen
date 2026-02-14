import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { ExportFlowToJsonUseCase } from '../../../application/use-cases/export-flow-to-json.use-case';
import {
  ImportFlowFailure,
  ImportFlowFromJsonUseCase,
  ImportFlowSuccess
} from '../../../application/use-cases/import-flow-from-json.use-case';
import { InitializeFlowUseCase } from '../../../application/use-cases/initialize-flow.use-case';
import { AnyFlowNode, Flow, FlowNodeType, NodePosition } from '../../../domain/flow/flow.types';
import { validateFlow } from '../../../domain/flow/flow.validators';
import { FlowRepository } from '../../../domain/ports/flow-repository.port';

@Injectable({
  providedIn: 'root'
})
export class FlowEditorStateService {
  private readonly initializeFlowUseCase = inject(InitializeFlowUseCase);
  private readonly importFlowFromJsonUseCase = inject(ImportFlowFromJsonUseCase);
  private readonly exportFlowToJsonUseCase = inject(ExportFlowToJsonUseCase);
  private readonly flowRepository = inject(FlowRepository);

  private readonly draft = signal<Flow>(this.normalizeFlow(this.initializeFlowUseCase.execute()));
  private readonly validationErrors = computed(() => validateFlow(this.draft(), { allowCycles: false }));

  public constructor() {
    effect(() => {
      const flow = this.draft();
      this.flowRepository.save(flow);
    });
  }

  public getDraft(): Flow {
    return this.draft();
  }

  public getValidationErrors() {
    return this.validationErrors();
  }

  public getDraftJson(): string {
    return this.exportFlowToJsonUseCase.execute(this.draft());
  }

  public renameFlow(name: string): void {
    this.draft.update((flow) => ({
      ...flow,
      name
    }));
  }

  public createNode(type: FlowNodeType): string {
    const nodeId = `${type}-${crypto.randomUUID().slice(0, 8)}`;

    this.draft.update((flow) => {
      const nextIndex = flow.nodes.length;
      const node: AnyFlowNode = {
        id: nodeId,
        type,
        label: this.getDefaultLabel(type),
        condition: '',
        position: {
          x: 200 + (nextIndex % 5) * 220,
          y: 120 + Math.floor(nextIndex / 5) * 140
        },
        metadata: {}
      };

      return {
        ...flow,
        nodes: [...flow.nodes, node]
      };
    });

    return nodeId;
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
    this.draft.update((flow) => ({
      ...flow,
      nodes: flow.nodes.filter((node) => node.id !== nodeId),
      edges: flow.edges.filter((edge) => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId)
    }));
  }

  public createEdge(sourceNodeId: string, targetNodeId: string): void {
    if (sourceNodeId === targetNodeId) {
      return;
    }

    this.draft.update((flow) => {
      const exists = flow.edges.some(
        (edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId
      );

      if (exists) {
        return flow;
      }

      return {
        ...flow,
        edges: [
          ...flow.edges,
          {
            id: `edge-${crypto.randomUUID().slice(0, 8)}`,
            sourceNodeId,
            targetNodeId
          }
        ]
      };
    });
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

  private normalizeFlow(flow: Flow): Flow {
    return {
      ...flow,
      nodes: flow.nodes.map((node, index) => ({
        ...node,
        condition: node.condition ?? '',
        metadata: node.metadata ?? {},
        position: node.position ?? { x: 100 + index * 200, y: 120 }
      }))
    };
  }

  private getDefaultLabel(type: FlowNodeType): string {
    switch (type) {
      case 'start':
        return 'Inicio';
      case 'decision':
        return 'Nueva decisión';
      case 'end':
        return 'Fin';
      default:
        return 'Nueva acción';
    }
  }
}
