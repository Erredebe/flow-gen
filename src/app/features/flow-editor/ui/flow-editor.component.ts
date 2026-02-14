import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AnyFlowNode, FlowEdge, FlowNodeType } from '../../../domain/flow/flow.types';
import { FlowEditorStateService } from '../state/flow-editor-state.service';

interface CanvasPoint {
  x: number;
  y: number;
}

@Component({
  selector: 'app-flow-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './flow-editor.component.html',
  styleUrl: './flow-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowEditorComponent {
  protected readonly state = inject(FlowEditorStateService);

  protected readonly zoom = signal(1);
  protected readonly selectedNodeId = signal<string | null>(null);
  protected readonly selectedEdgeId = signal<string | null>(null);
  protected readonly linkingSourceNodeId = signal<string | null>(null);
  protected readonly metadataDraft = signal('{}');
  protected readonly metadataError = signal<string | null>(null);

  protected readonly flow = computed(() => this.state.getDraft());
  protected readonly nodes = computed(() => this.flow().nodes);
  protected readonly edges = computed(() => this.flow().edges);
  protected readonly validationErrors = computed(() => this.state.getValidationErrors());

  protected readonly selectedNode = computed(() => {
    const nodeId = this.selectedNodeId();
    return this.nodes().find((node) => node.id === nodeId) ?? null;
  });

  protected readonly selectedEdge = computed(() => {
    const edgeId = this.selectedEdgeId();
    return this.edges().find((edge) => edge.id === edgeId) ?? null;
  });

  protected readonly edgeSegments = computed(() =>
    this.edges()
      .map((edge) => {
        const source = this.state.findNodeById(edge.sourceNodeId);
        const target = this.state.findNodeById(edge.targetNodeId);

        if (!source || !target) {
          return null;
        }

        return {
          edge,
          source: getNodeCenter(source),
          target: getNodeCenter(target)
        };
      })
      .filter((segment): segment is { edge: FlowEdge; source: CanvasPoint; target: CanvasPoint } =>
        Boolean(segment)
      )
  );

  protected selectNode(node: AnyFlowNode): void {
    if (this.linkingSourceNodeId()) {
      const sourceNodeId = this.linkingSourceNodeId();
      if (sourceNodeId && sourceNodeId !== node.id) {
        this.state.createEdge(sourceNodeId, node.id);
      }
      this.cancelLinking();
      return;
    }

    this.selectedNodeId.set(node.id);
    this.selectedEdgeId.set(null);
    this.metadataDraft.set(JSON.stringify(node.metadata ?? {}, null, 2));
    this.metadataError.set(null);
  }

  protected selectEdge(edgeId: string): void {
    this.selectedEdgeId.set(edgeId);
    this.selectedNodeId.set(null);
  }

  protected deleteSelected(): void {
    const nodeId = this.selectedNodeId();
    if (nodeId) {
      this.state.removeNode(nodeId);
      this.selectedNodeId.set(null);
      return;
    }

    const edgeId = this.selectedEdgeId();
    if (edgeId) {
      this.state.removeEdge(edgeId);
      this.selectedEdgeId.set(null);
    }
  }

  protected addNode(type: FlowNodeType): void {
    const nodeId = this.state.createNode(type);
    this.selectedNodeId.set(nodeId);
    this.selectedEdgeId.set(null);
    const createdNode = this.state.findNodeById(nodeId);
    this.metadataDraft.set(JSON.stringify(createdNode?.metadata ?? {}, null, 2));
  }

  protected startLinkFromSelected(): void {
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return;
    }

    this.linkingSourceNodeId.set(nodeId);
    this.selectedEdgeId.set(null);
  }

  protected cancelLinking(): void {
    this.linkingSourceNodeId.set(null);
  }

  protected onNodeDragStart(event: DragEvent, nodeId: string): void {
    if (!event.dataTransfer) {
      return;
    }

    event.dataTransfer.setData('text/node-id', nodeId);
    event.dataTransfer.effectAllowed = 'move';
  }

  protected allowCanvasDrop(event: DragEvent): void {
    event.preventDefault();
  }

  protected onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    const nodeId = event.dataTransfer?.getData('text/node-id');
    if (!nodeId) {
      return;
    }

    const canvas = event.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / this.zoom() - 80;
    const y = (event.clientY - rect.top) / this.zoom() - 30;
    this.state.moveNode(nodeId, { x, y });
  }

  protected setZoom(delta: number): void {
    this.zoom.update((currentZoom) => Math.max(0.4, Math.min(2, currentZoom + delta)));
  }

  protected centerView(): void {
    const container = document.querySelector<HTMLElement>('.flow-canvas-container');
    if (!container) {
      return;
    }

    container.scrollTo({
      left: Math.max(0, 1000 * this.zoom() - container.clientWidth / 2),
      top: Math.max(0, 500 * this.zoom() - container.clientHeight / 2),
      behavior: 'smooth'
    });
  }

  protected updateFlowName(name: string): void {
    this.state.renameFlow(name);
  }

  protected updateNodeLabel(label: string): void {
    const nodeId = this.selectedNodeId();
    if (nodeId) {
      this.state.updateNode(nodeId, { label });
    }
  }

  protected updateNodeCondition(condition: string): void {
    const nodeId = this.selectedNodeId();
    if (nodeId) {
      this.state.updateNode(nodeId, { condition });
    }
  }

  protected updateMetadata(rawValue: string): void {
    this.metadataDraft.set(rawValue);
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return;
    }

    try {
      const parsed = JSON.parse(rawValue) as Record<string, string>;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        this.metadataError.set('Los metadatos deben ser un objeto JSON.');
        return;
      }

      const sanitized = Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {});

      this.metadataError.set(null);
      this.state.updateNode(nodeId, { metadata: sanitized });
    } catch {
      this.metadataError.set('JSON de metadatos inválido.');
    }
  }

  protected minimapPoint(value: number): number {
    return value * 0.08;
  }
}

function getNodeCenter(node: AnyFlowNode): CanvasPoint {
  return {
    x: node.position.x + 80,
    y: node.position.y + 30
  };
}
