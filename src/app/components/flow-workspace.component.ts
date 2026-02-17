import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextChange, NodeTemplate } from '../models/app-ui.model';
import { ExecutionContextSnapshot, FlowConnection, FlowDefinition, FlowNode, NodeType, ScriptSnippet } from '../models/flow.model';
import { CollapsiblePanelComponent } from './collapsible-panel.component';

type PanelZone = 'left' | 'right' | 'bottom';

@Component({
  selector: 'app-flow-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, CollapsiblePanelComponent],
  templateUrl: './flow-workspace.component.html'
})
export class FlowWorkspaceComponent {
  @Input({ required: true }) templates: NodeTemplate[] = [];
  @Input({ required: true }) savedFlows: FlowDefinition[] = [];
  @Input({ required: true }) executionContext: Record<string, unknown> = {};
  @Input({ required: true }) contextHistory: ExecutionContextSnapshot[] = [];
  @Input({ required: true }) contextChangeLog: ContextChange[] = [];
  @Input({ required: true }) connections: FlowConnection[] = [];
  @Input({ required: true }) selectedConnectionId?: string;
  @Input({ required: true }) nodes: FlowNode[] = [];
  @Input({ required: true }) selectedNodeId?: string;
  @Input({ required: true }) activeNodeIds = new Set<string>();
  @Input({ required: true }) failedNodeIds = new Set<string>();
  @Input({ required: true }) connectingFrom?: { nodeId: string; fromPort: FlowConnection['fromPort'] };
  @Input({ required: true }) zoom = 1;
  @Input({ required: true }) panX = 0;
  @Input({ required: true }) panY = 0;
  @Input({ required: true }) selectedNode?: FlowNode;
  @Input({ required: true }) selectedConnection?: FlowConnection;
  @Input({ required: true }) scriptDraftName = '';
  @Input({ required: true }) selectedScriptId = '';
  @Input({ required: true }) scriptLibrary: ScriptSnippet[] = [];
  @Input({ required: true }) validationErrors: string[] = [];
  @Input({ required: true }) logs: string[] = [];
  @Input({ required: true }) panelSwapMode = false;
  @Input({ required: true }) panelZones: Record<string, PanelZone> = {};

  @Input({ required: true }) nodeLabel!: (nodeId: string) => string;
  @Input({ required: true }) contextEntries!: (context: Record<string, unknown>) => { key: string; value: string }[];
  @Input({ required: true }) getNodeColor!: (type: NodeType) => string;
  @Input({ required: true }) connectionPath!: (connection: FlowConnection) => string;

  @Output() addNode = new EventEmitter<NodeType>();
  @Output() loadFlow = new EventEmitter<string>();
  @Output() deleteFlow = new EventEmitter<string>();
  @Output() selectConnection = new EventEmitter<string>();
  @Output() removeConnection = new EventEmitter<string>();
  @Output() onWheel = new EventEmitter<WheelEvent>();
  @Output() onNodeClick = new EventEmitter<string>();
  @Output() onNodeDrag = new EventEmitter<{ event: MouseEvent; node: FlowNode }>();
  @Output() startConnect = new EventEmitter<{ nodeId: string; fromPort: FlowConnection['fromPort'] }>();
  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() resetZoom = new EventEmitter<void>();
  @Output() updateNode = new EventEmitter<void>();
  @Output() scriptDraftNameChange = new EventEmitter<string>();
  @Output() saveCurrentScript = new EventEmitter<void>();
  @Output() selectedScriptIdChange = new EventEmitter<string>();
  @Output() applySavedScript = new EventEmitter<string>();
  @Output() deleteSavedScript = new EventEmitter<string>();
  @Output() deleteSelectedNode = new EventEmitter<void>();
  @Output() updateConnection = new EventEmitter<void>();
  @Output() resetConsole = new EventEmitter<void>();
  @Output() movePanel = new EventEmitter<{ panelId: string; zone: PanelZone }>();

  isPanelIn(panelId: string, zone: PanelZone): boolean {
    return this.panelZones[panelId] === zone;
  }

  move(panelId: string, zone: PanelZone): void {
    this.movePanel.emit({ panelId, zone });
  }
}
